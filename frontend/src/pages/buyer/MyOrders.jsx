import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getMyOrders, cancelOrder } from '../../api/orderApi';
import { staggerContainer, listItem } from '../../utils/motionVariants';

const STATUS_STYLES = {
  pending:    'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped:    'bg-purple-100 text-purple-700',
  delivered:  'bg-green-100 text-green-700',
  cancelled:  'bg-red-100 text-red-500',
};

const FILTERS = ['All', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

function fmt(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export default function MyOrders() {
  const navigate = useNavigate();
  const [orders, setOrders]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('All');
  const [cancelling, setCancelling] = useState(null);
  const [msg, setMsg]           = useState('');

  useEffect(() => {
    getMyOrders()
      .then(r => setOrders(Array.isArray(r.data) ? r.data : []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'All'
    ? orders
    : orders.filter(o => o.status === filter.toLowerCase());

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    setCancelling(id);
    try {
      await cancelOrder(id);
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'cancelled' } : o));
      setMsg('Order cancelled successfully.');
    } catch (err) {
      setMsg(err.response?.data?.message || 'Could not cancel order.');
    } finally {
      setCancelling(null);
      setTimeout(() => setMsg(''), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl font-extrabold text-gray-800">My Orders</h1>
        <p className="text-gray-400 text-sm mt-1">Track and manage your orders</p>
      </motion.div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(f => {
          const isActive = filter === f;
          return (
            <motion.button
              key={f}
              onClick={() => setFilter(f)}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className={`relative isolate px-4 py-1.5 rounded-full text-sm font-medium transition-colors
                ${isActive
                  ? 'text-white'
                  : 'bg-white text-gray-500 border border-gray-200 hover:border-[#F4A261] hover:text-[#F4A261]'
                }`}
            >
              {isActive && (
                <motion.span
                  layoutId="my-orders-filter-pill"
                  className="absolute inset-0 z-0 bg-[#F4A261] rounded-full shadow-sm"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative z-10">{f}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Toast */}
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

      {/* Orders list */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl h-32 animate-pulse shadow-sm border border-gray-100" />)}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl shadow-sm border border-gray-100 py-20 text-center">
          <p className="text-4xl mb-3">📦</p>
          <p className="text-gray-500 font-medium">No orders found</p>
          <p className="text-gray-400 text-sm mt-1">
            {filter !== 'All' ? `No ${filter.toLowerCase()} orders.` : 'You have no orders yet.'}
          </p>
        </motion.div>
      ) : (
        <motion.div key={filter} variants={staggerContainer} initial="hidden" animate="visible" className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filtered.map(order => (
              <motion.div key={order.id} layout variants={listItem} exit="exit" className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-gray-400 text-sm font-medium">#{order.id}</span>
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${STATUS_STYLES[order.status] || 'bg-gray-100 text-gray-600'}`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-gray-400 text-xs">{fmt(order.created_at)}</p>
                    {order.shipping_address && (
                      <p className="text-gray-400 text-xs mt-1 truncate max-w-xs">📍 {order.shipping_address}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-[#F4A261] font-bold text-base">
                      ₹{Number(order.total_amount).toLocaleString()}
                    </p>
                    <p className="text-gray-400 text-xs mt-0.5">{fmt(order.created_at)}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate(`/buyer/orders/${order.id}`)}
                    className="px-4 py-1.5 rounded-full border border-gray-200 text-sm text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                  >
                    View Details
                  </motion.button>
                  {(order.status === 'pending' || order.status === 'processing') && (
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleCancel(order.id)}
                      disabled={cancelling === order.id}
                      className="px-4 py-1.5 rounded-full border border-red-200 text-sm text-red-500 hover:bg-red-50 transition-colors disabled:opacity-60"
                    >
                      {cancelling === order.id ? 'Cancelling…' : 'Cancel Order'}
                    </motion.button>
                  )}
                  {order.status === 'delivered' && (
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {}}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#F4A261] text-white text-sm font-semibold hover:bg-[#E76F51] transition-colors"
                    >
                      Write Review ⭐
                    </motion.button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
