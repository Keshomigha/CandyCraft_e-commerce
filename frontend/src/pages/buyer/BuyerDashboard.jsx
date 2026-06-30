import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { getMyOrders } from '../../api/orderApi';
import { getWishlist } from '../../api/wishlistApi';
import { getMyReviews } from '../../api/reviewApi';
import { getProducts } from '../../api/productApi';

const STATUS_STYLES = {
  pending:    'bg-yellow-100 text-yellow-700',
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

function StatCard({ icon, value, label, color }) {
  return (
    <div className="bg-white rounded-2xl p-5 flex items-center gap-4 shadow-sm border border-gray-100">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color}`}>
        <span className="text-xl">{icon}</span>
      </div>
      <div>
        <p className="text-2xl font-extrabold text-gray-800">{value}</p>
        <p className="text-xs text-gray-400 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export default function BuyerDashboard() {
  const { user } = useAuth();
  const [orders, setOrders]       = useState([]);
  const [wishlist, setWishlist]   = useState([]);
  const [reviews, setReviews]     = useState([]);
  const [products, setProducts]   = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([
      getMyOrders().catch(() => ({ data: [] })),
      getWishlist().catch(() => ({ data: [] })),
      getMyReviews().catch(() => ({ data: [] })),
      getProducts({ limit: 3 }).catch(() => ({ data: { products: [] } })),
    ]).then(([o, w, r, p]) => {
      setOrders(Array.isArray(o.data) ? o.data : []);
      setWishlist(Array.isArray(w.data) ? w.data : []);
      setReviews(Array.isArray(r.data) ? r.data : []);
      setProducts(Array.isArray(p.data.products) ? p.data.products : []);
    }).finally(() => setLoading(false));
  }, []);

  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-800">
          Welcome back, {firstName}! 👋
        </h1>
        <p className="text-gray-400 text-sm mt-1">Here's what's happening with your account.</p>
      </div>

      {/* Stat Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white rounded-2xl p-5 h-20 animate-pulse shadow-sm border border-gray-100" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard icon="📦" value={orders.length}   label="Total Orders"    color="bg-orange-100" />
          <StatCard icon="💜" value={wishlist.length}  label="Wishlist Items"  color="bg-purple-100" />
          <StatCard icon="⭐" value={reviews.length}   label="Reviews Written" color="bg-yellow-100" />
        </div>
      )}

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800">Recent Orders</h2>
          <Link to="/buyer/orders" className="text-[#F4A261] text-sm font-medium hover:underline">
            View All →
          </Link>
        </div>
        {loading ? (
          <div className="px-6 py-8 space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />)}
          </div>
        ) : orders.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-4xl mb-3">📦</p>
            <p className="text-gray-400 text-sm">No orders yet. Start shopping!</p>
            <Link to="/products" className="mt-4 inline-block bg-[#F4A261] text-white text-sm px-5 py-2 rounded-full font-semibold hover:bg-[#E76F51] transition-colors">
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {orders.slice(0, 3).map(order => (
              <div key={order.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Order #{order.id}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{fmt(order.created_at)}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-[#F4A261] text-sm">
                    ₹{Number(order.total_amount).toLocaleString()}
                  </span>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_STYLES[order.status] || 'bg-gray-100 text-gray-600'}`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recommended Products */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-800">Recommended for You</h2>
          <Link to="/products" className="text-[#F4A261] text-sm font-medium hover:underline">
            Browse More →
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl h-52 animate-pulse shadow-sm border border-gray-100" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {products.map(p => (
              <Link key={p.id} to={`/products/${p.id}`}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
              >
                <div className="h-36 bg-orange-50 flex items-center justify-center overflow-hidden">
                  {p.image_url ? (
                    <img
                      src={`${import.meta.env.VITE_API_URL}${p.image_url}`}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <span className="text-5xl">🍬</span>
                  )}
                </div>
                <div className="p-4">
                  <p className="font-semibold text-gray-800 text-sm truncate">{p.name}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[#F4A261] font-bold text-sm">
                      ₹{Number(p.price).toLocaleString()}
                    </span>
                    <div className="flex items-center gap-0.5">
                      <svg className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                      <span className="text-xs text-gray-400">4.8</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
