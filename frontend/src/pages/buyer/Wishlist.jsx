import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getWishlist, removeFromWishlist } from '../../api/wishlistApi';
import { addToCart } from '../../api/cartApi';
import useAuth from '../../hooks/useAuth';
import { staggerContainer, listItem } from '../../utils/motionVariants';
import ReportButton from '../../components/common/ReportButton';
import FitImage from '../../components/common/FitImage';

export default function Wishlist() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(null);
  const [adding, setAdding]   = useState(null);
  const [msg, setMsg]         = useState('');

  useEffect(() => {
    getWishlist()
      .then(r => setItems(Array.isArray(r.data) ? r.data : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const handleRemove = async (productId) => {
    setRemoving(productId);
    try {
      await removeFromWishlist(productId);
      setItems(prev => prev.filter(i => i.id !== productId));
      setMsg('Removed from wishlist.');
    } catch {
      setMsg('Could not remove item.');
    } finally {
      setRemoving(null);
      setTimeout(() => setMsg(''), 2500);
    }
  };

  const handleAddToCart = async (productId) => {
    if (!user) { navigate('/login'); return; }
    setAdding(productId);
    try {
      await addToCart(productId, 1);
      setMsg('Added to cart!');
    } catch (err) {
      setMsg(err.response?.data?.message || 'Could not add to cart.');
    } finally {
      setAdding(null);
      setTimeout(() => setMsg(''), 2500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl font-extrabold text-gray-800">My Wishlist ❤️</h1>
        <p className="text-gray-400 text-sm mt-1">
          {loading ? '…' : `${items.length} item${items.length !== 1 ? 's' : ''} saved`}
        </p>
      </motion.div>

      {/* Toast */}
      <AnimatePresence>
        {msg && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white text-sm px-5 py-3 rounded-xl shadow-lg"
          >
            {msg}
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="bg-white rounded-2xl h-60 animate-pulse shadow-sm border border-gray-100" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl shadow-sm border border-gray-100 py-24 text-center">
          <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-10 h-10 text-[#F4A261]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <p className="text-gray-700 font-semibold text-lg">Your wishlist is empty</p>
          <p className="text-gray-400 text-sm mt-1">Heart products in the shop to save them here.</p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="inline-block mt-5">
            <Link
              to="/products"
              className="bg-[#F4A261] text-white text-sm px-6 py-2.5 rounded-full font-semibold hover:bg-[#E76F51] transition-colors inline-block"
            >
              Browse Products
            </Link>
          </motion.div>
        </motion.div>
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {items.map(item => (
              <motion.div key={item.id} layout variants={listItem} exit="exit" className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow">
                {/* Image */}
                <div className="relative h-44 bg-orange-50 flex items-center justify-center overflow-hidden">
                  {item.image_url ? (
                    <FitImage
                      src={`${import.meta.env.VITE_API_URL}${item.image_url}`}
                      alt={item.name}
                    />
                  ) : (
                    <span className="text-5xl">🍬</span>
                  )}
                  {/* Remove heart + Report */}
                  <div className="absolute top-2.5 right-2.5 flex flex-col gap-2 items-end">
                    <motion.button
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleRemove(item.id)}
                      disabled={removing === item.id}
                      className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow hover:bg-red-50 transition-colors"
                      title="Remove from wishlist"
                    >
                      <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </motion.button>
                    <ReportButton targetType="product" targetId={item.id} targetLabel={item.name} />
                  </div>
                  {item.stock === 0 && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="bg-white text-gray-700 text-xs font-bold px-3 py-1 rounded-full">Out of Stock</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4 flex-1 flex flex-col">
                  <Link to={`/products/${item.id}`}>
                    <h3 className="font-semibold text-gray-800 text-sm hover:text-[#F4A261] transition-colors line-clamp-1">
                      {item.name}
                    </h3>
                  </Link>
                  {item.category && (
                    <p className="text-xs text-gray-400 mt-0.5">{item.category}</p>
                  )}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                    <span className="font-bold text-[#F4A261]">
                      ₹{Number(item.price).toLocaleString()}
                    </span>
                    <motion.button
                      whileHover={{ scale: item.stock === 0 ? 1 : 1.08 }}
                      whileTap={{ scale: item.stock === 0 ? 1 : 0.92 }}
                      onClick={() => handleAddToCart(item.id)}
                      disabled={item.stock === 0 || adding === item.id}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors
                        ${item.stock === 0
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-[#F4A261] text-white hover:bg-[#E76F51]'
                        }`}
                    >
                      {adding === item.id ? 'Adding…' : '+ Cart'}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
