import { LayoutDashboard, ShoppingCart, ClipboardList, Heart, Star, User } from 'lucide-react';
import DashboardShell from './DashboardShell';

const NAV = [
  { to: '/buyer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/buyer/cart', label: 'My Cart', icon: ShoppingCart },
  { to: '/buyer/orders', label: 'My Orders', icon: ClipboardList },
  { to: '/buyer/wishlist', label: 'Wishlist', icon: Heart },
  { to: '/buyer/reviews', label: 'My Reviews', icon: Star },
  { to: '/buyer/profile', label: 'Profile', icon: User },
];

export default function BuyerDashboardLayout() {
  return <DashboardShell role="buyer" nav={NAV} maxWidth="max-w-5xl" />;
}
