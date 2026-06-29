import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProducts, getCategories } from '../../api/productApi';
import { getPublicSellers } from '../../api/sellerApi';
import graduationBouquet from '../../assets/images/graduation bouquet.jpg';
import imgCandyBouquet    from '../../assets/images/candybouquet.jpg';
import imgFlowerBouquet   from '../../assets/images/flowerbouquet.jpg';
import imgGiftBoxes       from '../../assets/images/giftboxes.jpg';
import imgGraduationGifts from '../../assets/images/graduationgifts.jpg';

const CATEGORIES = [
  { label: 'Candy Bouquets',   img: imgCandyBouquet,    emoji: '💐' },
  { label: 'Graduation Gifts', img: imgGraduationGifts, emoji: '🎓' },
  { label: 'Flower Bouquet',   img: imgFlowerBouquet,   emoji: '🌸' },
  { label: 'Gift Boxes',       img: imgGiftBoxes,       emoji: '🎁' },
];

function StarRating({ rating = 5 }) {
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

function ProductCard({ product }) {
  const bgColors = ['bg-red-50', 'bg-pink-50', 'bg-orange-50', 'bg-yellow-50', 'bg-green-50', 'bg-purple-50'];
  const emojis = ['🍬', '🎁', '🌹', '🍭', '🧁', '🍫'];
  const idx = product.id % bgColors.length;
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden group">
      <div className={`relative ${bgColors[idx]} h-44 flex items-center justify-center overflow-hidden`}>
        {product.image_url ? (
          <img
            src={`${import.meta.env.VITE_API_URL}${product.image_url}`}
            alt={product.name}
            onLoad={() => setImgLoaded(true)}
            className={`h-full w-full object-cover transition-all duration-500 group-hover:scale-105 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
          />
        ) : (
          <span className="text-6xl transition-transform duration-300 group-hover:scale-110">{emojis[idx]}</span>
        )}
        <span className="absolute top-3 left-3 text-xs font-bold px-2 py-1 rounded-full text-white bg-pink-500">
          New
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-800 text-sm mb-1 truncate">{product.name}</h3>
        <div className="flex items-center gap-1 mb-2">
          <StarRating rating={5} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-pink-500 font-bold">₹{Number(product.price).toFixed(2)}</span>
          <button className="bg-pink-500 hover:bg-pink-600 text-white text-xs font-medium px-3 py-1.5 rounded-full transition-colors">
            + Cart
          </button>
        </div>
      </div>
    </div>
  );
}

function SellerCard({ seller }) {
  const initials = seller.shop_name?.slice(0, 2).toUpperCase() || '??';
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow text-center">
      <div className="w-14 h-14 bg-pink-100 rounded-full flex items-center justify-center text-lg font-bold text-pink-500 mx-auto mb-3">
        {initials}
      </div>
      <h3 className="font-semibold text-gray-800 text-sm">{seller.shop_name}</h3>
      <p className="text-xs text-gray-400 mt-1 mb-2">{seller.description || 'Student candy crafter'}</p>
      <StarRating rating={5} />
      <p className="text-xs text-gray-400 mt-1">{seller.product_count} products</p>
    </div>
  );
}

export default function Home() {
  const [products, setProducts] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

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
      {/* ── Hero ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1">
            <p className="text-pink-500 font-medium text-sm mb-3 tracking-wide uppercase">CandyCraft Marketplace</p>
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-4">
              Sweet Handmade <span className="text-pink-500">Candy Crafts</span> by Students
            </h1>
            <p className="text-gray-500 text-base mb-8 max-w-md">
              Discover unique handmade candy bouquets, gift boxes, and sweet creations made by talented student crafters.
            </p>
            <div className="flex flex-wrap gap-3 mb-10">
              <Link to="/products" className="bg-pink-500 hover:bg-pink-600 text-white font-semibold px-6 py-3 rounded-full transition-colors shadow-md shadow-pink-200">
                Browse Products
              </Link>
              <Link to="/register?role=seller" className="border-2 border-pink-500 text-pink-500 hover:bg-pink-50 font-semibold px-6 py-3 rounded-full transition-colors">
                Become a Seller ▾
              </Link>
            </div>
            <div className="flex gap-8">
              <div>
                <p className="text-2xl font-bold text-gray-900">20k+</p>
                <p className="text-sm text-gray-500">Student crafters</p>
              </div>
              <div className="border-l border-gray-200 pl-8">
                <p className="text-2xl font-bold text-gray-900">4.9k+</p>
                <p className="text-sm text-gray-500">Happy customers</p>
              </div>
              <div className="border-l border-gray-200 pl-8">
                <p className="text-2xl font-bold text-gray-900">500+</p>
                <p className="text-sm text-gray-500">Products listed</p>
              </div>
            </div>
          </div>
          <div className="flex-1 flex justify-center">
            <div className="relative w-100 h-80 bg-[#F5F0EB] rounded-3xl overflow-hidden shadow-xl shadow-pink-100 group">
              <img
                src={graduationBouquet}
                alt="Graduation Bouquet"
                className="w-full h-full object-cover opacity-0 transition-all duration-700 ease-in-out group-hover:scale-105"
                onLoad={(e) => e.target.classList.replace('opacity-0', 'opacity-100')}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="w-full h-full items-center justify-center text-8xl hidden absolute inset-0">
                🎓🧸
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Shop by Category ── */}
      <section className="bg-[#F5F0EB] py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Shop by Category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.label}
                to={`/products?category=${encodeURIComponent(cat.label)}`}
                className="group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-44"
              >
                {/* image */}
                <img
                  src={cat.img}
                  alt={cat.label}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                {/* dark overlay */}
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors duration-300" />
                {/* label */}
                <div className="absolute inset-0 flex flex-col items-center justify-end pb-4 px-2">
                  <span className="text-white font-semibold text-sm text-center drop-shadow">
                    {cat.label}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Products ── */}
      <section className="py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Featured Products</h2>
            <Link to="/products" className="text-pink-500 hover:text-pink-600 text-sm font-medium">View All →</Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1,2,3,4].map((i) => <div key={i} className="h-60 bg-gray-200 rounded-2xl animate-pulse" />)}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No products yet — sellers need to add products and get them approved.</p>
          )}
        </div>
      </section>

      {/* ── Top Sellers ── */}
      <section className="bg-[#F5F0EB] py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Top Sellers</h2>
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[1,2,3,4].map((i) => <div key={i} className="h-40 bg-gray-200 rounded-2xl animate-pulse" />)}
            </div>
          ) : sellers.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {sellers.slice(0, 4).map((s) => <SellerCard key={s.id} seller={s} />)}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No approved sellers yet.</p>
          )}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-14">
        <div className="max-w-10xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-linear-to-r from-pink-500 to-purple-600 rounded-3xl px-8 py-14 text-center text-white">
            <p className="text-4xl mb-4">🍭</p>
            <h2 className="text-3xl font-extrabold mb-3">Are You a Student Crafter?</h2>
            <p className="text-pink-100 text-base mb-8 max-w-md mx-auto">
              Turn your sweet creations into income. Join thousands of student sellers on CandyCraft today.
            </p>
            <Link to="/register?role=seller" className="bg-white text-pink-600 hover:bg-pink-50 font-bold px-8 py-3 rounded-full transition-colors shadow-lg">
              Become a Seller
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
