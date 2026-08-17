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

const ALL_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

function fmt(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export default function OrderMonitorTable({ orders, onUpdateStatus }) {
  const [updating, setUpdating] = useState(null);

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
      <table className="w-full min-w-[720px]">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Order</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Buyer</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Total</th>
            <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
            <th className="text-right px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Override</th>
          </tr>
        </thead>
        <motion.tbody variants={staggerContainer} initial="hidden" animate="visible" className="divide-y divide-gray-50">
          <AnimatePresence initial={false}>
            {orders.map((o) => (
              <motion.tr key={o.id} variants={tableRow} exit="exit" className="hover:bg-gray-50/60 transition-colors">
                <td className="px-6 py-3">
                  <span className="text-sm font-semibold text-gray-800">#{o.id}</span>
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm text-gray-700">{o.buyer_name}</p>
                  <p className="text-xs text-gray-400">{o.buyer_email}</p>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs text-gray-500">{fmt(o.created_at)}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-sm font-semibold text-gray-800">
                    ₹{Number(o.total_amount).toLocaleString()}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_STYLES[o.status] || 'bg-gray-100 text-gray-600'}`}>
                    {o.status}
                  </span>
                </td>
                <td className="px-6 py-3 text-right">
                  <select
                    disabled={updating === o.id}
                    onChange={e => handleStatus(o.id, e.target.value)}
                    value=""
                    className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-[#F4A261] bg-white text-gray-600 cursor-pointer"
                  >
                    <option value="" disabled>Set status →</option>
                    {ALL_STATUSES.filter(s => s !== o.status).map(s => (
                      <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </td>
              </motion.tr>
            ))}
          </AnimatePresence>
        </motion.tbody>
      </table>
    </div>
  );
}
