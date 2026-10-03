import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useAuth from '../../hooks/useAuth';
import LogoMark from './LogoMark';
import SearchBar from './SearchBar';

const NAV_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/products', label: 'Shop' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

const DASHBOARD_PATH = { buyer: '/buyer/dashboard', seller: '/seller/dashboard', admin: '/admin/dashboard' };

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const initials = user?.name?.slice(0, 2).toUpperCase() || '??';

  return (
    <motion.nav
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="bg-white shadow-sm sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mobile/tablet: simple 2-slot flex (logo ↔ actions). Desktop (lg+): true
            3-column grid so the nav links sit dead-center of the whole bar,
            not just the space between the logo and the actions. */}
        <div className="flex lg:grid lg:grid-cols-3 items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <LogoMark className="w-9 h-9" />
            <span className="font-bold text-xl">
              <span className="text-pink-500">candy</span>
              <span className="text-gray-800">craft</span>
            </span>
          </Link>

          {/* Nav links — true center column on desktop, hidden below lg */}
          <div className="hidden lg:flex items-center justify-center gap-8">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `relative font-medium text-md py-1 whitespace-nowrap transition-colors ${
                    isActive ? 'text-pink-500' : 'text-gray-700 hover:text-pink-500'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {link.label}
                    {isActive && (
                      <motion.span
                        layoutId="nav-underline"
                        className="absolute left-0 right-0 -bottom-1 h-0.5 bg-pink-500 rounded-full"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>

          {/* Right: search + auth + hamburger */}
          <div className="flex items-center justify-end gap-4 flex-shrink-0">
            <SearchBar variant="icon" />

            {user ? (
              <div className="hidden sm:flex items-center gap-3">
                <Link
                  to={DASHBOARD_PATH[user.role] || '/'}
                  title={user.name}
                  aria-label="My profile"
                  className="flex-shrink-0"
                >
                  {user.profile_image ? (
                    <motion.img
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.95 }}
                      src={`${import.meta.env.VITE_API_URL}${user.profile_image}`}
                      alt={user.name}
                      className="w-9 h-9 rounded-full object-cover ring-2 ring-transparent hover:ring-pink-200 transition-all"
                    />
                  ) : (
                    <motion.span
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-9 h-9 rounded-full bg-orange-100 text-[#F4A261] flex items-center justify-center text-xs font-extrabold ring-2 ring-transparent hover:ring-pink-200 transition-all"
                    >
                      {initials}
                    </motion.span>
                  )}
                </Link>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
                  className="border border-pink-500 text-pink-500 hover:bg-pink-50 text-sm font-medium px-4 py-2 rounded-full transition-colors whitespace-nowrap"
                >
                  Logout
                </motion.button>
              </div>
            ) : (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="hidden sm:block">
                <Link
                  to="/login"
                  className="bg-pink-500 hover:bg-pink-600 text-white text-sm font-medium px-4 py-2 rounded-full transition-colors inline-block whitespace-nowrap"
                >
                  Login
                </Link>
              </motion.div>
            )}

            {/* Mobile menu toggle */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setMenuOpen((o) => !o)}
              className="lg:hidden text-gray-600"
              aria-label="Toggle menu"
            >
              <motion.svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                animate={menuOpen ? 'open' : 'closed'}
              >
                <motion.path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  variants={{
                    closed: { d: 'M4 6h16M4 12h16M4 18h16' },
                    open: { d: 'M6 18L18 6M6 6l12 12' },
                  }}
                />
              </motion.svg>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="lg:hidden overflow-hidden border-t border-gray-100"
          >
            <div className="px-4 py-4 flex flex-col gap-1">
              {NAV_LINKS.map((link, i) => (
                <motion.div
                  key={link.to}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <NavLink
                    to={link.to}
                    end={link.end}
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      `block py-2.5 px-2 rounded-lg font-medium text-sm ${
                        isActive ? 'text-pink-500 bg-pink-50' : 'text-gray-700'
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                </motion.div>
              ))}
              <div className="border-t border-gray-100 mt-2 pt-3">
                {user ? (
                  <button
                    onClick={() => { setMenuOpen(false); handleLogout(); }}
                    className="w-full text-left py-2.5 px-2 text-sm font-medium text-pink-500"
                  >
                    Logout
                  </button>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setMenuOpen(false)}
                    className="block py-2.5 px-2 text-sm font-medium text-pink-500"
                  >
                    Login
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
