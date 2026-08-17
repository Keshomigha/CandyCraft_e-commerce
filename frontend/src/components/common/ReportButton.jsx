import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { submitReport } from '../../api/reportApi';
import useAuth from '../../hooks/useAuth';

const REASONS = [
  { value: 'scam', label: 'Scam or fraud' },
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'spam', label: 'Spam' },
  { value: 'prohibited', label: 'Prohibited item' },
  { value: 'other', label: 'Other' },
];

export default function ReportButton({ targetType, targetId, targetLabel, variant = 'icon' }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // { ok: bool, message: string }

  const openModal = (e) => {
    e?.stopPropagation();
    e?.preventDefault();
    if (!user) { navigate('/login'); return; }
    setOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setOpen(false);
    setTimeout(() => {
      setReason('');
      setDetails('');
      setResult(null);
    }, 200);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) return;
    setSubmitting(true);
    try {
      const res = await submitReport({ targetType, targetId, reason, details });
      setResult({
        ok: true,
        message: res.data.autoFlagged
          ? 'Report submitted. This has now been flagged for priority review.'
          : "Report submitted. Thanks for helping keep CandyCraft safe.",
      });
    } catch (err) {
      setResult({ ok: false, message: err.response?.data?.message || 'Could not submit report.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {variant === 'icon' ? (
        <motion.button
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          onClick={openModal}
          title="Report"
          className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow text-gray-400 hover:text-red-500 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3v18M3 4h13l-2 4 2 4H3" />
          </svg>
        </motion.button>
      ) : (
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={openModal}
          className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-red-500 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3v18M3 4h13l-2 4 2 4H3" />
          </svg>
          Report
        </motion.button>
      )}

      {createPortal(
        <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <AnimatePresence mode="wait">
                {result ? (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-4"
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${result.ok ? 'bg-green-100' : 'bg-red-100'}`}>
                      <span className="text-2xl">{result.ok ? '✅' : '⚠️'}</span>
                    </div>
                    <p className="text-sm text-gray-700 mb-5">{result.message}</p>
                    <button
                      onClick={closeModal}
                      className="w-full px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors"
                    >
                      Close
                    </button>
                  </motion.div>
                ) : (
                  <motion.form key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={handleSubmit}>
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                      <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3v18M3 4h13l-2 4 2 4H3" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 text-center mb-1">
                      Report {targetType === 'product' ? 'Listing' : 'User'}
                    </h3>
                    <p className="text-sm text-gray-500 text-center mb-5">
                      {targetLabel ? <>Reporting <strong>"{targetLabel}"</strong>. </> : null}
                      Let us know what's wrong — our team will review it.
                    </p>

                    <div className="space-y-2 mb-4">
                      {REASONS.map((r) => (
                        <label
                          key={r.value}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-sm cursor-pointer transition-colors
                            ${reason === r.value ? 'border-pink-400 bg-pink-50 text-gray-800' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                        >
                          <input
                            type="radio"
                            name="reason"
                            value={r.value}
                            checked={reason === r.value}
                            onChange={() => setReason(r.value)}
                            className="accent-pink-500"
                          />
                          {r.label}
                        </label>
                      ))}
                    </div>

                    <textarea
                      rows={3}
                      value={details}
                      onChange={(e) => setDetails(e.target.value)}
                      placeholder="Additional details (optional)"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition resize-none placeholder-gray-300 mb-5"
                    />

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={closeModal}
                        disabled={submitting}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <motion.button
                        whileHover={{ scale: reason && !submitting ? 1.02 : 1 }}
                        whileTap={{ scale: reason && !submitting ? 0.98 : 1 }}
                        type="submit"
                        disabled={!reason || submitting}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
                      >
                        {submitting ? 'Submitting…' : 'Submit Report'}
                      </motion.button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
