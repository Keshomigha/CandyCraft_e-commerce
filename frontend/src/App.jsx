import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import useAuth from './hooks/useAuth';

// Public layout
import MainLayout from './layouts/MainLayout';

// Buyer panel layout
import BuyerDashboardLayout from './layouts/BuyerDashboardLayout';

// Seller panel layout
import SellerDashboardLayout from './layouts/SellerDashboardLayout';

// Admin panel layout
import AdminDashboardLayout from './layouts/AdminDashboardLayout';

// Public pages
import Home from './pages/buyer/Home';
import ProductListing from './pages/buyer/ProductListing';
import ProductDetails from './pages/buyer/ProductDetails';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import NotFound from './pages/NotFound';

// Buyer panel pages
import BuyerDashboard from './pages/buyer/BuyerDashboard';
import MyOrders from './pages/buyer/MyOrders';
import OrderDetails from './pages/buyer/OrderDetails';
import Wishlist from './pages/buyer/Wishlist';
import MyReviews from './pages/buyer/MyReviews';
import Profile from './pages/buyer/Profile';

// Seller panel pages
import SellerDashboard from './pages/seller/SellerDashboard';
import ManageProducts from './pages/seller/ManageProducts';
import AddEditProduct from './pages/seller/AddEditProduct';
import SellerOrders from './pages/seller/SellerOrders';
import SellerReviews from './pages/seller/SellerReviews';
import SalesEarnings from './pages/seller/SalesEarnings';
import SellerProfile from './pages/seller/SellerProfile';

// Admin panel pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageUsers from './pages/admin/ManageUsers';
import ManageSellers from './pages/admin/ManageSellers';
import AdminManageProducts from './pages/admin/ManageProducts';
import MonitorOrders from './pages/admin/MonitorOrders';
import ModerateReviews from './pages/admin/ModerateReviews';
import PlatformReports from './pages/admin/PlatformReports';
import ReportQueue from './pages/admin/ReportQueue';

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
            <Route path="products/:id" element={<ProductDetails />} />
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
            <Route path="orders/:id" element={<OrderDetails />} />
            <Route path="wishlist"  element={<Wishlist />} />
            <Route path="reviews"   element={<MyReviews />} />
            <Route path="profile"   element={<Profile />} />
          </Route>

          {/* Seller panel routes */}
          <Route
            path="/seller"
            element={
              <RequireAuth role="seller">
                <SellerDashboardLayout />
              </RequireAuth>
            }
          >
            <Route index element={<Navigate to="/seller/dashboard" replace />} />
            <Route path="dashboard"          element={<SellerDashboard />} />
            <Route path="products"           element={<ManageProducts />} />
            <Route path="products/new"       element={<AddEditProduct />} />
            <Route path="products/:id/edit"  element={<AddEditProduct />} />
            <Route path="orders"             element={<SellerOrders />} />
            <Route path="reviews"            element={<SellerReviews />} />
            <Route path="earnings"           element={<SalesEarnings />} />
            <Route path="profile"            element={<SellerProfile />} />
          </Route>

          {/* Admin panel routes */}
          <Route
            path="/admin"
            element={
              <RequireAuth role="admin">
                <AdminDashboardLayout />
              </RequireAuth>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users"     element={<ManageUsers />} />
            <Route path="sellers"   element={<ManageSellers />} />
            <Route path="products"  element={<AdminManageProducts />} />
            <Route path="orders"    element={<MonitorOrders />} />
            <Route path="reviews"       element={<ModerateReviews />} />
            <Route path="report-queue"  element={<ReportQueue />} />
            <Route path="reports"       element={<PlatformReports />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
