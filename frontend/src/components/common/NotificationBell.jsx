import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, BellOff, Package, Truck, CircleCheck, CircleX, Star, ShoppingBag,
  Store, Flag, ShieldAlert, CheckCheck,
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import { getMyOrders } from '../../api/orderApi';
import { getPendingReviews } from '../../api/reviewApi';
import { getSellerOrders, getSellerReviews } from '../../api/sellerApi';
import { getDashboardOverview } from '../../api/adminApi';
import { orderTitle } from '../../utils/constants';

const POLL_MS = 60_000;
const MAX_ITEMS = 15;

const ORDER_STATUS = {
  processing: { icon: Package, text: 'is being processed', color: 'text-blue-500 bg-blue-50' },
  shipped: { icon: Truck, text: 'has been shipped', color: 'text-indigo-500 bg-indigo-50' },
  delivered: { icon: CircleCheck, text: 'was delivered', color: 'text-green-600 bg-green-50' },
  cancelled: { icon: CircleX, text: 'was cancelled', color: 'text-red-500 bg-red-50' },
};

// Notifications are derived from existing data (no dedicated backend table).
// Each item has a stable `key` that changes when its underlying state changes,
// so a status update re-surfaces as unread.
async function fetchBuyer() {
  const [orders, pending] = await Promise.all([
    getMyOrders().then((r) => r.data).catch(() => []),
    getPendingReviews().then((r) => r.data).catch(() => []),
  ]);
  const orderItems = orders
    .filter((o) => ORDER_STATUS[o.status])
    .map((o) => ({
      key: `order:${o.id}:${o.status}`,
      icon: ORDER_STATUS[o.status].icon,
      color: ORDER_STATUS[o.status].color,
      title: `${orderTitle(o)} ${ORDER_STATUS[o.status].text}`,
      to: `/buyer/orders/${o.id}`,
      date: o.created_at,
    }));
  const reviewItems = pending.map((p) => ({
    key: `review-prompt:${p.order_id}:${p.product_id}`,
    icon: Star,
    color: 'text-amber-500 bg-amber-50',
    title: `How was "${p.product_name}"? Leave a review`,
    to: '/buyer/reviews',
  }));
  return [...orderItems, ...reviewItems];
}

async function fetchSeller() {
  const [orderRows, reviews] = await Promise.all([
    getSellerOrders().then((r) => r.data).catch(() => []),
    getSellerReviews().then((r) => r.data).catch(() => []),
  ]);
  const byOrder = new Map();
  orderRows
    .filter((row) => row.order_status === 'pending')
    .forEach((row) => {
      const entry = byOrder.get(row.order_id) || { count: 0, date: row.order_date };
      entry.count += Number(row.quantity) || 1;
      byOrder.set(row.order_id, entry);
    });
  const orderItems = [...byOrder].map(([id, { count, date }]) => ({
    key: `seller-order:${id}`,
    icon: ShoppingBag,
    color: 'text-orange-500 bg-orange-50',
    title: `New order #${id} — ${count} item${count === 1 ? '' : 's'} awaiting processing`,
    to: '/seller/orders',
    date,
  }));
  const reviewItems = reviews.slice(0, 10).map((r) => ({
    key: `seller-review:${r.id}`,
    icon: Star,
    color: 'text-amber-500 bg-amber-50',
    title: `${r.user_name} rated "${r.product_name}" ${r.rating}★`,
    to: '/seller/reviews',
    date: r.created_at,
  }));
  return [...orderItems, ...reviewItems];
}

async function fetchAdmin() {
  const { data } = await getDashboardOverview();
  const q = data.quickActions || {};
  const items = [];
  if (q.priorityReports > 0) {
    items.push({
      key: `admin-priority:${q.priorityReports}`,
      icon: ShieldAlert,
      color: 'text-red-500 bg-red-50',
      title: `${q.priorityReports} priority report${q.priorityReports === 1 ? '' : 's'} need attention`,
      to: '/admin/report-queue',
    });
  }
  if (q.pendingReports > 0) {
    items.push({
      key: `admin-reports:${q.pendingReports}`,
      icon: Flag,
      color: 'text-rose-500 bg-rose-50',
      title: `${q.pendingReports} report${q.pendingReports === 1 ? '' : 's'} in the queue`,
      to: '/admin/report-queue',
    });
  }
  if (q.pendingSellers > 0) {
    items.push({
      key: `admin-sellers:${q.pendingSellers}`,
      icon: Store,
      color: 'text-purple-500 bg-purple-50',
      title: `${q.pendingSellers} seller application${q.pendingSellers === 1 ? '' : 's'} pending`,
      to: '/admin/sellers',
    });
  }
  if (q.pendingProducts > 0) {
    items.push({
      key: `admin-products:${q.pendingProducts}`,
      icon: Package,
      color: 'text-blue-500 bg-blue-50',
      title: `${q.pendingProducts} product${q.pendingProducts === 1 ? '' : 's'} awaiting approval`,
      to: '/admin/products',
    });
  }
  (data.activity || [])
    .filter((a) => a.type === 'order')
    .forEach((a) => items.push({
      key: `admin-order:${a.id}`,
      icon: ShoppingBag,
      color: 'text-orange-500 bg-orange-50',
      title: `${a.actorName} placed order #${a.id}`,
      to: '/admin/orders',
      date: a.created_at,
    }));
  return items;
}

const FETCHERS = { buyer: fetchBuyer, seller: fetchSeller, admin: fetchAdmin };

function timeAgo(date) {
  if (!date) return '';
  const s = Math.max(0, (Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function loadSeen(storageKey) {
  try { return new Set(JSON.parse(localStorage.getItem(storageKey)) || []); } catch { return new Set(); }
}

function saveSeen(storageKey, set) {
  try { localStorage.setItem(storageKey, JSON.stringify([...set].slice(-300))); } catch { /* ignore */ }
}

export default function NotificationBell({ role, buttonClassName = 'text-gray-600 hover:bg-gray-100' }) {
  const { user } = useAuth();
  const storageKey = `notifications-seen:${role}:${user?.id ?? 'anon'}`;
  const [items, setItems] = useState([]);
  const [seen, setSeen] = useState(() => loadSeen(storageKey));
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const ref = useRef(null);

  const load = useCallback(async () => {
    const fetcher = FETCHERS[role];
    if (!fetcher) return;
    try {
      const list = await fetcher();
      list.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
      setItems(list.slice(0, MAX_ITEMS));
    } catch {
      /* keep previous items on transient failures */
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const unread = items.filter((i) => !seen.has(i.key)).length;

  const markRead = (keys) => {
    const next = new Set(seen);
    keys.forEach((k) => next.add(k));
    setSeen(next);
    saveSeen(storageKey, next);
  };

  return (
    <div ref={ref} className="relative">
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setOpen((o) => !o)}
        aria-label={unread ? `Notifications (${unread} unread)` : 'Notifications'}
        aria-expanded={open}
        className={`relative p-2 rounded-xl transition-colors ${buttonClassName}`}
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-4.5 h-4.5 px-1 rounded-full bg-[#E76F51] text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-[min(22rem,calc(100vw-2rem))] bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <p className="font-semibold text-gray-800 text-sm">Notifications</p>
              {unread > 0 && (
                <button
                  onClick={() => markRead(items.map((i) => i.key))}
                  className="flex items-center gap-1 text-xs font-medium text-[#E76F51] hover:underline"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <p className="px-4 py-8 text-center text-sm text-gray-400">Loading…</p>
              ) : items.length === 0 ? (
                <div className="px-4 py-10 flex flex-col items-center gap-2 text-gray-400">
                  <BellOff className="w-8 h-8" />
                  <p className="text-sm">You're all caught up</p>
                </div>
              ) : (
                items.map((n) => {
                  const Icon = n.icon;
                  const isUnread = !seen.has(n.key);
                  return (
                    <Link
                      key={n.key}
                      to={n.to}
                      onClick={() => { markRead([n.key]); setOpen(false); }}
                      className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors ${
                        isUnread ? 'bg-orange-50/40' : ''
                      }`}
                    >
                      <span className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${n.color}`}>
                        <Icon className="w-4 h-4" />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className={`block text-sm leading-snug ${isUnread ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
                          {n.title}
                        </span>
                        {n.date && <span className="block text-[11px] text-gray-400 mt-0.5">{timeAgo(n.date)}</span>}
                      </span>
                      {isUnread && <span className="shrink-0 mt-1.5 w-2 h-2 rounded-full bg-[#E76F51]" />}
                    </Link>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
