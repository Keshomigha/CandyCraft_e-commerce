import { useEffect, useState } from 'react';
import { getSellerStats, getSellerRevenueChart } from '../../api/sellerApi';
import SalesChart from '../../components/seller/SalesChart';
import SellerStatsCard from '../../components/seller/SellerStatsCard';

export default function SalesEarnings() {
  const [stats, setStats] = useState(null);
  const [chart, setChart] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getSellerStats().catch(() => ({ data: null })),
      getSellerRevenueChart().catch(() => ({ data: [] })),
    ]).then(([s, c]) => {
      setStats(s.data);
      setChart(Array.isArray(c.data) ? c.data : []);
    }).finally(() => setLoading(false));
  }, []);

  const totalChartRevenue = chart.reduce((s, d) => s + d.revenue, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-800">Sales & Earnings</h1>
        <p className="text-gray-400 text-sm mt-1">Track your revenue and sales performance</p>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white rounded-2xl p-5 h-28 animate-pulse shadow-sm border border-gray-100" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SellerStatsCard
            icon="💰"
            value={`LKR ${(stats?.totalRevenue ?? 0).toLocaleString()}`}
            label="Total Revenue"
            color="bg-green-100"
          />
          <SellerStatsCard
            icon="📦"
            value={stats?.totalOrders ?? 0}
            label="Total Orders"
            color="bg-blue-100"
          />
          <SellerStatsCard
            icon="🛒"
            value={stats?.totalItemsSold ?? 0}
            label="Items Sold"
            color="bg-purple-100"
          />
        </div>
      )}

      {/* Revenue Chart (larger) */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800">Revenue Trend (Last 6 Months)</h2>
          {chart.length > 0 && (
            <span className="text-xs font-medium text-gray-400">
              Total: LKR {totalChartRevenue.toLocaleString()}
            </span>
          )}
        </div>
        <div className="px-4 py-5">
          {loading ? (
            <div className="h-72 animate-pulse bg-gray-50 rounded-xl" />
          ) : (
            <SalesChart data={chart} height={300} />
          )}
        </div>
      </div>

      {/* Monthly Breakdown Table */}
      {!loading && chart.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-800">Monthly Breakdown</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Month</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Revenue</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {chart.map((d, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-6 py-3 text-sm font-semibold text-gray-800">{d.month}</td>
                    <td className="px-6 py-3 text-right text-sm font-semibold text-[#F4A261]">
                      LKR {d.revenue.toLocaleString()}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#F4A261] to-[#E76F51] rounded-full transition-all duration-500"
                            style={{ width: `${totalChartRevenue > 0 ? (d.revenue / totalChartRevenue) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400 w-10 text-right">
                          {totalChartRevenue > 0 ? Math.round((d.revenue / totalChartRevenue) * 100) : 0}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
