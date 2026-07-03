import api from './axiosInstance';

// Public
export const getPublicSellers = () => api.get('/api/sellers');

// Seller panel
export const getSellerProfile = () => api.get('/api/seller/profile');
export const getSellerDashboard = () => api.get('/api/seller/dashboard');
export const getSellerOrders = () => api.get('/api/seller/orders');
export const getSellerStats = () => api.get('/api/seller/stats');
export const getSellerReviews = () => api.get('/api/seller/reviews');
export const getSellerRevenueChart = () => api.get('/api/seller/revenue-chart');
export const updateSellerOrderStatus = (orderId, status) =>
  api.put(`/api/seller/orders/${orderId}/status`, { status });

// Products (seller-scoped)
export const getMyProducts = () => api.get('/api/products/mine');
export const createProduct = (formData) =>
  api.post('/api/products', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const updateProduct = (id, formData) =>
  api.put(`/api/products/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const deleteProduct = (id) => api.delete(`/api/products/${id}`);
