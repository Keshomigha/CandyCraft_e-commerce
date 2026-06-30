import { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { getProducts } from '../../api/productApi';
import { addToCart } from '../../api/cartApi';
import useAuth from '../../hooks/useAuth';

const CATEGORIES = ['All', 'Candy Bouquets', 'Graduation Gifts', 'Flower Bouquet', 'Gift Boxes'];
const LIMIT = 9;

const emojiFallbacks = ['🍬', '🎁', '🌹', '🍭', '🧁', '🍫'];
const bgFallbacks    = ['bg-red-50','bg-pink-50','bg-orange-50','bg-yellow-50','bg-green-50','bg-purple-50'];

function StarRating({ rating = 5 }) {
  return (
    <div className="flex">
      {[1,2,3,4,5].map((s) => (
        <svg key={s} className={`w-3 h-3 ${s <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
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

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
      {/* Image */}
      <div className={`relative ${bgFallbacks[idx]} h-48 overflow-hidden`}>
        {product.image_url ? (
          <>
            <img
              src={`${import.meta.env.VITE_API_URL}${product.image_url}`}
              alt={product.name}
              onLoad={() => setImgLoaded(true)}
              className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
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

        {/* Wishlist */}
        <button className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow hover:text-pink-500 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 0 1 6.364 0L12 7.636l1.318-1.318a4.5 4.5 0 0 1 6.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 0 1 0-6.364z" />
          </svg>
        </button>

        {/* Category badge */}
        {product.category && (
          <span className="absolute top-3 left-3 bg-white/90 text-gray-700 text-xs font-medium px-2 py-1 rounded-full">
            {product.category}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <Link to={`/products/${product.id}`}>
          <h3 className="font-semibold text-gray-800 text-sm mb-1 hover:text-pink-500 transition-colors line-clamp-1">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-center gap-1 mb-3">
          <StarRating />
          <span className="text-xs text-gray-400">(0)</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-pink-500 font-bold text-base">₹{Number(product.price).toFixed(2)}</span>
            {product.stock < 5 && product.stock > 0 && (
              <span className="text-xs text-orange-400 ml-2">Only {product.stock} left</span>
            )}
            {product.stock === 0 && (
              <span className="text-xs text-red-400 ml-2">Out of stock</span>
            )}
          </div>
          <button
            onClick={handleAdd}
            disabled={product.stock === 0 || added}
            className={`text-xs font-semibold px-3 py-2 rounded-full transition-all duration-200
              ${added
                ? 'bg-green-500 text-white'
                : product.stock === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-pink-500 hover:bg-pink-600 text-white'}`}
          >
            {added ? '✓ Added' : '+ Cart'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProductListing() {
  const { user }              = useAuth();
  const navigate              = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [cartMsg, setCartMsg]     = useState('');

  const search   = searchParams.get('search') || '';
  const category = searchParams.get('category') || 'All';
  const page     = Number(searchParams.get('page') || 1);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        limit: LIMIT,
        page,
        ...(search   && { search }),
        ...(category !== 'All' && { category }),
      };
      const res = await getProducts(params);
      setProducts(res.data.products);
      setTotalCount(res.data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, category, page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

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
      setCartMsg('Added to cart!');
      setTimeout(() => setCartMsg(''), 2500);
    } catch (err) {
      setCartMsg(err.response?.data?.message || 'Could not add to cart');
      setTimeout(() => setCartMsg(''), 2500);
    }
  };

  const totalPages = Math.ceil(totalCount / LIMIT);

  return (
    <div className="min-h-screen bg-[#F5F0EB]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Shop</h1>
          <p className="text-gray-400 text-sm">Discover handmade candy creations from student crafters</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search + filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search products..."
              defaultValue={search}
              onChange={(e) => setParam('search', e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-full text-sm outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition"
            />
          </div>

          {/* Category filters */}
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setParam('category', cat === 'All' ? '' : cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all border
                  ${category === cat || (cat === 'All' && !searchParams.get('category'))
                    ? 'bg-pink-500 text-white border-pink-500'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-pink-300'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Cart toast */}
        {cartMsg && (
          <div className="fixed bottom-6 right-6 bg-gray-900 text-white text-sm px-5 py-3 rounded-xl shadow-lg z-50 animate-bounce">
            {cartMsg}
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: LIMIT }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-64 animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-5xl mb-4">🍬</p>
            <p className="text-gray-500 font-medium">No products found</p>
            <p className="text-gray-400 text-sm mt-1">Try a different search or category</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-400 mb-4">{products.length} product{products.length !== 1 ? 's' : ''} found</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} onAddToCart={handleAddToCart} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-10">
                <button
                  onClick={() => setSearchParams({ ...Object.fromEntries(searchParams), page: page - 1 })}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-full bg-white border border-gray-200 text-sm disabled:opacity-40 hover:border-pink-400 transition"
                >
                  ← Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setSearchParams({ ...Object.fromEntries(searchParams), page: p })}
                    className={`w-9 h-9 rounded-full text-sm font-medium transition-all
                      ${p === page ? 'bg-pink-500 text-white' : 'bg-white border border-gray-200 hover:border-pink-400'}`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setSearchParams({ ...Object.fromEntries(searchParams), page: page + 1 })}
                  disabled={page === totalPages}
                  className="px-4 py-2 rounded-full bg-white border border-gray-200 text-sm disabled:opacity-40 hover:border-pink-400 transition"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
