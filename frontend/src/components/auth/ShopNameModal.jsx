import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import LogoMark from '../common/LogoMark';

export default function ShopNameModal({ open, submitting, onCancel, onSubmit }) {
  const [shopName, setShopName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!shopName.trim()) return;
    onSubmit(shopName.trim());
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
          >
            <div className="flex justify-center mb-4">
              <LogoMark className="w-11 h-11" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 text-center mb-1">Welcome to CandyCraft! 🎉</h3>
            <p className="text-sm text-gray-500 text-center mb-5">
              You're almost set up as a seller. What would you like to name your shop?
            </p>

            <form onSubmit={handleSubmit}>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Shop Name</label>
              <input
                autoFocus
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="e.g. Sweet Treats"
                className="w-full border border-gray-200 rounded-full px-4 py-3 text-sm outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition placeholder-gray-300 mb-5"
              />

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: shopName.trim() && !submitting ? 1.02 : 1 }}
                  whileTap={{ scale: shopName.trim() && !submitting ? 0.98 : 1 }}
                  type="submit"
                  disabled={!shopName.trim() || submitting}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-linear-to-r from-pink-500 to-purple-500 text-white text-sm font-semibold disabled:opacity-50"
                >
                  {submitting ? 'Setting up…' : 'Finish Setup'}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
