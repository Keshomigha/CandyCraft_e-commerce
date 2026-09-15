import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import { getProducts, getCategories } from '../../api/productApi';
import { getPublicSellers } from '../../api/sellerApi';
import { addToCart } from '../../api/cartApi';
import useAuth from '../../hooks/useAuth';
import volunteerHome from '../../assets/images/volunteer_home.png';
import ReportButton from '../../components/common/ReportButton';
import FitImage from '../../components/common/FitImage';
import SearchBar from '../../components/common/SearchBar';
import imgCandyBouquet    from '../../assets/images/candybouquet.jpg';
import imgFlowerBouquet   from '../../assets/images/flowerbouquet.jpg';
import imgGiftBoxes       from '../../assets/images/giftboxes.jpg';
import imgGraduationGifts from '../../assets/images/graduationgifts.jpg';
import imgGreetingCards   from '../../assets/images/greeting_card.jpg';
import imgCustomPaintings from '../../assets/images/custom_ paintings.jpg';
import { CATEGORIES as CATEGORY_LIST, getCustomizableBadge } from '../../utils/categories';

const CATEGORY_IMAGES = {
  'Candy Bouquets': imgCandyBouquet,
  'Flower Bouquets': imgFlowerBouquet,
  'Gift Boxes': imgGiftBoxes,
  'Graduation Gifts': imgGraduationGifts,
  'Greeting Cards': imgGreetingCards,
  'Custom Paintings': imgCustomPaintings,
};

const CATEGORY_TILE_COLORS = [
  'from-pink-400 to-rose-500',
  'from-purple-400 to-indigo-500',
  'from-amber-400 to-orange-500',
  'from-emerald-400 to-teal-500',
  'from-sky-400 to-blue-500',
  'from-fuchsia-400 to-pink-500',
];

const CATEGORIES = CATEGORY_LIST.map((cat, i) => ({
  ...cat,
  img: CATEGORY_IMAGES[cat.label] || null,
  tileColor: CATEGORY_TILE_COLORS[i % CATEGORY_TILE_COLORS.length],
}));

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] },
  }),
};

function Reveal({ children, className, custom = 0, ...rest }) {
  return (
    <motion.div
      className={className}
      custom={custom}
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

function Counter({ to, suffix = '' }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.floor(v).toLocaleString());
  const [display, setDisplay] = useState('0');

  useEffect(() => {
    const controls = animate(count, to, { duration: 1.4, ease: [0.22, 1, 0.36, 1] });
    const unsub = rounded.on('change', (v) => setDisplay(v));
    return () => { controls.stop(); unsub(); };
  }, [to]);

  return <span>{display}{suffix}</span>;
}

function StarRating({ rating = 0 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} className={`w-3.5 h-3.5 ${s <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 0 0 .95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 0 0-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 0 0-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 0 0-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 0 0 .951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function ProductCard({ product, index, onAddToCart }) {
  const bgColors = ['bg-red-50', 'bg-pink-50', 'bg-orange-50', 'bg-yellow-50', 'bg-green-50', 'bg-purple-50'];
  const emojis = ['🍬', '🎁', '🌹', '🍭', '🧁', '🍫'];
  const idx = product.id % bgColors.length;
  const [imgLoaded, setImgLoaded] = useState(false);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAdd = async () => {
    setAdding(true);
    await onAddToCart(product.id);
    setAdding(false);
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
      custom={index}
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-shadow duration-300 overflow-hidden group flex flex-col"
    >
      <div className={`relative ${bgColors[idx]} h-44 flex items-center justify-center overflow-hidden flex-shrink-0`}>
        {product.image_url ? (
          <FitImage
            src={`${import.meta.env.VITE_API_URL}${product.image_url}`}
            alt={product.name}
            onLoad={() => setImgLoaded(true)}
            imgClassName={`transition-all duration-500 group-hover:scale-105 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
          />
        ) : (
          <span className="text-6xl transition-transform duration-300 group-hover:scale-110">{emojis[idx]}</span>
        )}
        <span className={`absolute top-3 left-3 text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full shadow-sm ${stockBadge.className}`}>
          {stockBadge.label}
        </span>
        {product.category && (
          <span className="absolute top-3 right-3 bg-gray-900/80 backdrop-blur-sm text-white text-[11px] font-semibold px-2.5 py-1 rounded-full">
            {product.category}
          </span>
        )}
        {getCustomizableBadge(product) && (
          <span className="absolute bottom-3 left-3 bg-white text-pink-600 text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm">
            {getCustomizableBadge(product)}
          </span>
        )}
        <div className="absolute bottom-3 right-3">
          <ReportButton targetType="product" targetId={product.id} targetLabel={product.name} />
        </div>
      </div>
      <div className="p-4 flex-1 flex flex-col">
        {product.shop_name && (
          <p className="text-xs text-gray-400 font-medium mb-0.5 truncate">{product.shop_name}</p>
        )}
        <h3 className="font-bold text-gray-800 text-base mb-2 truncate">{product.name}</h3>
        <div className="flex items-center gap-1.5 mb-4">
          <StarRating rating={product.avg_rating} />
          <span className="text-xs text-gray-400">
            {product.review_count > 0 ? `(${product.review_count})` : 'No reviews yet'}
          </span>
        </div>
        <div className="mt-auto space-y-2">
          <span className="block text-pink-500 font-bold text-base">₹{Number(product.price).toFixed(2)}</span>
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
            disabled={product.stock === 0 || adding || added}
            className={`w-full text-sm font-semibold py-2.5 rounded-xl transition-colors
              ${added
                ? 'bg-green-500 text-white'
                : product.stock === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-pink-500 hover:bg-pink-600 text-white'}`}
          >
            {added ? '✓ Added to Cart' : adding ? 'Adding…' : '+ Add to Cart'}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

function SellerCard({ seller, index }) {
  const initials = seller.shop_name?.slice(0, 2).toUpperCase() || '??';
  return (
    <motion.div
      custom={index}
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow text-center"
    >
      <div className="w-14 h-14 bg-pink-100 rounded-full flex items-center justify-center text-lg font-bold text-pink-500 mx-auto mb-3">
        {initials}
      </div>
      <h3 className="font-semibold text-gray-800 text-sm">{seller.shop_name}</h3>
      <p className="text-xs text-gray-400 mt-1 mb-2">{seller.description || 'Student candy crafter'}</p>
      <div className="flex items-center justify-center gap-1">
        <StarRating rating={seller.avg_rating} />
        {seller.review_count > 0 && <span className="text-xs text-gray-400">({seller.review_count})</span>}
      </div>
      <p className="text-xs text-gray-400 mt-1 mb-3">{seller.product_count} products</p>
      {seller.user_id && (
        <div className="flex justify-center">
          <ReportButton targetType="user" targetId={seller.user_id} targetLabel={seller.shop_name} variant="text" />
        </div>
      )}
    </motion.div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cartMsg, setCartMsg] = useState(null);

  const handleAddToCart = async (productId) => {
    if (!user) { navigate('/login'); return; }
    try {
      await addToCart(productId, 1);
      setCartMsg({ text: 'Added to cart!', ok: true });
    } catch (err) {
      setCartMsg({ text: err.response?.data?.message || 'Could not add to cart', ok: false });
    } finally {
      setTimeout(() => setCartMsg(null), 3500);
    }
  };

  useEffect(() => {
    Promise.all([
      getProducts({ limit: 4 }),
      getPublicSellers(),
      getCategories(),
    ])
      .then(([pRes, sRes, cRes]) => {
        setProducts(pRes.data.products);
        setSellers(sRes.data);
        setCategories(cRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white">
      {/* ── Mobile search (prominent, top of home screen) ── */}
      <div className="md:hidden bg-[#F5F0EB] px-4 pt-4 pb-3 border-b border-gray-100">
        <SearchBar variant="bar" className="w-full" />
      </div>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden min-h-[560px] md:min-h-[640px] flex items-center">
        {/* Background image */}
        <img
          src={volunteerHome}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Readability overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
          <motion.div
            className="max-w-xl"
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="text-pink-300 font-semibold text-sm mb-3 tracking-wide uppercase"
            >
              CandyCraft Marketplace
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-4xl md:text-5xl font-extrabold text-white leading-tight mb-4 drop-shadow-sm"
            >
              Sweet Handmade <span className="text-pink-400">Candy Crafts</span> by Students
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-gray-200 text-base mb-8 max-w-md"
            >
              Discover unique handmade candy bouquets, gift boxes, and sweet creations made by talented student crafters.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="flex flex-wrap gap-3 mb-10"
            >
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <Link to="/products" className="bg-pink-500 hover:bg-pink-600 text-white font-semibold px-6 py-3 rounded-full transition-colors shadow-lg shadow-black/30 inline-block">
                  Browse Products
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <Link to="/register?role=seller" className="border-2 border-white text-white hover:bg-white/10 font-semibold px-6 py-3 rounded-full transition-colors inline-block">
                  Become a Seller ▾
                </Link>
              </motion.div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="flex gap-8"
            >
              <div>
                <p className="text-2xl font-bold text-white"><Counter to={20} suffix="k+" /></p>
                <p className="text-sm text-gray-300">Student crafters</p>
              </div>
              <div className="border-l border-white/25 pl-8">
                <p className="text-2xl font-bold text-white"><Counter to={4.9} suffix="k+" /></p>
                <p className="text-sm text-gray-300">Happy customers</p>
              </div>
              <div className="border-l border-white/25 pl-8">
                <p className="text-2xl font-bold text-white"><Counter to={500} suffix="+" /></p>
                <p className="text-sm text-gray-300">Products listed</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Shop by Category ── */}
      <section className="bg-[#F5F0EB] py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Shop by Category</h2>
          </Reveal>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {CATEGORIES.map((cat, i) => (
              <motion.div
                key={cat.label}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                whileHover={{ y: -6 }}
                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              >
                <Link
                  to={`/products?category=${encodeURIComponent(cat.label)}`}
                  className="group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300 h-44 block"
                >
                  {cat.img ? (
                    <>
                      {/* image */}
                      <img
                        src={cat.img}
                        alt={cat.label}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      {/* dark overlay */}
                      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors duration-300" />
                    </>
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${cat.tileColor} flex items-center justify-center transition-transform duration-500 group-hover:scale-110`}>
                      <span className="text-5xl">{cat.emoji}</span>
                    </div>
                  )}
                  {/* label */}
                  <div className="absolute inset-0 flex flex-col items-center justify-end pb-4 px-2">
                    <span className="text-white font-semibold text-sm text-center drop-shadow">
                      {cat.label}
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Products ── */}
      <section className="py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Featured Products</h2>
            <Link to="/products" className="text-pink-500 hover:text-pink-600 text-sm font-medium">View All →</Link>
          </Reveal>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1,2,3,4].map((i) => <div key={i} className="h-60 bg-gray-200 rounded-2xl animate-pulse" />)}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} onAddToCart={handleAddToCart} />)}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No products yet — sellers need to add products and get them approved.</p>
          )}
        </div>
      </section>

      {/* ── Top Sellers ── */}
      <section className="bg-[#F5F0EB] py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Top Sellers</h2>
          </Reveal>
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[1,2,3,4].map((i) => <div key={i} className="h-40 bg-gray-200 rounded-2xl animate-pulse" />)}
            </div>
          ) : sellers.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {sellers.slice(0, 4).map((s, i) => <SellerCard key={s.id} seller={s} index={i} />)}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No approved sellers yet.</p>
          )}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-14">
        <div className="max-w-10xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal
            className="bg-linear-to-r from-pink-500 to-purple-600 rounded-3xl px-8 py-14 text-center text-white"
            whileHover={{ scale: 1.01 }}
          >
            <motion.p
              className="text-4xl mb-4"
              animate={{ rotate: [0, -8, 8, -8, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
            >
              🍭
            </motion.p>
            <h2 className="text-3xl font-extrabold mb-3">Are You a Student Crafter?</h2>
            <p className="text-pink-100 text-base mb-8 max-w-md mx-auto">
              Turn your sweet creations into income. Join thousands of student sellers on CandyCraft today.
            </p>
            <motion.div className="inline-block" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link to="/register?role=seller" className="bg-white text-pink-600 hover:bg-pink-50 font-bold px-8 py-3 rounded-full transition-colors shadow-lg inline-block">
                Become a Seller
              </Link>
            </motion.div>
          </Reveal>
        </div>
      </section>

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
    </div>
  );
}
