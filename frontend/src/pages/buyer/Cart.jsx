import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getCart, updateCart, removeFromCart } from '../../api/cartApi';
import { checkout } from '../../api/orderApi';
import { staggerContainer, listItem } from '../../utils/motionVariants';

// Shared across every customization flavor (generic / greeting card / painting)
const CUSTOM_LABELS = [
  ['recipientName', 'Recipient Name'],
  ['giftMessage', 'Gift Message'],
  ['customMessage', 'Custom Message'],
  ['optionalNotes', 'Optional Notes'],
  ['themeColor', 'Theme Color'],
  ['paintingSize', 'Painting Size'],
  ['caption', 'Name / Caption'],
  ['giftWrapping', 'Gift Wrapping'],
  ['greetingCard', 'Greeting Card'],
  ['frameOption', 'Frame Option'],
  ['specialInstructions', 'Special Instructions'],
];

function customizationSummary(customization) {
  if (!customization) return [];
  return CUSTOM_LABELS
    .map(([key, label]) => {
      const value = customization[key];
      if (value === undefined || value === null || value === '') return null;
      const display = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value;
      return `${label}: ${display}`;
    })
    .filter(Boolean);
}

export default function Cart() {
  const navigate = useNavigate();

  const [items, setItems]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [busyId, setBusyId]       = useState(null);
  const [msg, setMsg]             = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [placing, setPlacing]     = useState(false);
  const [error, setError]         = useState('');

  const load = () => {
    setLoading(true);
    getCart()
      .then((r) => setItems(Array.isArray(r.data) ? r.data : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const showToast = (text) => { setMsg(text); setTimeout(() => setMsg(''), 3000); };

  const itemTotal = (item) => {
    const fee = item.customization?.fee ? Number(item.customization.fee) : 0;
    return Number(item.price) * item.quantity + fee;
  };

  const subtotal = items.reduce((sum, item) => sum + itemTotal(item), 0);

  const handleQuantityChange = async (item, nextQty) => {
    if (nextQty < 1 || nextQty > item.stock) return;
    setBusyId(item.product_id);
    const prevItems = items;
    setItems((prev) => prev.map((i) => (i.product_id === item.product_id ? { ...i, quantity: nextQty } : i)));
    try {
      await updateCart(item.product_id, nextQty);
    } catch (err) {
      setItems(prevItems);
      showToast(err.response?.data?.message || 'Could not update quantity.');
    } finally {
      setBusyId(null);
    }
  };

  const handleRemove = async (item) => {
    setBusyId(item.product_id);
    try {
      await removeFromCart(item.product_id);
      setItems((prev) => prev.filter((i) => i.product_id !== item.product_id));
      showToast('Item removed from cart.');
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not remove item.');
    } finally {
      setBusyId(null);
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!shippingAddress.trim()) {
      setError('Shipping address is required.');
      return;
    }
    setError('');
    setPlacing(true);
    try {
      const res = await checkout({ shippingAddress: shippingAddress.trim() });
      navigate(`/buyer/orders/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not place order.');
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl font-extrabold text-gray-800">My Cart</h1>
        <p className="text-gray-400 text-sm mt-1">Review your items and check out</p>
      </motion.div>

      <AnimatePresence>
        {msg && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="bg-gray-900 text-white text-sm px-5 py-3 rounded-xl shadow-lg fixed bottom-6 right-6 z-50"
          >
            {msg}
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="bg-white rounded-2xl h-28 animate-pulse shadow-sm border border-gray-100" />)}
        </div>
      ) : items.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl shadow-sm border border-gray-100 py-20 text-center">
          <p className="text-4xl mb-3">🛒</p>
          <p className="text-gray-500 font-medium">Your cart is empty</p>
          <p className="text-gray-400 text-sm mt-1 mb-5">Browse the shop and add something sweet.</p>
          <Link
            to="/products"
            className="inline-block bg-[#F4A261] hover:bg-[#E76F51] text-white text-sm font-semibold px-6 py-2.5 rounded-full transition-colors"
          >
            Browse Products
          </Link>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Items */}
          <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="lg:col-span-2 space-y-4">
            <AnimatePresence mode="popLayout">
              {items.map((item) => {
                const notes = customizationSummary(item.customization);
                const isBusy = busyId === item.product_id;
                const overStock = item.quantity > item.stock;

                return (
                  <motion.div key={item.product_id} layout variants={listItem} exit="exit" className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex gap-4">
                    <div className="w-20 h-20 rounded-xl bg-orange-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {item.image_url ? (
                        <img src={`${import.meta.env.VITE_API_URL}${item.image_url}`} alt={item.name} className="w-full h-full object-contain" />
                      ) : <span className="text-3xl">🍬</span>}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <Link to={`/products/${item.product_id}`} className="font-bold text-gray-800 text-sm hover:text-pink-500 transition-colors line-clamp-1">
                          {item.name}
                        </Link>
                        <button
                          onClick={() => handleRemove(item)}
                          disabled={isBusy}
                          aria-label="Remove item"
                          className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0 disabled:opacity-50"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                      <p className="text-[#F4A261] font-bold text-sm mt-0.5">₹{Number(item.price).toFixed(2)}</p>

                      {notes.length > 0 && (
                        <div className="mt-1.5 bg-pink-50 border border-pink-100 rounded-lg px-2.5 py-1.5">
                          <p className="text-[11px] font-semibold text-pink-600 mb-0.5">✨ Customized</p>
                          <p className="text-[11px] text-gray-600 leading-snug">{notes.join(' • ')}</p>
                          {Number(item.customization?.fee) > 0 && (
                            <p className="text-[11px] text-pink-600 font-semibold mt-1">
                              + ₹{Number(item.customization.fee).toFixed(2)} customization fee
                            </p>
                          )}
                        </div>
                      )}

                      {overStock && (
                        <p className="text-[11px] text-red-500 font-medium mt-1">Only {item.stock} left in stock — please reduce quantity.</p>
                      )}

                      <div className="flex items-center justify-between mt-2.5">
                        <div className="flex items-center gap-2 border border-gray-200 rounded-full px-1">
                          <button
                            onClick={() => handleQuantityChange(item, item.quantity - 1)}
                            disabled={isBusy || item.quantity <= 1}
                            className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-800 disabled:opacity-30"
                          >
                            −
                          </button>
                          <span className="text-sm font-semibold text-gray-700 w-5 text-center">{item.quantity}</span>
                          <button
                            onClick={() => handleQuantityChange(item, item.quantity + 1)}
                            disabled={isBusy || item.quantity >= item.stock}
                            className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-800 disabled:opacity-30"
                          >
                            +
                          </button>
                        </div>
                        <span className="font-bold text-gray-800 text-sm">₹{itemTotal(item).toFixed(2)}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>

          {/* Order summary */}
          <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="lg:col-span-1">
            <form onSubmit={handlePlaceOrder} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4 sticky top-24">
              <h2 className="font-bold text-gray-800">Order Summary</h2>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Subtotal ({items.length} item{items.length !== 1 ? 's' : ''})</span>
                <span className="font-semibold text-gray-800">₹{subtotal.toFixed(2)}</span>
              </div>

              <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                <span className="font-bold text-gray-800">Total</span>
                <span className="font-extrabold text-[#F4A261] text-lg">₹{subtotal.toFixed(2)}</span>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Shipping Address</label>
                <textarea
                  rows={3}
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="123 Main Street, Colombo"
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#F4A261] focus:ring-2 focus:ring-orange-100 transition resize-none placeholder-gray-300"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg px-3 py-2">{error}</div>
              )}

              <motion.button
                whileHover={{ scale: placing ? 1 : 1.02 }}
                whileTap={{ scale: placing ? 1 : 0.98 }}
                type="submit"
                disabled={placing || items.some((i) => i.quantity > i.stock)}
                className="w-full py-3 rounded-full bg-[#F4A261] hover:bg-[#E76F51] text-white font-semibold text-sm transition-colors disabled:opacity-60"
              >
                {placing ? 'Placing Order…' : 'Place Order'}
              </motion.button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
