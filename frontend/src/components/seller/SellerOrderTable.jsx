import { useState } from 'react';

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

export default function SellerOrderTable({ orders, onUpdateStatus, apiUrl }) {
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
        <tbody className="divide-y divide-gray-50">
          {orders.map((o, idx) => {
            const nextOptions = NEXT_STATUSES[o.order_status] || [];
            return (
              <tr key={idx} className="hover:bg-gray-50/60 transition-colors">
                <td className="px-6 py-3">
                  <span className="text-sm font-semibold text-gray-800">#{o.order_id}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-700 truncate block max-w-[200px]">{o.name}</span>
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
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
