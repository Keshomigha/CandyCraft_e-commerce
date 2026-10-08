import { useState, useEffect } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, LogOut, Menu, X } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import LogoMark from '../components/common/LogoMark';
import PanelHeaderActions from '../components/common/PanelHeaderActions';

const SITE_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/products', label: 'Shop' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

const COLLAPSE_KEY = 'dashboard-sidebar-collapsed';

function readCollapsed() {
  try { return localStorage.getItem(COLLAPSE_KEY) === '1'; } catch { return false; }
}

// Shared chrome for the buyer / seller / admin panels: a full-width top bar
// (logo, site links, greeting + actions) above a collapsible sidebar.
//   nav: [{ to, label, icon, end? }]
export default function DashboardShell({ role, nav, maxWidth = 'max-w-6xl' }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(readCollapsed);

  const firstName = user?.name?.split(' ')[0] || '';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      try { localStorage.setItem(COLLAPSE_KEY, c ? '0' : '1'); } catch { /* ignore */ }
      return !c;
    });
  };

  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 1024) setMobileOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // On mobile the drawer always shows full labels.
  const renderSidebar = (isCollapsed, onNavigate) => (
    <>
      <div className={`flex items-center h-14 border-b border-gray-100 ${isCollapsed ? 'justify-center px-2' : 'justify-between px-5'}`}>
        {!isCollapsed && (
          <p className="text-[11px] font-bold tracking-wider text-gray-400 uppercase">Navigation</p>
        )}
        <button
          onClick={onNavigate ? () => setMobileOpen(false) : toggleCollapsed}
          aria-label={onNavigate ? 'Close menu' : isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          {onNavigate
            ? <X className="w-4 h-4" />
            : <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />}
        </button>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {nav.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            title={isCollapsed ? label : undefined}
            onClick={onNavigate}
            className={({ isActive }) =>
              `relative isolate flex items-center gap-3 rounded-xl text-sm font-medium transition-colors duration-150
              ${isCollapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'}
              ${isActive ? 'text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId={`${role}-nav-pill${onNavigate ? '-mobile' : ''}`}
                    className="absolute inset-0 z-0 bg-gradient-to-r from-[#F4A261] to-[#E76F51] rounded-xl shadow-md shadow-orange-200/50"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
                <Icon className={`relative z-10 w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                {!isCollapsed && <span className="relative z-10 truncate">{label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          title={isCollapsed ? 'Logout' : undefined}
          className={`flex items-center gap-3 w-full rounded-xl py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors
            ${isCollapsed ? 'justify-center px-0' : 'px-3'}`}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && 'Logout'}
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#F5F0EB] flex flex-col">

      {/* ── Top navbar ── */}
      <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-200/80 shadow-sm">
        <div className="h-full px-4 lg:px-8 flex lg:grid lg:grid-cols-3 items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className="lg:hidden p-2 -ml-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link to="/" className="flex items-center gap-2 w-fit">
              <LogoMark className="w-8 h-8" />
              <span className="font-extrabold text-lg tracking-tight">
                <span className="text-[#F4A261]">Candy</span>
                <span className="text-gray-800">Craft</span>
              </span>
            </Link>
          </div>

          <nav className="hidden lg:flex items-center justify-center gap-8">
            {SITE_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className="font-medium text-gray-600 hover:text-[#E76F51] transition-colors whitespace-nowrap"
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center justify-end gap-3">
            {firstName && (
              <span className="hidden md:block text-sm font-medium text-gray-600 whitespace-nowrap">
                Hi, {firstName}
              </span>
            )}
            <PanelHeaderActions role={role} />
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* ── Desktop sidebar ── */}
        <aside
          className={`hidden lg:flex flex-col sticky top-16 h-[calc(100vh-4rem)] bg-white border-r border-gray-200/80
            transition-[width] duration-300 ease-in-out flex-shrink-0 ${collapsed ? 'w-20' : 'w-64'}`}
        >
          {renderSidebar(collapsed)}
        </aside>

        {/* ── Mobile drawer ── */}
        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 z-40 lg:hidden"
                onClick={() => setMobileOpen(false)}
              />
              <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', stiffness: 380, damping: 38 }}
                className="fixed top-0 left-0 h-full w-72 max-w-[85vw] bg-white shadow-xl z-50 flex flex-col lg:hidden"
              >
                {renderSidebar(false, () => setMobileOpen(false))}
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* ── Page content ── */}
        <main className={`flex-1 min-w-0 p-6 lg:p-8 w-full ${maxWidth} mx-auto`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
