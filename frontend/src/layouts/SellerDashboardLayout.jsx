import { LayoutDashboard, Package, PackagePlus, ClipboardList, Star, Wallet, Store } from 'lucide-react';
import DashboardShell from './DashboardShell';

const NAV = [
  { to: '/seller/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/seller/products', label: 'Products', icon: Package, end: true },
  { to: '/seller/products/new', label: 'Add Product', icon: PackagePlus },
  { to: '/seller/orders', label: 'Orders', icon: ClipboardList },
  { to: '/seller/reviews', label: 'Reviews', icon: Star },
  { to: '/seller/earnings', label: 'Earnings', icon: Wallet },
  { to: '/seller/profile', label: 'Profile', icon: Store },
];

export default function SellerDashboardLayout() {
  return <DashboardShell role="seller" nav={NAV} maxWidth="max-w-6xl" />;
}
