import { LayoutDashboard, Users, Store, Package, ClipboardList, Star, Flag, ChartColumn } from 'lucide-react';
import DashboardShell from './DashboardShell';

const NAV = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/users', label: 'Manage Users', icon: Users },
  { to: '/admin/sellers', label: 'Manage Sellers', icon: Store },
  { to: '/admin/products', label: 'Manage Products', icon: Package },
  { to: '/admin/orders', label: 'Monitor Orders', icon: ClipboardList },
  { to: '/admin/reviews', label: 'Moderate Reviews', icon: Star },
  { to: '/admin/report-queue', label: 'Report Queue', icon: Flag },
  { to: '/admin/reports', label: 'Platform Reports', icon: ChartColumn },
];

export default function AdminDashboardLayout() {
  return <DashboardShell role="admin" nav={NAV} maxWidth="max-w-7xl" />;
}
