import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllOrdersAdmin, updateOrderStatusAdmin } from '../../api/adminApi';
import OrderMonitorTable from '../../components/admin/OrderMonitorTable';
import Reveal from '../../components/common/Reveal';

const TABS = ['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function MonitorOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');

  const load = () => {
    setLoading(true);
    getAllOrdersAdmin()
      .then(r => setOrders(Array.isArray(r.data) ? r.data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const byTab = tab === 'all' ? orders : orders.filter(o => o.status === tab);
  const q = search.trim().toLowerCase();
  const filtered = q
    ? byTab.filter(o =>
        String(o.id).includes(q) ||
        (o.buyer_name || '').toLowerCase().includes(q) ||
        (o.buyer_email || '').toLowerCase().includes(q)
      )
    : byTab;

  const counts = TABS.reduce((acc, t) => {
    acc[t] = t === 'all' ? orders.length : orders.filter(o => o.status === t).length;
    return acc;
  }, {});

  const handleUpdateStatus = async (orderId, status) => {
    try {
      await updateOrderStatusAdmin(orderId, status);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
      showToast(`Order #${orderId} set to ${status}.`);
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not update order.');
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl font-extrabold text-gray-800">Monitor Orders</h1>
        <p className="text-gray-400 text-sm mt-1">View every order across the platform and override status</p>
      </motion.div>

      <div className="relative max-w-sm">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by order ID, buyer name, or email..."
          className="w-full pl-10 pr-9 py-2.5 bg-white border border-gray-200 rounded-full text-sm outline-none focus:border-[#F4A261] focus:ring-2 focus:ring-orange-100 transition"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

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
                  layoutId="admin-order-tab-pill"
                  className="absolute inset-0 z-0 bg-[#F4A261] rounded-xl shadow-sm"
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

      <Reveal className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="px-6 py-8 space-y-3">
            {[1,2,3,4].map(i => <div key={i} className="h-14 bg-gray-50 rounded-lg animate-pulse" />)}
          </div>
        ) : (
          <OrderMonitorTable orders={filtered} onUpdateStatus={handleUpdateStatus} />
        )}
      </Reveal>
    </div>
  );
}
