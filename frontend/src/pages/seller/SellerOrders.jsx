import { useEffect, useState } from 'react';
import { getSellerOrders, updateSellerOrderStatus } from '../../api/sellerApi';
import SellerOrderTable from '../../components/seller/SellerOrderTable';

const API_URL = import.meta.env.VITE_API_URL;
const TABS = ['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function SellerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');

  const load = () => {
    setLoading(true);
    getSellerOrders()
      .then(r => setOrders(Array.isArray(r.data) ? r.data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = tab === 'all'
    ? orders
    : orders.filter(o => o.order_status === tab);

  const handleUpdateStatus = async (orderId, status) => {
    try {
      await updateSellerOrderStatus(orderId, status);
      // Update local state
      setOrders(prev => prev.map(o =>
        o.order_id === orderId ? { ...o, order_status: status } : o
      ));
    } catch {
      // silently fail
    }
  };

  const counts = TABS.reduce((acc, t) => {
    acc[t] = t === 'all' ? orders.length : orders.filter(o => o.order_status === t).length;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-800">Orders</h1>
        <p className="text-gray-400 text-sm mt-1">Manage orders for your products</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize whitespace-nowrap
              ${tab === t
                ? 'bg-gradient-to-r from-[#F4A261] to-[#E76F51] text-white shadow-sm'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
              }`}
          >
            {t === 'all' ? 'All' : t}
            <span className={`text-[11px] px-1.5 py-0.5 rounded-md font-semibold
              ${tab === t ? 'bg-white/20' : 'bg-gray-100 text-gray-500'}`}>
              {counts[t]}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="px-6 py-8 space-y-3">
            {[1,2,3,4].map(i => <div key={i} className="h-14 bg-gray-50 rounded-lg animate-pulse" />)}
          </div>
        ) : (
          <SellerOrderTable
            orders={filtered}
            onUpdateStatus={handleUpdateStatus}
            apiUrl={API_URL}
          />
        )}
      </div>
    </div>
  );
}
