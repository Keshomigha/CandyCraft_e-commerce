import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getOrderById } from '../../api/orderApi';
import { staggerContainer, listItem } from '../../utils/motionVariants';

const STATUS_STYLES = {
  pending:    'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped:    'bg-purple-100 text-purple-700',
  delivered:  'bg-green-100 text-green-700',
  cancelled:  'bg-red-100 text-red-500',
};

function fmt(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function CustomizationCard({ customization }) {
  if (!customization) return null;
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

  if (rows.length === 0 && !customization.fee && !customization.photoUrl) return null;

  return (
    <div className="bg-orange-50 border-2 border-dashed border-[#F4A261] rounded-xl p-4 mt-3">
      <p className="text-sm font-bold text-gray-800 mb-2">✨ Customization Details</p>
      {customization.photoUrl && (
        <div className="mb-3">
          <p className="text-xs text-gray-500 mb-1.5">Uploaded Photo</p>
          <img
            src={`${import.meta.env.VITE_API_URL}${customization.photoUrl}`}
            alt="Customer upload"
            className="w-28 h-28 object-cover rounded-lg border border-orange-200"
          />
        </div>
      )}
      <dl className="space-y-1.5">
        {rows.map(([label, value]) => (
          <div key={label} className="flex flex-col sm:flex-row sm:justify-between gap-0.5 text-sm">
            <dt className="text-gray-500">{label}</dt>
            <dd className="text-gray-800 font-medium sm:text-right sm:max-w-[60%]">{value}</dd>
          </div>
        ))}
        {Number(customization.fee) > 0 && (
          <div className="flex justify-between text-sm pt-1.5 mt-1.5 border-t border-orange-200">
            <dt className="text-gray-500">Additional Customization Fee</dt>
            <dd className="text-[#F4A261] font-bold">LKR {Number(customization.fee).toFixed(2)}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}

export default function OrderDetails() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    getOrderById(id)
      .then((r) => setOrder(r.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="bg-white rounded-2xl h-40 animate-pulse shadow-sm border border-gray-100" />
        <div className="bg-white rounded-2xl h-40 animate-pulse shadow-sm border border-gray-100" />
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 py-20 text-center">
        <p className="text-4xl mb-3">📦</p>
        <p className="text-gray-500 font-medium">Order not found</p>
        <Link to="/buyer/orders" className="mt-4 inline-block text-sm text-[#F4A261] hover:underline">← Back to My Orders</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Link to="/buyer/orders" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#F4A261] transition-colors mb-3">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to My Orders
        </Link>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-extrabold text-gray-800">Order #{order.id}</h1>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${STATUS_STYLES[order.status] || 'bg-gray-100 text-gray-600'}`}>
            {order.status}
          </span>
        </div>
        <p className="text-gray-400 text-sm mt-1">Placed on {fmt(order.created_at)}</p>
      </motion.div>

      {/* Summary */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Shipping Address</p>
          <p className="text-sm text-gray-700">{order.shipping_address || '—'}</p>
        </div>
        <div className="sm:text-right">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Order Total</p>
          <p className="text-xl font-extrabold text-[#F4A261]">₹{Number(order.total_amount).toLocaleString()}</p>
        </div>
      </motion.div>

      {/* Items */}
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-4">
        {(order.items || []).map((item) => (
          <motion.div key={item.id} variants={listItem} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-orange-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                {item.image_url ? (
                  <img src={`${import.meta.env.VITE_API_URL}${item.image_url}`} alt={item.name} className="w-full h-full object-contain p-1" />
                ) : (
                  <span className="text-2xl">🍬</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 text-sm truncate">{item.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">Qty: {item.quantity}</p>
              </div>
              <p className="font-bold text-gray-800 text-sm flex-shrink-0">
                ₹{Number(item.price * item.quantity).toLocaleString()}
              </p>
            </div>
            <CustomizationCard customization={item.customization} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
