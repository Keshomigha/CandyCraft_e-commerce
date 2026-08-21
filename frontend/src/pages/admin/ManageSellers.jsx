import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllSellersAdmin, updateSellerStatusAdmin } from '../../api/adminApi';
import Reveal from '../../components/common/Reveal';
import { staggerContainer, listItem } from '../../utils/motionVariants';

const STATUS_TABS = ['All', 'Pending', 'Approved', 'Rejected', 'Suspended'];

const STATUS_STYLES = {
  pending:   'bg-yellow-100 text-yellow-700',
  approved:  'bg-green-100 text-green-700',
  rejected:  'bg-red-100 text-red-600',
  suspended: 'bg-gray-800 text-white',
};

function fmt(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export default function ManageSellers() {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('All');
  const [busyId, setBusyId] = useState(null);
  const [toast, setToast] = useState('');

  const load = () => {
    setLoading(true);
    getAllSellersAdmin()
      .then(r => setSellers(Array.isArray(r.data) ? r.data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const filtered = tab === 'All' ? sellers : sellers.filter(s => s.status === tab.toLowerCase());

  const counts = STATUS_TABS.reduce((acc, t) => {
    acc[t] = t === 'All' ? sellers.length : sellers.filter(s => s.status === t.toLowerCase()).length;
    return acc;
  }, {});

  const handleStatus = async (seller, status) => {
    setBusyId(seller.id);
    try {
      await updateSellerStatusAdmin(seller.id, status);
      setSellers(prev => prev.map(s => s.id === seller.id ? { ...s, status } : s));
      showToast(`${seller.shop_name} ${status}.`);
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not update seller.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl font-extrabold text-gray-800">Manage Sellers</h1>
        <p className="text-gray-400 text-sm mt-1">Approve applications and control seller shop access</p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-1">
        {STATUS_TABS.map(t => {
          const isActive = tab === t;
          return (
            <motion.button
              key={t}
              onClick={() => setTab(t)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className={`relative isolate flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap
                ${isActive ? 'text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}
            >
              {isActive && (
                <motion.span
                  layoutId="seller-status-tab-pill"
                  className="absolute inset-0 z-0 bg-[#F4A261] rounded-xl shadow-sm"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative z-10">{t}</span>
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

      {/* Seller cards */}
      <Reveal>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="bg-white rounded-2xl h-40 animate-pulse shadow-sm border border-gray-100" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 py-16 text-center">
            <p className="text-4xl mb-3">🏪</p>
            <p className="text-gray-400 text-sm">No sellers found.</p>
          </div>
        ) : (
          <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AnimatePresence initial={false}>
              {filtered.map(seller => (
                <motion.div key={seller.id} layout variants={listItem} exit="exit" className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-orange-100 flex items-center justify-center text-sm font-bold text-[#F4A261] flex-shrink-0">
                        {seller.shop_name?.slice(0, 2).toUpperCase() || '??'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-800 text-sm truncate">{seller.shop_name}</p>
                        <p className="text-xs text-gray-400 truncate">{seller.name} · {seller.email}</p>
                      </div>
                    </div>
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize flex-shrink-0 ${STATUS_STYLES[seller.status] || 'bg-gray-100 text-gray-600'}`}>
                      {seller.status}
                    </span>
                  </div>
                  {seller.description && (
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">{seller.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mb-4">Joined {fmt(seller.created_at)}</p>

                  <div className="flex flex-wrap gap-2">
                    {seller.status === 'pending' && (
                      <>
                        <motion.button
                          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                          disabled={busyId === seller.id}
                          onClick={() => handleStatus(seller, 'approved')}
                          className="text-xs font-semibold px-3 py-1.5 rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors disabled:opacity-60"
                        >
                          Approve
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                          disabled={busyId === seller.id}
                          onClick={() => handleStatus(seller, 'rejected')}
                          className="text-xs font-semibold px-3 py-1.5 rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-60"
                        >
                          Reject
                        </motion.button>
                      </>
                    )}
                    {seller.status === 'approved' && (
                      <motion.button
                        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        disabled={busyId === seller.id}
                        onClick={() => handleStatus(seller, 'suspended')}
                        className="text-xs font-semibold px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors disabled:opacity-60"
                      >
                        Suspend Shop
                      </motion.button>
                    )}
                    {(seller.status === 'suspended' || seller.status === 'rejected') && (
                      <motion.button
                        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        disabled={busyId === seller.id}
                        onClick={() => handleStatus(seller, 'approved')}
                        className="text-xs font-semibold px-3 py-1.5 rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors disabled:opacity-60"
                      >
                        {seller.status === 'suspended' ? 'Reinstate' : 'Approve'}
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </Reveal>
    </div>
  );
}
