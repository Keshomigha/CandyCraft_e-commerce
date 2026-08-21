import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import useAuth from '../../hooks/useAuth';
import { getDashboardOverview } from '../../api/adminApi';
import Reveal from '../../components/common/Reveal';
import { staggerContainer, listItem } from '../../utils/motionVariants';

function formatCurrency(val) {
  if (val >= 1000000) return `₹${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(0)}K`;
  return `₹${Number(val).toLocaleString()}`;
}

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

const REASON_LABELS = {
  scam: 'scam or fraud', inappropriate: 'inappropriate content',
  spam: 'spam', prohibited: 'a prohibited item', other: 'an issue',
};

function activityLine(item) {
  switch (item.type) {
    case 'order':
      return { icon: '🛒', text: `New order #${item.id} placed by ${item.actorName}`, sub: `LKR ${Number(item.amount).toLocaleString()}` };
    case 'seller':
      return { icon: '🏪', text: `New seller "${item.shopName}" registered by ${item.actorName}`, sub: 'Awaiting review' };
    case 'report':
      return { icon: '⚠️', text: `${item.actorName} reported a ${item.targetType} for ${REASON_LABELS[item.reason] || item.reason}`, sub: null };
    case 'user':
      return { icon: '👤', text: `${item.actorName} created a ${item.role} account`, sub: null };
    case 'product':
      return { icon: '📦', text: `Product "${item.productName}" listed by ${item.shopName}`, sub: null };
    default:
      return { icon: '•', text: 'Activity', sub: null };
  }
}

function StatCard({ icon, value, label, color, trend, index = 0 }) {
  return (
    <motion.div
      custom={index}
      variants={{
        hidden: { opacity: 0, y: 16 },
        visible: (i) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] } }),
      }}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`w-11 h-11 rounded-full flex items-center justify-center ${color}`}>
          <span className="text-xl">{icon}</span>
        </div>
        {trend > 0 && (
          <span className="flex items-center gap-0.5 text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8L11 17l-4-4-6 6" />
            </svg>
            +{trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-extrabold text-gray-800">{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
    </motion.div>
  );
}

function ProgressRow({ label, value }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5 text-sm">
        <span className="text-gray-600">{label}</span>
        <span className="font-semibold text-gray-800">{value === null ? 'No data yet' : `${value}%`}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-[#F4A261] to-[#E76F51] rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${value ?? 0}%` }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardOverview()
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const firstName = user?.name?.split(' ')[0] || 'Admin';
  const stats = data?.stats;
  const trends = data?.trends;
  const quick = data?.quickActions;
  const health = data?.health;
  const activity = data?.activity || [];

  return (
    <div className="space-y-7">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl font-extrabold text-gray-800">Admin Dashboard 🧑‍💼</h1>
        <p className="text-gray-400 text-sm mt-1">Overview of the CandyCraft platform</p>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-white rounded-2xl p-5 h-28 animate-pulse shadow-sm border border-gray-100" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard index={0} icon="👥" value={stats?.totalUsers ?? 0} label="Total Users" color="bg-blue-100" trend={trends?.newUsers7d} />
          <StatCard index={1} icon="🏪" value={stats?.totalSellers ?? 0} label="Sellers" color="bg-purple-100" trend={trends?.newSellers7d} />
          <StatCard index={2} icon="🎁" value={stats?.totalProducts ?? 0} label="Products" color="bg-green-100" trend={trends?.newProducts7d} />
          <StatCard index={3} icon="📋" value={stats?.totalOrders ?? 0} label="Orders" color="bg-yellow-100" trend={trends?.newOrders7d} />
        </div>
      )}

      {!loading && (
        <Reveal className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
            <span className="text-xl">💰</span>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-gray-800">{formatCurrency(stats?.totalRevenue ?? 0)}</p>
            <p className="text-xs text-gray-400 mt-0.5">Total Platform Revenue (completed orders)</p>
          </div>
        </Reveal>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent Activity */}
        <Reveal className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-bold text-gray-800 mb-4">Recent Activity</h2>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3,4].map(i => <div key={i} className="h-12 bg-gray-50 rounded-lg animate-pulse" />)}
            </div>
          ) : activity.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">No activity yet.</p>
          ) : (
            <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="divide-y divide-gray-50">
              {activity.map((item, i) => {
                const { icon, text, sub } = activityLine(item);
                return (
                  <motion.div key={`${item.type}-${item.id}-${i}`} variants={listItem} className="flex items-start gap-3 py-3">
                    <span className="text-lg flex-shrink-0">{icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-700 leading-snug">{text}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{sub ? `${sub} · ` : ''}{timeAgo(item.created_at)}</p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </Reveal>

        {/* Quick Actions + Platform Health */}
        <div className="lg:col-span-2 space-y-6">
          <Reveal custom={1} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-bold text-gray-800 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link to="/admin/sellers" className="block rounded-xl border border-gray-100 p-4 hover:border-[#F4A261] hover:bg-orange-50/40 transition-colors">
                  <p className="text-2xl font-extrabold text-purple-500">{quick?.pendingSellers ?? 0}</p>
                  <p className="text-xs text-gray-500 mt-1">Pending Sellers</p>
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link to="/admin/products" className="block rounded-xl border border-gray-100 p-4 hover:border-[#F4A261] hover:bg-orange-50/40 transition-colors">
                  <p className="text-2xl font-extrabold text-green-500">{quick?.pendingProducts ?? 0}</p>
                  <p className="text-xs text-gray-500 mt-1">Pending Products</p>
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link to="/admin/report-queue" className="block rounded-xl border border-gray-100 p-4 hover:border-[#F4A261] hover:bg-orange-50/40 transition-colors">
                  <p className="text-2xl font-extrabold text-red-500">{quick?.priorityReports ?? 0}</p>
                  <p className="text-xs text-gray-500 mt-1">Priority Reports</p>
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link to="/admin/report-queue" className="block rounded-xl border border-gray-100 p-4 hover:border-[#F4A261] hover:bg-orange-50/40 transition-colors">
                  <p className="text-2xl font-extrabold text-amber-500">{quick?.pendingReports ?? 0}</p>
                  <p className="text-xs text-gray-500 mt-1">Pending Reports</p>
                </Link>
              </motion.div>
            </div>
          </Reveal>

          <Reveal custom={2} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-bold text-gray-800 mb-4">Platform Health</h2>
            <div className="space-y-4">
              <ProgressRow label="Order Success Rate (delivered vs. cancelled)" value={health?.orderSuccessRate ?? null} />
              <ProgressRow label="Seller Approval Rate" value={health?.sellerApprovalRate ?? null} />
              <ProgressRow label="Product Approval Rate" value={health?.productApprovalRate ?? null} />
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
