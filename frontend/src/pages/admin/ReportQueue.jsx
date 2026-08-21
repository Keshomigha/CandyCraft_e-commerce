import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getReportQueue, resolveReport } from '../../api/adminApi';
import ReportQueueTable from '../../components/admin/ReportQueueTable';
import Reveal from '../../components/common/Reveal';

const TABS = ['Pending', 'Priority', 'Resolved', 'All'];

const ACTION_COPY = {
  dismiss: {
    title: 'Dismiss Report',
    body: 'This report will be marked as dismissed. No action will be taken against the reported content or user.',
    confirmLabel: 'Dismiss',
    confirmClass: 'bg-gray-800 hover:bg-gray-900',
  },
  remove: {
    title: 'Remove Listing',
    body: 'This permanently deletes the product listing. This cannot be undone.',
    confirmLabel: 'Remove Listing',
    confirmClass: 'bg-red-500 hover:bg-red-600',
  },
  warn: {
    title: 'Warn User',
    body: 'This logs a formal warning against the user\'s account.',
    confirmLabel: 'Send Warning',
    confirmClass: 'bg-amber-500 hover:bg-amber-600',
  },
  suspend: {
    title: 'Suspend Account',
    body: 'This immediately suspends the user\'s account, logging them out of any active session.',
    confirmLabel: 'Suspend Account',
    confirmClass: 'bg-red-500 hover:bg-red-600',
  },
};

export default function ReportQueue() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('Pending');
  const [pendingAction, setPendingAction] = useState(null); // { report, action }
  const [warnMessage, setWarnMessage] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [toast, setToast] = useState('');

  const load = () => {
    setLoading(true);
    getReportQueue()
      .then(r => setReports(Array.isArray(r.data) ? r.data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2800); };

  const filtered = reports.filter(r => {
    if (tab === 'Pending') return r.status === 'pending';
    if (tab === 'Priority') return r.status === 'pending' && r.priority;
    if (tab === 'Resolved') return r.status !== 'pending';
    return true;
  });

  const counts = {
    Pending: reports.filter(r => r.status === 'pending').length,
    Priority: reports.filter(r => r.status === 'pending' && r.priority).length,
    Resolved: reports.filter(r => r.status !== 'pending').length,
    All: reports.length,
  };

  const openConfirm = (report, action) => {
    setWarnMessage('');
    setPendingAction({ report, action });
  };

  const confirmAction = async () => {
    if (!pendingAction) return;
    const { report, action } = pendingAction;
    setBusyId(report.id);
    try {
      await resolveReport(report.id, action, action === 'warn' ? warnMessage : undefined);
      const newStatus = action === 'dismiss' ? 'dismissed' : 'actioned';
      setReports(prev => prev.map(r =>
        (r.target_type === report.target_type && r.target_id === report.target_id && r.status === 'pending')
          ? { ...r, status: newStatus }
          : r
      ));
      showToast(ACTION_COPY[action].confirmLabel + ' — done.');
      setPendingAction(null);
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not resolve report.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl font-extrabold text-gray-800">Report Queue</h1>
        <p className="text-gray-400 text-sm mt-1">Review flagged listings and user reports</p>
      </motion.div>

      <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-1">
        {TABS.map(t => {
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
                  layoutId="report-queue-tab-pill"
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
            {[1,2,3].map(i => <div key={i} className="h-20 bg-gray-50 rounded-lg animate-pulse" />)}
          </div>
        ) : (
          <ReportQueueTable reports={filtered} onAction={openConfirm} busyId={busyId} />
        )}
      </Reveal>

      {/* Action confirmation modal */}
      <AnimatePresence>
        {pendingAction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={() => !busyId && setPendingAction(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-gray-800 mb-1">{ACTION_COPY[pendingAction.action].title}</h3>
              <p className="text-sm text-gray-500 mb-4">{ACTION_COPY[pendingAction.action].body}</p>

              {pendingAction.action === 'warn' && (
                <textarea
                  rows={3}
                  value={warnMessage}
                  onChange={(e) => setWarnMessage(e.target.value)}
                  placeholder="Warning message (optional)"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#F4A261] focus:ring-2 focus:ring-orange-100 transition resize-none placeholder-gray-300 mb-4"
                />
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setPendingAction(null)}
                  disabled={busyId === pendingAction.report.id}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={confirmAction}
                  disabled={busyId === pendingAction.report.id}
                  className={`flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-colors disabled:opacity-60 ${ACTION_COPY[pendingAction.action].confirmClass}`}
                >
                  {busyId === pendingAction.report.id ? 'Working…' : ACTION_COPY[pendingAction.action].confirmLabel}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
