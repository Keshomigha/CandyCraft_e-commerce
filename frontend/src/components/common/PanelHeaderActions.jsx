import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import { getCart } from '../../api/cartApi';
import NotificationBell from './NotificationBell';
import SearchBar from './SearchBar';

// Admins have no profile page, so their avatar falls back to the dashboard.
const PROFILE_PATH = { buyer: '/buyer/profile', seller: '/seller/profile' };

function Avatar({ user }) {
  const initials = user?.name?.slice(0, 2).toUpperCase() || '??';
  return user?.profile_image ? (
    <img
      src={`${import.meta.env.VITE_API_URL}${user.profile_image}`}
      alt={user.name}
      className="w-9 h-9 rounded-full object-cover ring-2 ring-white shadow-sm"
    />
  ) : (
    <span className="w-9 h-9 rounded-full bg-orange-100 text-[#F4A261] flex items-center justify-center text-xs font-extrabold ring-2 ring-white shadow-sm">
      {initials}
    </span>
  );
}

// Right-hand action cluster for the dashboard top bars: search + cart (buyer
// only), notifications, and the profile avatar.
export default function PanelHeaderActions({ role, buttonClassName = 'text-gray-600 hover:text-[#E76F51] hover:bg-orange-50' }) {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [cartCount, setCartCount] = useState(0);
  const isBuyer = role === 'buyer';

  // Refetch on navigation so the badge reflects adds/removes made elsewhere.
  useEffect(() => {
    if (!isBuyer) return;
    getCart()
      .then((r) => {
        const items = Array.isArray(r.data) ? r.data : [];
        setCartCount(items.reduce((sum, i) => sum + (Number(i.quantity) || 1), 0));
      })
      .catch(() => {});
  }, [isBuyer, pathname]);

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      {isBuyer && <SearchBar variant="icon" />}

      {isBuyer && (
        <Link
          to="/buyer/cart"
          aria-label={cartCount ? `Cart (${cartCount} items)` : 'Cart'}
          className={`relative p-2 rounded-xl transition-colors ${buttonClassName}`}
        >
          <ShoppingCart className="w-5 h-5" />
          {cartCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-4.5 h-4.5 px-1 rounded-full bg-[#F4A261] text-white text-[10px] font-bold flex items-center justify-center">
              {cartCount > 9 ? '9+' : cartCount}
            </span>
          )}
        </Link>
      )}

      <NotificationBell role={role} buttonClassName={buttonClassName} />

      <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.95 }} className="ml-1">
        <Link to={PROFILE_PATH[role] || `/${role}/dashboard`} title={user?.name} aria-label="My profile" className="block">
          <Avatar user={user} />
        </Link>
      </motion.div>
    </div>
  );
}
