import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getPlatformStats, getAllUsers, getAllSellersAdmin, getAllProductsAdmin, getAllOrdersAdmin } from '../../api/adminApi';
import PlatformStatsCard from '../../components/admin/PlatformStatsCard';
import Reveal from '../../components/common/Reveal';

function formatCurrency(val) {
  if (val >= 1000000) return `₹${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(0)}K`;
  return `₹${Number(val).toLocaleString()}`;
}

function Breakdown({ title, rows, colorMap }) {
  const total = rows.reduce((s, r) => s + r.count, 0);
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h2 className="font-bold text-gray-800 mb-4">{title}</h2>
      <div className="space-y-3">
        {rows.map(({ label, count }) => (
          <div key={label} className="flex items-center gap-3">
            <span className="text-xs font-medium text-gray-500 w-24 capitalize">{label}</span>
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${colorMap[label] || 'bg-gray-400'}`}
                initial={{ width: 0 }}
                animate={{ width: total > 0 ? `${(count / total) * 100}%` : '0%' }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <span className="text-xs text-gray-400 w-8 text-right">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PlatformReports() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getPlatformStats().catch(() => ({ data: null })),
      getAllUsers().catch(() => ({ data: [] })),
      getAllSellersAdmin().catch(() => ({ data: [] })),
      getAllProductsAdmin().catch(() => ({ data: [] })),
      getAllOrdersAdmin().catch(() => ({ data: [] })),
    ]).then(([s, u, se, p, o]) => {
      setStats(s.data);
      setUsers(Array.isArray(u.data) ? u.data : []);
      setSellers(Array.isArray(se.data) ? se.data : []);
      setProducts(Array.isArray(p.data) ? p.data : []);
      setOrders(Array.isArray(o.data) ? o.data : []);
    }).finally(() => setLoading(false));
  }, []);

  const countBy = (arr, key) => {
    const map = {};
    arr.forEach(item => { map[item[key]] = (map[item[key]] || 0) + 1; });
    return Object.entries(map).map(([label, count]) => ({ label, count }));
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl font-extrabold text-gray-800">Platform Reports</h1>
        <p className="text-gray-400 text-sm mt-1">Aggregate view of platform health and activity</p>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="bg-white rounded-2xl p-5 h-24 animate-pulse shadow-sm border border-gray-100" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <PlatformStatsCard index={0} icon="👥" value={stats?.totalUsers ?? 0} label="Total Users" color="bg-blue-100" />
          <PlatformStatsCard index={1} icon="🏪" value={stats?.totalSellers ?? 0} label="Total Sellers" color="bg-purple-100" />
          <PlatformStatsCard index={2} icon="🎁" value={stats?.totalProducts ?? 0} label="Total Products" color="bg-orange-100" />
          <PlatformStatsCard index={3} icon="📋" value={stats?.totalOrders ?? 0} label="Total Orders" color="bg-green-100" />
          <PlatformStatsCard index={4} icon="💰" value={formatCurrency(stats?.totalRevenue ?? 0)} label="Platform Revenue" color="bg-yellow-50" />
        </div>
      )}

      {!loading && (
        <Reveal className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Breakdown
            title="Users by Role"
            rows={countBy(users, 'role')}
            colorMap={{ buyer: 'bg-blue-400', seller: 'bg-purple-400', admin: 'bg-gray-700' }}
          />
          <Breakdown
            title="Users by Status"
            rows={countBy(users, 'status')}
            colorMap={{ active: 'bg-green-400', suspended: 'bg-red-400' }}
          />
          <Breakdown
            title="Sellers by Status"
            rows={countBy(sellers, 'status')}
            colorMap={{ pending: 'bg-yellow-400', approved: 'bg-green-400', rejected: 'bg-red-400', suspended: 'bg-gray-700' }}
          />
          <Breakdown
            title="Products by Status"
            rows={countBy(products, 'status')}
            colorMap={{ pending: 'bg-yellow-400', approved: 'bg-green-400', rejected: 'bg-red-400' }}
          />
          <Breakdown
            title="Orders by Status"
            rows={countBy(orders, 'status')}
            colorMap={{ pending: 'bg-amber-400', processing: 'bg-blue-400', shipped: 'bg-purple-400', delivered: 'bg-green-400', cancelled: 'bg-red-400' }}
          />
        </Reveal>
      )}
    </div>
  );
}
