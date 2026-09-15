import { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { getProducts } from '../../api/productApi';
import { getPublicSellers } from '../../api/sellerApi';
import { addToCart } from '../../api/cartApi';
import useAuth from '../../hooks/useAuth';
import ReportButton from '../../components/common/ReportButton';
import FitImage from '../../components/common/FitImage';
import { CATEGORY_LABELS, getCustomizableBadge } from '../../utils/categories';

const CATEGORIES = ['All', ...CATEGORY_LABELS];
const LIMIT = 12;

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest' },
];

const RATING_OPTIONS = [
  { value: '', label: 'Any Rating' },
  { value: '3', label: '3★ & up' },
  { value: '4', label: '4★ & up' },
  { value: '4.5', label: '4.5★ & up' },
];

const emojiFallbacks = ['🍬', '🎁', '🌹', '🍭', '🧁', '🍫'];
const bgFallbacks    = ['bg-red-50','bg-pink-50','bg-orange-50','bg-yellow-50','bg-green-50','bg-purple-50'];

const gridVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
};

function StarRating({ rating = 0 }) {
  return (
    <div className="flex">
      {[1,2,3,4,5].map((s) => (
        <svg key={s} className={`w-3.5 h-3.5 ${s <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 0 0 .95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 0 0-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 0 0-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 0 0-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 0 0 .951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function ProductCard({ product, onAddToCart }) {
  const idx     = product.id % bgFallbacks.length;
  const [added, setAdded] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const handleAdd = async () => {
    await onAddToCart(product.id);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const stockBadge = product.stock === 0
    ? { label: 'Out of Stock', className: 'bg-red-500 text-white' }
    : product.stock < 5
      ? { label: `Only ${product.stock} left`, className: 'bg-amber-500 text-white' }
      : { label: 'In Stock', className: 'bg-green-500 text-white' };

  return (
    <motion.div
      layout
      variants={cardVariants}
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300 group flex flex-col"
    >
      {/* Image */}
      <div className={`relative ${bgFallbacks[idx]} h-40 sm:h-44 overflow-hidden flex-shrink-0`}>
        {product.image_url ? (
          <>
            <FitImage
              src={`${import.meta.env.VITE_API_URL}${product.image_url}`}
              alt={product.name}
              onLoad={() => setImgLoaded(true)}
              imgClassName={`transition-all duration-500 group-hover:scale-105 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
            />
            {!imgLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-5xl">{emojiFallbacks[idx]}</span>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-5xl group-hover:scale-110 transition-transform duration-300">
              {emojiFallbacks[idx]}
            </span>
          </div>
        )}

        {/* Stock badge (availability) */}
        <span className={`absolute top-3 left-3 text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full shadow-sm ${stockBadge.className}`}>
          {stockBadge.label}
        </span>

        {/* Category badge */}
        {product.category && (
          <span className="absolute top-3 right-3 bg-gray-900/80 backdrop-blur-sm text-white text-[11px] font-semibold px-2.5 py-1 rounded-full">
            {product.category}
          </span>
        )}

        {/* Customizable badge */}
        {getCustomizableBadge(product) && (
          <span className="absolute bottom-3 left-3 bg-white text-pink-600 text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm">
            {getCustomizableBadge(product)}
          </span>
        )}

        {/* Wishlist + Report */}
        <div className="absolute bottom-3 right-3 flex gap-2">
          <motion.button
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow hover:text-pink-500 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 0 1 6.364 0L12 7.636l1.318-1.318a4.5 4.5 0 0 1 6.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 0 1 0-6.364z" />
            </svg>
          </motion.button>
          <ReportButton targetType="product" targetId={product.id} targetLabel={product.name} />
        </div>
      </div>

      {/* Info */}
      <div className="p-3 sm:p-4 flex-1 flex flex-col">
        {product.shop_name && (
          <p className="text-xs text-gray-400 font-medium mb-0.5 truncate">{product.shop_name}</p>
        )}
        <Link to={`/products/${product.id}`}>
          <h3 className="font-bold text-gray-800 text-sm sm:text-base mb-2 hover:text-pink-500 transition-colors line-clamp-1">
            {product.name}
          </h3>
        </Link>

        <div className="space-y-1.5 mb-4">
          <span className="block text-pink-500 font-bold text-base">₹{Number(product.price).toFixed(2)}</span>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <StarRating rating={product.avg_rating} />
            <span className="text-xs text-gray-400">
              {product.review_count > 0 ? `${Number(product.avg_rating).toFixed(1)} (${product.review_count})` : 'No reviews yet'}
            </span>
          </div>
        </div>

        <div className="mt-auto space-y-2">
          <Link
            to={`/products/${product.id}`}
            className="block text-center text-sm font-semibold text-pink-600 bg-pink-50 hover:bg-pink-100 rounded-xl py-2.5 transition-colors"
          >
            View Details
          </Link>
          <motion.button
            whileHover={{ scale: product.stock === 0 ? 1 : 1.02 }}
            whileTap={{ scale: product.stock === 0 ? 1 : 0.98 }}
            onClick={handleAdd}
            disabled={product.stock === 0 || added}
            className={`w-full text-sm font-semibold py-2.5 rounded-xl transition-colors duration-200
              ${added
                ? 'bg-green-500 text-white'
                : product.stock === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-pink-500 hover:bg-pink-600 text-white'}`}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={added ? 'added' : 'add'}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="inline-block"
              >
                {added ? '✓ Added to Cart' : '+ Add to Cart'}
              </motion.span>
            </AnimatePresence>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

export default function ProductListing() {
  const { user }              = useAuth();
  const navigate              = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts]     = useState([]);
  const [sellers, setSellers]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [cartMsg, setCartMsg]       = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const search     = searchParams.get('search') || '';
  const category   = searchParams.get('category') || 'All';
  const sort       = searchParams.get('sort') || 'relevance';
  const minPrice   = searchParams.get('minPrice') || '';
  const maxPrice   = searchParams.get('maxPrice') || '';
  const sellerId   = searchParams.get('sellerId') || '';
  const minRating  = searchParams.get('minRating') || '';
  const inStock    = searchParams.get('inStock') === 'true';
  const page       = Number(searchParams.get('page') || 1);

  const [priceDraft, setPriceDraft] = useState({ min: minPrice, max: maxPrice });

  useEffect(() => {
    getPublicSellers().then((r) => setSellers(r.data)).catch(() => {});
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const params = {
        limit: LIMIT,
        page,
        sort,
        ...(search && { search }),
        ...(category !== 'All' && { category }),
        ...(minPrice && { minPrice }),
        ...(maxPrice && { maxPrice }),
        ...(sellerId && { sellerId }),
        ...(minRating && { minRating }),
        ...(inStock && { inStock: 'true' }),
      };
      const res = await getProducts(params);
      setProducts(res.data.products);
      setTotalCount(res.data.total);
    } catch (err) {
      console.error(err);
      setError(true);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [search, category, sort, minPrice, maxPrice, sellerId, minRating, inStock, page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // Debounce price inputs before pushing to the URL (avoids a fetch per keystroke)
  useEffect(() => {
    const t = setTimeout(() => {
      if (priceDraft.min !== minPrice || priceDraft.max !== maxPrice) {
        const next = new URLSearchParams(searchParams);
        if (priceDraft.min) next.set('minPrice', priceDraft.min); else next.delete('minPrice');
        if (priceDraft.max) next.set('maxPrice', priceDraft.max); else next.delete('maxPrice');
        next.delete('page');
        setSearchParams(next);
      }
    }, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priceDraft]);

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    next.delete('page');
    setSearchParams(next);
  };

  const handleAddToCart = async (productId) => {
    if (!user) { navigate('/login'); return; }
    try {
      await addToCart(productId, 1);
      setCartMsg({ text: 'Added to cart!', ok: true });
      setTimeout(() => setCartMsg(null), 3500);
    } catch (err) {
      setCartMsg({ text: err.response?.data?.message || 'Could not add to cart', ok: false });
      setTimeout(() => setCartMsg(null), 3500);
    }
  };

  const totalPages = Math.ceil(totalCount / LIMIT);
  const activeFilterCount = [minPrice, maxPrice, sellerId, minRating, inStock ? '1' : ''].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#F5F0EB]">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white border-b border-gray-100"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            {search ? `Results for "${search}"` : 'Shop'}
          </h1>
          <p className="text-gray-400 text-sm">Discover handmade candy creations from student crafters</p>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search + category */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="relative flex-1 max-w-sm">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search products, shops, and categories"
              defaultValue={search}
              onChange={(e) => setParam('search', e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-full text-sm outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition"
            />
          </div>

          {/* Category filters */}
          <LayoutGroup id="category-filters">
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map((cat) => {
                const isActive = category === cat || (cat === 'All' && !searchParams.get('category'));
                return (
                  <motion.button
                    key={cat}
                    onClick={() => setParam('category', cat === 'All' ? '' : cat)}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    className={`relative isolate px-4 py-2 rounded-full text-sm font-medium transition-colors border
                      ${isActive ? 'text-white border-pink-500' : 'bg-white text-gray-600 border-gray-200 hover:border-pink-300'}`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="category-pill"
                        className="absolute inset-0 z-0 bg-pink-500 rounded-full"
                        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                      />
                    )}
                    <span className="relative z-10">{cat}</span>
                  </motion.button>
                );
              })}
            </div>
          </LayoutGroup>
        </div>

        {/* Filters + Sort toggle (mobile) */}
        <div className="flex items-center justify-between sm:hidden mb-3">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setFiltersOpen((o) => !o)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-700 border border-gray-200 bg-white rounded-full px-4 py-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M6 12h12M10 20h4" />
            </svg>
            Filters & Sort
            {activeFilterCount > 0 && (
              <span className="bg-pink-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{activeFilterCount}</span>
            )}
          </motion.button>
        </div>

        {/* Filters + Sort row */}
        <AnimatePresence initial={false}>
          {(filtersOpen || true) && (
            <motion.div
              initial={false}
              animate={{ height: 'auto', opacity: 1 }}
              className={`${filtersOpen ? 'block' : 'hidden'} sm:block bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6`}
            >
              <div className="flex flex-wrap items-end gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Sort By</label>
                  <select
                    value={sort}
                    onChange={(e) => setParam('sort', e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-pink-400 bg-white text-gray-700"
                  >
                    {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Price Range (₹)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number" min="0" placeholder="Min"
                      value={priceDraft.min}
                      onChange={(e) => setPriceDraft((p) => ({ ...p, min: e.target.value }))}
                      className="w-20 border border-gray-200 rounded-lg px-2.5 py-2 text-sm outline-none focus:border-pink-400"
                    />
                    <span className="text-gray-400">–</span>
                    <input
                      type="number" min="0" placeholder="Max"
                      value={priceDraft.max}
                      onChange={(e) => setPriceDraft((p) => ({ ...p, max: e.target.value }))}
                      className="w-20 border border-gray-200 rounded-lg px-2.5 py-2 text-sm outline-none focus:border-pink-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Shop</label>
                  <select
                    value={sellerId}
                    onChange={(e) => setParam('sellerId', e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-pink-400 bg-white text-gray-700 max-w-[160px]"
                  >
                    <option value="">All Shops</option>
                    {sellers.map((s) => <option key={s.id} value={s.id}>{s.shop_name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Rating</label>
                  <select
                    value={minRating}
                    onChange={(e) => setParam('minRating', e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-pink-400 bg-white text-gray-700"
                  >
                    {RATING_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>

                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer pb-2">
                  <input
                    type="checkbox"
                    checked={inStock}
                    onChange={(e) => setParam('inStock', e.target.checked ? 'true' : '')}
                    className="accent-pink-500 w-4 h-4"
                  />
                  In Stock Only
                </label>

                {activeFilterCount > 0 && (
                  <button
                    onClick={() => {
                      setPriceDraft({ min: '', max: '' });
                      const next = new URLSearchParams(searchParams);
                      ['minPrice', 'maxPrice', 'sellerId', 'minRating', 'inStock', 'page'].forEach((k) => next.delete(k));
                      setSearchParams(next);
                    }}
                    className="text-xs text-pink-500 font-semibold hover:underline pb-2.5"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cart toast */}
        <AnimatePresence>
          {cartMsg && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className="fixed bottom-6 right-6 bg-gray-900 text-white text-sm px-5 py-3 rounded-xl shadow-lg z-50 flex items-center gap-3"
            >
              {cartMsg.text}
              {cartMsg.ok && (
                <Link to="/buyer/cart" className="font-semibold text-[#F4A261] hover:underline whitespace-nowrap">
                  View Cart →
                </Link>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Grid / states */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: LIMIT }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-64 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24 bg-white rounded-2xl border border-gray-100"
          >
            <p className="text-5xl mb-4">📡</p>
            <p className="text-gray-700 font-semibold">Something went wrong</p>
            <p className="text-gray-400 text-sm mt-1 mb-5">We couldn't reach the server. Check your connection and try again.</p>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={fetchProducts}
              className="bg-pink-500 hover:bg-pink-600 text-white text-sm font-semibold px-6 py-2.5 rounded-full transition-colors"
            >
              Try Again
            </motion.button>
          </motion.div>
        ) : products.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24"
          >
            <p className="text-5xl mb-4">🍬</p>
            <p className="text-gray-500 font-medium">No products found</p>
            <p className="text-gray-400 text-sm mt-1">Try a different search, category, or fewer filters</p>
          </motion.div>
        ) : (
          <>
            <p className="text-sm text-gray-400 mb-4">{totalCount} product{totalCount !== 1 ? 's' : ''} found</p>
            <motion.div
              key={`${search}-${category}-${sort}-${minPrice}-${maxPrice}-${sellerId}-${minRating}-${inStock}-${page}`}
              variants={gridVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6"
            >
              <AnimatePresence mode="popLayout">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} onAddToCart={handleAddToCart} />
                ))}
              </AnimatePresence>
            </motion.div>

            {/* Pagination */}
            {totalPages > 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-center flex-wrap gap-2 mt-10"
              >
                <motion.button
                  whileHover={{ scale: page === 1 ? 1 : 1.05 }}
                  whileTap={{ scale: page === 1 ? 1 : 0.95 }}
                  onClick={() => setSearchParams({ ...Object.fromEntries(searchParams), page: page - 1 })}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-full bg-white border border-gray-200 text-sm disabled:opacity-40 hover:border-pink-400 transition-colors"
                >
                  ← Prev
                </motion.button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <motion.button
                    key={p}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => setSearchParams({ ...Object.fromEntries(searchParams), page: p })}
                    className={`w-9 h-9 rounded-full text-sm font-medium transition-colors
                      ${p === page ? 'bg-pink-500 text-white' : 'bg-white border border-gray-200 hover:border-pink-400'}`}
                  >
                    {p}
                  </motion.button>
                ))}
                <motion.button
                  whileHover={{ scale: page === totalPages ? 1 : 1.05 }}
                  whileTap={{ scale: page === totalPages ? 1 : 0.95 }}
                  onClick={() => setSearchParams({ ...Object.fromEntries(searchParams), page: page + 1 })}
                  disabled={page === totalPages}
                  className="px-4 py-2 rounded-full bg-white border border-gray-200 text-sm disabled:opacity-40 hover:border-pink-400 transition-colors"
                >
                  Next →
                </motion.button>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
