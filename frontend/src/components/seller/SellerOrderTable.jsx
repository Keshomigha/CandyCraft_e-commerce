import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { staggerContainer, tableRow } from '../../utils/motionVariants';

const STATUS_STYLES = {
  pending:    'bg-amber-100 text-amber-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped:    'bg-purple-100 text-purple-700',
  delivered:  'bg-green-100 text-green-700',
  cancelled:  'bg-red-100 text-red-600',
};

const NEXT_STATUSES = {
  pending:    ['processing'],
  processing: ['shipped'],
  shipped:    ['delivered'],
};

function fmt(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function CustomizationRows({ customization }) {
  const rows = [
    ['Recipient Name', customization.recipientName],
    ['Gift Message', customization.giftMessage],
    ['Custom Message', customization.customMessage],
    ['Optional Notes', customization.optionalNotes],
    ['Theme Color', customization.themeColor],
    ['Painting Size', customization.paintingSize],
    ['Name or Caption', customization.caption],
    ['Gift Wrapping', customization.giftWrapping !== undefined ? (customization.giftWrapping ? 'Yes' : 'No') : null],
    ['Greeting Card', customization.greetingCard !== undefined ? (customization.greetingCard ? 'Yes' : 'No') : null],
    ['Frame Option', customization.frameOption !== undefined ? (customization.frameOption ? 'Yes' : 'No') : null],
    ['Special Instructions', customization.specialInstructions],
  ].filter(([, value]) => value !== null && value !== undefined && value !== '');

  return (
    <>
      {customization.photoUrl && (
        <div className="mb-3">
          <p className="text-xs text-gray-500 mb-1.5">Uploaded Photo</p>
          <img
            src={`${import.meta.env.VITE_API_URL}${customization.photoUrl}`}
            alt="Customer upload"
            className="w-24 h-24 object-cover rounded-lg border border-orange-200"
          />
        </div>
      )}
      <dl className="space-y-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex flex-col sm:flex-row sm:justify-between gap-0.5 text-sm">
            <dt className="text-gray-500">{label}</dt>
            <dd className="text-gray-800 font-medium sm:text-right sm:max-w-[60%]">{value}</dd>
          </div>
        ))}
        {Number(customization.fee) > 0 && (
          <div className="flex justify-between text-sm pt-2 mt-2 border-t border-orange-200">
            <dt className="text-gray-500">Additional Customization Fee</dt>
            <dd className="text-[#F4A261] font-bold">LKR {Number(customization.fee).toFixed(2)}</dd>
          </div>
        )}
      </dl>
    </>
  );
}

export default function SellerOrderTable({ orders, onUpdateStatus, apiUrl }) {
  const [updating, setUpdating] = useState(null);
  const [viewing, setViewing] = useState(null);

  if (orders.length === 0) {
    return (
      <div className="px-6 py-16 text-center">
        <p className="text-4xl mb-3">📋</p>
        <p className="text-gray-400 text-sm">No orders found.</p>
      </div>
    );
  }

  const handleStatus = async (orderId, status) => {
    setUpdating(orderId);
    await onUpdateStatus(orderId, status);
    setUpdating(null);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[700px]">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Order</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Product</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Qty</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Total</th>
            <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
            <th className="text-right px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Action</th>
          </tr>
        </thead>
        <motion.tbody variants={staggerContainer} initial="hidden" animate="visible" className="divide-y divide-gray-50">
          <AnimatePresence initial={false}>
            {orders.map((o, idx) => {
              const nextOptions = NEXT_STATUSES[o.order_status] || [];
              return (
                <motion.tr key={idx} variants={tableRow} exit="exit" className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-6 py-3">
                    <span className="text-sm font-semibold text-gray-800">#{o.order_id}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-700 truncate block max-w-[200px]">{o.name}</span>
                      {o.customization && (
                        <button
                          onClick={() => setViewing(o)}
                          title="View customization details"
                          className="text-[11px] font-bold text-pink-600 bg-pink-50 hover:bg-pink-100 px-2 py-0.5 rounded-full transition-colors flex-shrink-0"
                        >
                          ✨
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-500">{fmt(o.order_date)}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm text-gray-700">{o.quantity}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-semibold text-gray-800">
                      LKR {Number(o.price * o.quantity).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_STYLES[o.order_status] || 'bg-gray-100 text-gray-600'}`}>
                      {o.order_status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    {nextOptions.length > 0 ? (
                      <select
                        disabled={updating === o.order_id}
                        onChange={e => handleStatus(o.order_id, e.target.value)}
                        value=""
                        className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-[#F4A261] bg-white text-gray-600 cursor-pointer"
                      >
                        <option value="" disabled>Update →</option>
                        {nextOptions.map(s => (
                          <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>
                </motion.tr>
              );
            })}
          </AnimatePresence>
        </motion.tbody>
      </table>

      {/* Customization details modal */}
      <AnimatePresence>
        {viewing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={() => setViewing(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-orange-50 border-2 border-dashed border-[#F4A261] rounded-xl p-4 mb-4">
                <p className="text-sm font-bold text-gray-800 mb-2">✨ Customization Details</p>
                <p className="text-xs text-gray-500 mb-3">Order #{viewing.order_id} · {viewing.name}</p>
                <CustomizationRows customization={viewing.customization} />
              </div>
              <button
                onClick={() => setViewing(null)}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
