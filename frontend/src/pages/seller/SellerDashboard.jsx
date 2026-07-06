import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { getSellerDashboard } from '../../api/sellerApi';
import SellerStatsCard from '../../components/seller/SellerStatsCard';
import SalesChart from '../../components/seller/SalesChart';

const STATUS_STYLES = {
  pending:    'bg-amber-100 text-amber-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped:    'bg-purple-100 text-purple-700',
  delivered:  'bg-green-100 text-green-700',
  cancelled:  'bg-red-100 text-red-600',
};

function fmt(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function formatCurrency(val) {
  if (val >= 1000000) return `LKR ${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `LKR ${(val / 1000).toFixed(0)}K`;
  return `LKR ${val.toLocaleString()}`;
}

export default function SellerDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSellerDashboard()
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const firstName = user?.name?.split(' ')[0] || 'there';
  const stats = data?.stats;
  const chart = data?.revenueChart || [];
  const recent = data?.recentOrders || [];

  // Calculate growth %
  const growthPct = chart.length >= 2
    ? Math.round(((chart[chart.length - 1].revenue - chart[chart.length - 2].revenue) / Math.max(chart[chart.length - 2].revenue, 1)) * 100)
    : 0;

  return (
    <div className="space-y-7">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-800">
          Welcome back, {firstName}! 👋
        </h1>
        <p className="text-gray-400 text-sm mt-1">Here's how your store is performing.</p>
      </div>

      {/* Stat Cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-white rounded-2xl p-5 h-28 animate-pulse shadow-sm border border-gray-100" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SellerStatsCard icon="🎁" value={stats?.totalProducts ?? 0} label="Products" color="bg-orange-100" />
          <SellerStatsCard icon="📋" value={stats?.totalOrders ?? 0} label="Orders" color="bg-blue-100" />
          <SellerStatsCard icon="💰" value={formatCurrency(stats?.totalRevenue ?? 0)} label="Revenue" color="bg-green-100" />
          <SellerStatsCard
            icon={<span className="flex items-center gap-1">{stats?.avgRating ?? 0} <span className="text-yellow-400">⭐</span></span>}
            value={<span className="flex items-center gap-1">{stats?.avgRating ?? 0} <span className="text-yellow-400 text-lg">⭐</span></span>}
            label="Avg Rating"
            color="bg-yellow-50"
          />
        </div>
      )}

      {/* Revenue Overview */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800">Revenue Overview</h2>
          {growthPct !== 0 && (
            <span className={`text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1 ${growthPct >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                  d={growthPct >= 0
                    ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    : "M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6"
                  }
                />
              </svg>
              {growthPct >= 0 ? '+' : ''}{growthPct}% this month
            </span>
          )}
        </div>
        <div className="px-4 py-4">
          {loading ? (
            <div className="h-56 animate-pulse bg-gray-50 rounded-xl" />
          ) : (
            <SalesChart data={chart} height={240} />
          )}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800">Recent Orders</h2>
          <Link to="/seller/orders" className="text-[#F4A261] text-sm font-medium hover:underline">
            View All
          </Link>
        </div>
        {loading ? (
          <div className="px-6 py-6 space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-14 bg-gray-50 rounded-lg animate-pulse" />)}
          </div>
        ) : recent.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-4xl mb-3">📦</p>
            <p className="text-gray-400 text-sm">No orders yet. Share your products to get started!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recent.map((order, idx) => (
              <div key={idx} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/60 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {order.image_url ? (
                      <img src={`${import.meta.env.VITE_API_URL}${order.image_url}`} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg">🍬</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{order.product_name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      #{order.order_id} · {order.buyer_name} · Qty: {order.quantity}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                  <span className="font-bold text-[#F4A261] text-sm whitespace-nowrap">
                    LKR {Number(order.price * order.quantity).toLocaleString()}
                  </span>
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_STYLES[order.status] || 'bg-gray-100 text-gray-600'}`}>
                    {order.status === 'pending' ? 'New' : order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
