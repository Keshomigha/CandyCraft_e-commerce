import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import useAuth from './hooks/useAuth';

// Public layout
import MainLayout from './layouts/MainLayout';

// Buyer panel layout
import BuyerDashboardLayout from './layouts/BuyerDashboardLayout';

// Public pages
import Home from './pages/buyer/Home';
import ProductListing from './pages/buyer/ProductListing';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import NotFound from './pages/NotFound';

// Buyer panel pages
import BuyerDashboard from './pages/buyer/BuyerDashboard';
import MyOrders from './pages/buyer/MyOrders';
import Wishlist from './pages/buyer/Wishlist';
import MyReviews from './pages/buyer/MyReviews';
import Profile from './pages/buyer/Profile';

// Protected route guard
function RequireAuth({ children, role }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="products" element={<ProductListing />} />
            <Route path="about" element={<About />} />
            <Route path="contact" element={<Contact />} />
          </Route>

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Buyer panel routes */}
          <Route
            path="/buyer"
            element={
              <RequireAuth role="buyer">
                <BuyerDashboardLayout />
              </RequireAuth>
            }
          >
            <Route index element={<Navigate to="/buyer/dashboard" replace />} />
            <Route path="dashboard" element={<BuyerDashboard />} />
            <Route path="orders"    element={<MyOrders />} />
            <Route path="wishlist"  element={<Wishlist />} />
            <Route path="reviews"   element={<MyReviews />} />
            <Route path="profile"   element={<Profile />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
