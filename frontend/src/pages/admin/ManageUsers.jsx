import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllUsers, updateUserStatus, deleteUser } from '../../api/adminApi';
import UserTable from '../../components/admin/UserTable';
import Reveal from '../../components/common/Reveal';
import useAuth from '../../hooks/useAuth';

const ROLE_TABS = ['All', 'Buyer', 'Seller', 'Admin'];

export default function ManageUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleTab, setRoleTab] = useState('All');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [toast, setToast] = useState('');

  const load = () => {
    setLoading(true);
    getAllUsers()
      .then(r => setUsers(Array.isArray(r.data) ? r.data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const filtered = users.filter(u => {
    const matchesRole = roleTab === 'All' || u.role === roleTab.toLowerCase();
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const handleToggleStatus = async (targetUser) => {
    const nextStatus = targetUser.status === 'suspended' ? 'active' : 'suspended';
    setBusyId(targetUser.id);
    try {
      await updateUserStatus(targetUser.id, nextStatus);
      setUsers(prev => prev.map(u => u.id === targetUser.id ? { ...u, status: nextStatus } : u));
      showToast(nextStatus === 'suspended' ? `${targetUser.name} suspended.` : `${targetUser.name} reactivated.`);
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not update status.');
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusyId(deleting.id);
    try {
      await deleteUser(deleting.id);
      setUsers(prev => prev.filter(u => u.id !== deleting.id));
      showToast(`${deleting.name} deleted.`);
      setDeleting(null);
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not delete user.');
    } finally {
      setBusyId(null);
    }
  };

  const counts = ROLE_TABS.reduce((acc, t) => {
    acc[t] = t === 'All' ? users.length : users.filter(u => u.role === t.toLowerCase()).length;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl font-extrabold text-gray-800">Manage Users</h1>
        <p className="text-gray-400 text-sm mt-1">View, suspend, or remove buyer and seller accounts</p>
      </motion.div>

      {/* Search + role tabs */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <svg className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-[#F4A261] focus:ring-2 focus:ring-orange-100 transition placeholder-gray-300 bg-white"
          />
        </div>
        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
          {ROLE_TABS.map(t => {
            const isActive = roleTab === t;
            return (
              <motion.button
                key={t}
                onClick={() => setRoleTab(t)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className={`relative isolate flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap
                  ${isActive ? 'text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}
              >
                {isActive && (
                  <motion.span
                    layoutId="user-role-tab-pill"
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
          <UserTable
            users={filtered}
            currentUserId={currentUser?.id}
            onToggleStatus={handleToggleStatus}
            onDelete={setDeleting}
            busyId={busyId}
          />
        )}
      </Reveal>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {deleting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={() => setDeleting(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-800 text-center mb-1">Delete User</h3>
              <p className="text-sm text-gray-500 text-center mb-5">
                Are you sure you want to delete <strong>{deleting.name}</strong>? This permanently removes their account, orders, and reviews.
              </p>
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setDeleting(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={confirmDelete}
                  disabled={busyId === deleting.id}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-60"
                >
                  {busyId === deleting.id ? 'Deleting…' : 'Delete'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
