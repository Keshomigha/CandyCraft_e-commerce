import { motion, AnimatePresence } from 'framer-motion';
import { staggerContainer, listItem } from '../../utils/motionVariants';

const REASON_LABELS = {
  scam: 'Scam or fraud',
  inappropriate: 'Inappropriate content',
  spam: 'Spam',
  prohibited: 'Prohibited item',
  other: 'Other',
};

const STATUS_STYLES = {
  pending:   'bg-amber-100 text-amber-700',
  dismissed: 'bg-gray-100 text-gray-500',
  actioned:  'bg-green-100 text-green-700',
};

function fmt(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export default function ReportQueueTable({ reports, onAction, busyId }) {
  if (reports.length === 0) {
    return (
      <div className="px-6 py-16 text-center">
        <p className="text-4xl mb-3">🚩</p>
        <p className="text-gray-400 text-sm">No reports found.</p>
      </div>
    );
  }

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="divide-y divide-gray-50">
      <AnimatePresence initial={false}>
        {reports.map((r) => {
          const isPending = r.status === 'pending';
          const isBusy = busyId === r.id;
          return (
            <motion.div key={r.id} layout variants={listItem} exit="exit" className="px-6 py-4 hover:bg-gray-50/60 transition-colors">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-gray-800 text-white capitalize">
                      {r.target_type}
                    </span>
                    <span className="text-sm font-semibold text-gray-800">{r.target_name || `#${r.target_id}`}</span>
                    {r.priority && (
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-600">
                        🔥 Priority · {r.total_reports_for_target} reports
                      </span>
                    )}
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_STYLES[r.status]}`}>
                      {r.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium text-gray-700">{REASON_LABELS[r.reason] || r.reason}</span>
                    {' '}reported by {r.reporter_name} ({r.reporter_email}) · {fmt(r.created_at)}
                  </p>
                  {r.details && (
                    <p className="text-sm text-gray-500 mt-1.5 bg-gray-50 rounded-lg px-3 py-2">{r.details}</p>
                  )}
                </div>

                {isPending && (
                  <div className="flex flex-wrap gap-1.5 flex-shrink-0">
                    <motion.button
                      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      disabled={isBusy}
                      onClick={() => onAction(r, 'dismiss')}
                      className="text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-60"
                    >
                      Dismiss
                    </motion.button>
                    {r.target_type === 'product' && (
                      <motion.button
                        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        disabled={isBusy}
                        onClick={() => onAction(r, 'remove')}
                        className="text-xs font-semibold px-3 py-1.5 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-60"
                      >
                        Remove Listing
                      </motion.button>
                    )}
                    {r.target_type === 'user' && (
                      <>
                        <motion.button
                          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                          disabled={isBusy}
                          onClick={() => onAction(r, 'warn')}
                          className="text-xs font-semibold px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors disabled:opacity-60"
                        >
                          Warn User
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                          disabled={isBusy}
                          onClick={() => onAction(r, 'suspend')}
                          className="text-xs font-semibold px-3 py-1.5 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-60"
                        >
                          Suspend Account
                        </motion.button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
}
