import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl">🍬</span>
            <span className="font-bold text-xl">
              <span className="text-pink-500">candy</span>
              <span className="text-gray-800">craft</span>
            </span>
          </Link>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-gray-700 hover:text-pink-500 font-medium text-md">Home</Link>
            <Link to="/products" className="text-gray-700 hover:text-pink-500 font-medium text-md">Shop</Link>
            <Link to="/about" className="text-gray-700 hover:text-pink-500 font-medium text-md">About</Link>
            <Link to="/contact" className="text-gray-700 hover:text-pink-500 font-medium text-md">Contact</Link>
          </div>

          {/* Right */}
          <div className="flex items-center gap-4">
            <button className="text-gray-500 hover:text-pink-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
            </button>
            <button className="text-gray-500 hover:text-pink-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 0 1 6.364 0L12 7.636l1.318-1.318a4.5 4.5 0 0 1 6.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 0 1 0-6.364z" />
              </svg>
            </button>
            <button className="text-gray-500 hover:text-pink-500 relative">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 0 0-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">0</span>
            </button>

            {user ? (
              <div className="flex items-center gap-3">
                {user.role === 'buyer' && (
                  <Link
                    to="/buyer/dashboard"
                    className="text-sm font-medium text-gray-700 hidden sm:block hover:text-[#F4A261] transition-colors"
                  >
                    Hi, {user.name.split(' ')[0]} 👋
                  </Link>
                )}
                {user.role !== 'buyer' && (
                  <span className="text-sm font-medium text-gray-700 hidden sm:block">
                    Hi, {user.name.split(' ')[0]}
                  </span>
                )}
                <button
                  onClick={handleLogout}
                  className="border border-pink-500 text-pink-500 hover:bg-pink-50 text-sm font-medium px-4 py-2 rounded-full transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-pink-500 hover:bg-pink-600 text-white text-sm font-medium px-4 py-2 rounded-full transition-colors"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
