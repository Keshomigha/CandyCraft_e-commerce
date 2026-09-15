import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getProductById } from '../../api/productApi';
import { addToCart } from '../../api/cartApi';
import { addToWishlist, removeFromWishlist, checkWishlist } from '../../api/wishlistApi';
import { uploadCustomizationPhoto } from '../../api/uploadApi';
import { THEME_COLORS, PAINTING_SIZES, getCustomizableBadge } from '../../utils/categories';
import useAuth from '../../hooks/useAuth';
import ReportButton from '../../components/common/ReportButton';
import FitImage from '../../components/common/FitImage';

function StarRating({ rating = 0 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} className={`w-4 h-4 ${s <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 0 0 .95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 0 0-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 0 0-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 0 0-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 0 0 .951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);

  const [custom, setCustom] = useState({
    recipientName: '',
    giftMessage: '',
    themeColor: '',
    giftWrapping: false,
    greetingCard: false,
    specialInstructions: '',
    customMessage: '',
    optionalNotes: '',
    paintingSize: '',
    frameOption: false,
    caption: '',
  });

  const [photoUrl, setPhotoUrl] = useState('');
  const [photoPreview, setPhotoPreview] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileRef = useRef();

  // Stock (and status/price) can change from other buyers checking out or
  // the seller editing the listing while this page is sitting open, so the
  // fetch here is refreshed periodically and whenever the tab regains focus
  // rather than only once on mount — otherwise "In Stock"/"Out of Stock"
  // can silently go stale.
  const refreshProduct = (opts = {}) => {
    if (opts.showLoading) setLoading(true);
    return getProductById(id)
      .then((r) => { setProduct(r.data); setNotFound(false); })
      .catch(() => { if (opts.showLoading) setNotFound(true); })
      .finally(() => { if (opts.showLoading) setLoading(false); });
  };

  useEffect(() => {
    refreshProduct({ showLoading: true });

    if (user) {
      checkWishlist(id).then((r) => setInWishlist(Boolean(r.data?.wishlisted))).catch(() => {});
    }

    const interval = setInterval(() => refreshProduct(), 20000);
    const onFocus = () => refreshProduct();
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  const showToast = (msg, action = null) => {
    setToast({ text: msg, action });
    setTimeout(() => setToast(null), action ? 3500 : 2500);
  };

  const options = Array.isArray(product?.customization_options) ? product.customization_options : [];
  const isCustomizable = Boolean(product?.customizable);
  const isGreetingCard = product?.category === 'Greeting Cards';
  const isPainting = product?.category === 'Custom Paintings';

  const handlePhotoFile = async (file) => {
    if (!file) return;
    setPhotoPreview(URL.createObjectURL(file));
    setUploadingPhoto(true);
    try {
      const res = await uploadCustomizationPhoto(file);
      setPhotoUrl(res.data.url);
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not upload photo.');
      setPhotoPreview('');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    handlePhotoFile(e.dataTransfer.files?.[0]);
  };

  // A customization fee should only apply once the buyer actually filled in
  // or selected something — not just because the product supports
  // customization. Mirrors hasMeaningfulCustomization() on the backend.
  const hasMeaningfulCustomization = (payload) => {
    if (!payload) return false;
    return Object.values(payload).some((value) => {
      if (value === undefined || value === null || value === '') return false;
      if (typeof value === 'boolean') return value === true;
      return true;
    });
  };

  const buildRawCustomizationPayload = () => {
    if (!isCustomizable) return null;

    if (isGreetingCard) {
      return {
        recipientName: options.includes('customName') ? (custom.recipientName || undefined) : undefined,
        customMessage: options.includes('customMessage') ? (custom.customMessage || undefined) : undefined,
        optionalNotes: custom.optionalNotes || undefined,
      };
    }

    if (isPainting) {
      return {
        photoUrl: options.includes('photoUpload') ? (photoUrl || undefined) : undefined,
        paintingSize: custom.paintingSize || undefined,
        frameOption: options.includes('frameAvailable') ? custom.frameOption : undefined,
        caption: custom.caption || undefined,
        specialInstructions: custom.specialInstructions || undefined,
      };
    }

    const payload = { specialInstructions: custom.specialInstructions || undefined };
    if (options.includes('recipientName')) payload.recipientName = custom.recipientName || undefined;
    if (options.includes('giftMessage')) payload.giftMessage = custom.giftMessage || undefined;
    if (options.includes('themeColor')) payload.themeColor = custom.themeColor || undefined;
    if (options.includes('giftWrapping')) payload.giftWrapping = custom.giftWrapping;
    if (options.includes('greetingCard')) payload.greetingCard = custom.greetingCard;
    return payload;
  };

  const buildCustomizationPayload = () => {
    const payload = buildRawCustomizationPayload();
    return hasMeaningfulCustomization(payload) ? payload : null;
  };

  const isActuallyCustomized = hasMeaningfulCustomization(buildRawCustomizationPayload());

  const handleAddToCart = async ({ redirectAfter } = {}) => {
    if (!user) { navigate('/login'); return; }
    if (isPainting && options.includes('photoUpload') && uploadingPhoto) {
      showToast('Please wait for the photo to finish uploading.');
      return;
    }
    setBusy(true);
    try {
      await addToCart(product.id, 1, buildCustomizationPayload());
      refreshProduct();
      if (redirectAfter) {
        navigate('/buyer/cart');
      } else {
        showToast('Added to cart!', { label: 'View Cart', to: '/buyer/cart' });
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not add to cart.');
    } finally {
      setBusy(false);
    }
  };

  const toggleWishlist = async () => {
    if (!user) { navigate('/login'); return; }
    try {
      if (inWishlist) {
        await removeFromWishlist(product.id);
        setInWishlist(false);
      } else {
        await addToWishlist(product.id);
        setInWishlist(true);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not update wishlist.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F0EB] py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="h-96 bg-gray-200 rounded-2xl animate-pulse" />
          <div className="space-y-4">
            <div className="h-6 w-2/3 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-1/3 bg-gray-200 rounded animate-pulse" />
            <div className="h-24 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="min-h-screen bg-[#F5F0EB] flex flex-col items-center justify-center text-center px-4">
        <p className="text-5xl mb-4">🍬</p>
        <p className="text-gray-700 font-semibold text-lg">Product not found</p>
        <Link to="/products" className="mt-5 text-pink-500 hover:underline text-sm font-medium">← Back to Shop</Link>
      </div>
    );
  }

  const stockBadge = product.stock === 0
    ? { label: 'Out of Stock', className: 'bg-red-500 text-white' }
    : product.stock < 5
      ? { label: `Only ${product.stock} left`, className: 'bg-amber-500 text-white' }
      : { label: 'In Stock', className: 'bg-green-500 text-white' };

  const badge = getCustomizableBadge(product);

  return (
    <div className="min-h-screen bg-[#F5F0EB] py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/products" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-pink-500 transition-colors mb-6">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Shop
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="relative bg-orange-50 rounded-2xl overflow-hidden shadow-sm h-80 md:h-[420px]"
          >
            {product.image_url ? (
              <FitImage src={`${import.meta.env.VITE_API_URL}${product.image_url}`} alt={product.name} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-8xl">🍬</div>
            )}
            <span className={`absolute top-4 left-4 text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-full shadow-sm ${stockBadge.className}`}>
              {stockBadge.label}
            </span>
            {badge && (
              <span className="absolute top-4 right-4 bg-white text-pink-600 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                {badge}
              </span>
            )}
          </motion.div>

          {/* Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {product.shop_name && (
              <p className="text-sm text-gray-400 font-medium mb-1">{product.shop_name}</p>
            )}
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">{product.name}</h1>
              <div className="flex gap-2 flex-shrink-0">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={toggleWishlist}
                  className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm border transition-colors
                    ${inWishlist ? 'bg-pink-500 border-pink-500 text-white' : 'bg-white border-gray-200 text-gray-400 hover:text-pink-500'}`}
                >
                  <svg className="w-5 h-5" fill={inWishlist ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 0 1 6.364 0L12 7.636l1.318-1.318a4.5 4.5 0 0 1 6.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 0 1 0-6.364z" />
                  </svg>
                </motion.button>
                <ReportButton targetType="product" targetId={product.id} targetLabel={product.name} />
              </div>
            </div>

            <div className="flex items-center gap-2 mt-2 mb-4">
              <StarRating rating={product.avg_rating} />
              <span className="text-sm text-gray-400">
                {product.review_count > 0 ? `${Number(product.avg_rating).toFixed(1)} (${product.review_count} review${product.review_count !== 1 ? 's' : ''})` : 'No reviews yet'}
              </span>
              {product.category && (
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full ml-2">
                  {product.category}
                </span>
              )}
            </div>

            <p className="text-3xl font-extrabold text-pink-500 mb-4">₹{Number(product.price).toFixed(2)}</p>

            {product.description && (
              <p className="text-gray-500 text-sm leading-relaxed mb-6">{product.description}</p>
            )}

            {/* ── Greeting Card personalization ── */}
            {isCustomizable && isGreetingCard && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="bg-orange-50 border-2 border-dashed border-[#F4A261] rounded-2xl p-5 mb-6"
              >
                <h2 className="font-bold text-gray-800 mb-1">💌 Personalize Your Card</h2>
                <p className="text-xs text-gray-500 mb-4">
                  {Number(product.customization_fee) > 0
                    ? `Personalize this card for an extra LKR ${Number(product.customization_fee).toFixed(2)}.`
                    : 'Personalize this card at no extra cost.'}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-4">
                    {options.includes('customName') && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-1.5">Recipient Name</label>
                        <input
                          value={custom.recipientName}
                          onChange={(e) => setCustom({ ...custom, recipientName: e.target.value })}
                          placeholder="Who is this card for?"
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#F4A261] focus:ring-2 focus:ring-orange-100 transition placeholder-gray-300 bg-white"
                        />
                      </div>
                    )}
                    {options.includes('customMessage') && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-1.5">
                          Custom Message
                          {product.customization_settings?.maxMessageLength && (
                            <span className="font-normal text-gray-400"> (max {product.customization_settings.maxMessageLength} characters)</span>
                          )}
                        </label>
                        <textarea
                          rows={4}
                          value={custom.customMessage}
                          maxLength={product.customization_settings?.maxMessageLength || undefined}
                          onChange={(e) => setCustom({ ...custom, customMessage: e.target.value })}
                          placeholder="Write your message..."
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#F4A261] focus:ring-2 focus:ring-orange-100 transition placeholder-gray-300 resize-none bg-white"
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1.5">Optional Notes <span className="font-normal text-gray-400">(optional)</span></label>
                      <textarea
                        rows={2}
                        value={custom.optionalNotes}
                        onChange={(e) => setCustom({ ...custom, optionalNotes: e.target.value })}
                        placeholder="Anything else the seller should know?"
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#F4A261] focus:ring-2 focus:ring-orange-100 transition placeholder-gray-300 resize-none bg-white"
                      />
                    </div>
                  </div>

                  {/* Live preview card */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col items-center justify-center text-center min-h-[180px]">
                    <span className="text-3xl mb-2">💌</span>
                    <p className="text-sm font-semibold text-gray-700">
                      Dear {custom.recipientName || '...'},
                    </p>
                    <p className="text-sm text-gray-500 mt-2 italic leading-relaxed">
                      {custom.customMessage || 'Your message will appear here'}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Custom Painting personalization ── */}
            {isCustomizable && isPainting && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="bg-orange-50 border-2 border-dashed border-[#F4A261] rounded-2xl p-5 mb-6"
              >
                <h2 className="font-bold text-gray-800 mb-1">🎨 Create Your Personalized Painting</h2>
                <p className="text-xs text-gray-500 mb-4">Personalize this painting at no extra cost.</p>

                <div className="space-y-4">
                  {options.includes('photoUpload') && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1.5">Upload Photo</label>
                      <div
                        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                        onDragLeave={() => setDragActive(false)}
                        onDrop={handleDrop}
                        onClick={() => fileRef.current?.click()}
                        className={`relative rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-center py-8 px-4 cursor-pointer transition-colors bg-white
                          ${dragActive ? 'border-[#F4A261] bg-orange-50' : 'border-gray-200 hover:border-[#F4A261]'}`}
                      >
                        <input
                          ref={fileRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handlePhotoFile(e.target.files?.[0])}
                        />
                        {photoPreview ? (
                          <div className="relative">
                            <img src={photoPreview} alt="Uploaded" className="max-h-40 rounded-lg object-contain" />
                            {uploadingPhoto && (
                              <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-lg">
                                <span className="text-xs font-semibold text-gray-600">Uploading…</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <>
                            <svg className="w-8 h-8 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-sm text-gray-500 font-medium">Drag & drop a photo, or click to browse</p>
                            <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP, or GIF. Max 5MB.</p>
                          </>
                        )}
                      </div>
                      {product.customization_settings?.numPhotosAllowed && (
                        <p className="text-xs text-gray-400 mt-1">
                          You may upload up to {product.customization_settings.numPhotosAllowed} photo{Number(product.customization_settings.numPhotosAllowed) > 1 ? 's' : ''}.
                        </p>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1.5">Painting Size</label>
                    <select
                      value={custom.paintingSize}
                      onChange={(e) => setCustom({ ...custom, paintingSize: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#F4A261] focus:ring-2 focus:ring-orange-100 transition bg-white text-gray-700"
                    >
                      <option value="">Select a size</option>
                      {PAINTING_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  {options.includes('frameAvailable') && (
                    <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={custom.frameOption}
                        onChange={(e) => setCustom({ ...custom, frameOption: e.target.checked })}
                        className="accent-[#F4A261]"
                      />
                      Add a frame
                    </label>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1.5">Name or Caption <span className="font-normal text-gray-400">(optional)</span></label>
                    <input
                      value={custom.caption}
                      onChange={(e) => setCustom({ ...custom, caption: e.target.value })}
                      placeholder="e.g. 'The Smith Family, 2026'"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#F4A261] focus:ring-2 focus:ring-orange-100 transition placeholder-gray-300 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1.5">Special Instructions <span className="font-normal text-gray-400">(optional)</span></label>
                    <textarea
                      rows={2}
                      value={custom.specialInstructions}
                      onChange={(e) => setCustom({ ...custom, specialInstructions: e.target.value })}
                      placeholder="Anything else the seller should know?"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#F4A261] focus:ring-2 focus:ring-orange-100 transition placeholder-gray-300 resize-none bg-white"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Generic customization ── */}
            {isCustomizable && !isGreetingCard && !isPainting && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="bg-orange-50 border-2 border-dashed border-[#F4A261] rounded-2xl p-5 mb-6"
              >
                <h2 className="font-bold text-gray-800 mb-1">✨ Customize Your Gift</h2>
                <p className="text-xs text-gray-500 mb-4">
                  {Number(product.customization_fee) > 0
                    ? `Personalize this item for an extra LKR ${Number(product.customization_fee).toFixed(2)}.`
                    : 'Personalize this item at no extra cost.'}
                </p>

                <div className="space-y-4">
                  {options.includes('recipientName') && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1.5">Recipient Name</label>
                      <input
                        value={custom.recipientName}
                        onChange={(e) => setCustom({ ...custom, recipientName: e.target.value })}
                        placeholder="Who is this gift for?"
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#F4A261] focus:ring-2 focus:ring-orange-100 transition placeholder-gray-300 bg-white"
                      />
                    </div>
                  )}

                  {options.includes('giftMessage') && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1.5">Gift Message</label>
                      <textarea
                        rows={3}
                        value={custom.giftMessage}
                        onChange={(e) => setCustom({ ...custom, giftMessage: e.target.value })}
                        placeholder="Write a short message to include..."
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#F4A261] focus:ring-2 focus:ring-orange-100 transition placeholder-gray-300 resize-none bg-white"
                      />
                    </div>
                  )}

                  {options.includes('themeColor') && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1.5">Theme Color</label>
                      <select
                        value={custom.themeColor}
                        onChange={(e) => setCustom({ ...custom, themeColor: e.target.value })}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#F4A261] focus:ring-2 focus:ring-orange-100 transition bg-white text-gray-700"
                      >
                        <option value="">Select a color</option>
                        {THEME_COLORS.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4">
                    {options.includes('giftWrapping') && (
                      <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={custom.giftWrapping}
                          onChange={(e) => setCustom({ ...custom, giftWrapping: e.target.checked })}
                          className="accent-[#F4A261]"
                        />
                        Gift Wrapping
                      </label>
                    )}
                    {options.includes('greetingCard') && (
                      <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={custom.greetingCard}
                          onChange={(e) => setCustom({ ...custom, greetingCard: e.target.checked })}
                          className="accent-[#F4A261]"
                        />
                        Greeting Card
                      </label>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1.5">Special Instructions <span className="font-normal text-gray-400">(optional)</span></label>
                    <textarea
                      rows={2}
                      value={custom.specialInstructions}
                      onChange={(e) => setCustom({ ...custom, specialInstructions: e.target.value })}
                      placeholder="Anything else the seller should know?"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#F4A261] focus:ring-2 focus:ring-orange-100 transition placeholder-gray-300 resize-none bg-white"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Running total — only reflects the customization fee once the
                buyer has actually filled in/selected something; otherwise
                it's just the base price. */}
            {isCustomizable && !isPainting && Number(product.customization_fee) > 0 && isActuallyCustomized && (
              <div className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 mb-4 text-sm">
                <span className="text-gray-500">
                  Item price + customization fee (₹{Number(product.customization_fee).toFixed(2)})
                </span>
                <span className="font-bold text-gray-800">
                  ₹{(Number(product.price) + Number(product.customization_fee)).toFixed(2)}
                </span>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <motion.button
                whileHover={{ scale: product.stock === 0 || busy ? 1 : 1.02 }}
                whileTap={{ scale: product.stock === 0 || busy ? 1 : 0.98 }}
                onClick={() => handleAddToCart({ redirectAfter: false })}
                disabled={product.stock === 0 || busy}
                className={`flex-1 py-3.5 rounded-full font-semibold text-sm transition-colors
                  ${product.stock === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'border-2 border-pink-500 text-pink-500 hover:bg-pink-50'}`}
              >
                + Add to Cart
              </motion.button>
              <motion.button
                whileHover={{ scale: product.stock === 0 || busy ? 1 : 1.02 }}
                whileTap={{ scale: product.stock === 0 || busy ? 1 : 0.98 }}
                onClick={() => handleAddToCart({ redirectAfter: true })}
                disabled={product.stock === 0 || busy}
                className={`flex-1 py-3.5 rounded-full font-semibold text-sm text-white transition-colors
                  ${product.stock === 0 ? 'bg-gray-200 cursor-not-allowed' : 'bg-pink-500 hover:bg-pink-600'}`}
              >
                Buy Now
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="fixed bottom-6 right-6 bg-gray-900 text-white text-sm px-5 py-3 rounded-xl shadow-lg z-50 flex items-center gap-3"
          >
            {toast.text}
            {toast.action && (
              <Link to={toast.action.to} className="font-semibold text-[#F4A261] hover:underline whitespace-nowrap">
                {toast.action.label} →
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
