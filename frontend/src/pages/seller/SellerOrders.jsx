import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSellerOrders, updateSellerOrderStatus } from '../../api/sellerApi';
import SellerOrderTable from '../../components/seller/SellerOrderTable';
import Reveal from '../../components/common/Reveal';

const API_URL = import.meta.env.VITE_API_URL;
const TABS = ['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function SellerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [toast, setToast] = useState('');

  const load = () => {
    setLoading(true);
    getSellerOrders()
      .then(r => setOrders(Array.isArray(r.data) ? r.data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = tab === 'all'
    ? orders
    : orders.filter(o => o.order_status === tab);

  const handleUpdateStatus = async (orderId, status) => {
    try {
      await updateSellerOrderStatus(orderId, status);
      setOrders(prev => prev.map(o =>
        o.order_id === orderId ? { ...o, order_status: status } : o
      ));
      setToast(`Order #${orderId} marked as ${status}.`);
    } catch (err) {
      setToast(err.response?.data?.message || 'Could not update order status.');
    } finally {
      setTimeout(() => setToast(''), 3000);
    }
  };

  const counts = TABS.reduce((acc, t) => {
    acc[t] = t === 'all' ? orders.length : orders.filter(o => o.order_status === t).length;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl font-extrabold text-gray-800">Orders</h1>
        <p className="text-gray-400 text-sm mt-1">Manage orders for your products</p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-1">
        {TABS.map(t => {
          const isActive = tab === t;
          return (
            <motion.button
              key={t}
              onClick={() => setTab(t)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className={`relative isolate flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors capitalize whitespace-nowrap
                ${isActive ? 'text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}
            >
              {isActive && (
                <motion.span
                  layoutId="seller-order-tab-pill"
                  className="absolute inset-0 z-0 bg-gradient-to-r from-[#F4A261] to-[#E76F51] rounded-xl shadow-sm"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative z-10">{t === 'all' ? 'All' : t}</span>
              <span className={`relative z-10 text-[11px] px-1.5 py-0.5 rounded-md font-semibold
                ${isActive ? 'bg-white/20' : 'bg-gray-100 text-gray-500'}`}>
                {counts[t]}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white text-sm px-5 py-3 rounded-xl shadow-lg"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <Reveal className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="px-6 py-8 space-y-3">
            {[1,2,3,4].map(i => <div key={i} className="h-14 bg-gray-50 rounded-lg animate-pulse" />)}
          </div>
        ) : (
          <SellerOrderTable
            orders={filtered}
            onUpdateStatus={handleUpdateStatus}
            apiUrl={API_URL}
          />
        )}
      </Reveal>
    </div>
  );
}
