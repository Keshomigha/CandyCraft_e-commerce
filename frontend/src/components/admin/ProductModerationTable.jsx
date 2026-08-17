import { motion, AnimatePresence } from 'framer-motion';
import { staggerContainer, tableRow } from '../../utils/motionVariants';

const STATUS_STYLES = {
  pending:  'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-600',
};

export default function ProductModerationTable({ products, apiUrl, onApprove, onReject, onDelete, busyId }) {
  if (products.length === 0) {
    return (
      <div className="px-6 py-16 text-center">
        <p className="text-4xl mb-3">🎁</p>
        <p className="text-gray-400 text-sm">No products found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px]">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Product</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Seller</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Price</th>
            <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
            <th className="text-right px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <motion.tbody variants={staggerContainer} initial="hidden" animate="visible" className="divide-y divide-gray-50">
          <AnimatePresence initial={false}>
            {products.map(p => (
              <motion.tr key={p.id} variants={tableRow} exit="exit" className="hover:bg-gray-50/60 transition-colors">
                <td className="px-6 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {p.image_url ? (
                        <img src={`${apiUrl}${p.image_url}`} alt="" className="w-full h-full object-contain p-1" />
                      ) : (
                        <span className="text-lg">🍬</span>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-gray-800 truncate max-w-[180px]">{p.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                    {p.shop_name}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                  ₹{Number(p.price).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_STYLES[p.status] || 'bg-gray-100 text-gray-600'}`}>
                    {p.status}
                  </span>
                </td>
                <td className="px-6 py-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {p.status !== 'approved' && (
                      <motion.button
                        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        disabled={busyId === p.id}
                        onClick={() => onApprove(p)}
                        className="text-xs font-semibold px-2.5 py-1.5 rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors disabled:opacity-60"
                      >
                        Approve
                      </motion.button>
                    )}
                    {p.status !== 'rejected' && (
                      <motion.button
                        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        disabled={busyId === p.id}
                        onClick={() => onReject(p)}
                        className="text-xs font-semibold px-2.5 py-1.5 rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors disabled:opacity-60"
                      >
                        Reject
                      </motion.button>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      disabled={busyId === p.id}
                      onClick={() => onDelete(p)}
                      className="text-xs font-semibold px-2.5 py-1.5 rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-60"
                    >
                      Delete
                    </motion.button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </AnimatePresence>
        </motion.tbody>
      </table>
    </div>
  );
}
