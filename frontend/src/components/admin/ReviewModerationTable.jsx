import { motion, AnimatePresence } from 'framer-motion';
import { staggerContainer, listItem } from '../../utils/motionVariants';

function Stars({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <svg key={i} className={`w-3.5 h-3.5 ${i <= rating ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function fmt(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export default function ReviewModerationTable({ reviews, onToggleVisibility, onDelete, busyId }) {
  if (reviews.length === 0) {
    return (
      <div className="px-6 py-16 text-center">
        <p className="text-4xl mb-3">⭐</p>
        <p className="text-gray-400 text-sm">No reviews found.</p>
      </div>
    );
  }

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="divide-y divide-gray-50">
      <AnimatePresence initial={false}>
        {reviews.map(r => {
          const isHidden = r.status === 'hidden';
          return (
            <motion.div key={r.id} layout variants={listItem} exit="exit" className="px-6 py-4 hover:bg-gray-50/60 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-xs font-bold text-[#F4A261] flex-shrink-0">
                      {r.user_name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{r.user_name}</p>
                      <p className="text-xs text-gray-400">on {r.product_name} · {fmt(r.created_at)}</p>
                    </div>
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${isHidden ? 'bg-gray-800 text-white' : 'bg-green-100 text-green-700'}`}>
                      {r.status}
                    </span>
                  </div>
                  <Stars rating={r.rating} />
                  {r.comment && (
                    <p className="text-sm text-gray-600 mt-2 leading-relaxed">{r.comment}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  <motion.button
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    disabled={busyId === r.id}
                    onClick={() => onToggleVisibility(r)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors disabled:opacity-60
                      ${isHidden ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'}`}
                  >
                    {isHidden ? 'Unhide' : 'Hide'}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    disabled={busyId === r.id}
                    onClick={() => onDelete(r)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-60"
                  >
                    Delete
                  </motion.button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
}
