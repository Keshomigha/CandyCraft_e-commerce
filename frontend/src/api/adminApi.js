import api from './axiosInstance';

// Platform stats
export const getPlatformStats = () => api.get('/api/admin/stats');
export const getDashboardOverview = () => api.get('/api/admin/dashboard-overview');

// Users
export const getAllUsers      = () => api.get('/api/admin/users');
export const updateUserStatus = (id, status) => api.patch(`/api/admin/users/${id}/status`, { status });
export const deleteUser       = (id) => api.delete(`/api/admin/users/${id}`);

// Sellers
export const getAllSellersAdmin = () => api.get('/api/admin/sellers');
export const updateSellerStatusAdmin = (id, status) => api.patch(`/api/admin/sellers/${id}/status`, { status });

// Products
export const getAllProductsAdmin = () => api.get('/api/admin/products');
export const updateProductStatusAdmin = (id, status) => api.patch(`/api/admin/products/${id}/status`, { status });
export const deleteProductAdmin = (id) => api.delete(`/api/admin/products/${id}`);

// Reviews
export const getAllReviewsAdmin = () => api.get('/api/admin/reviews');
export const updateReviewStatusAdmin = (id, status) => api.patch(`/api/admin/reviews/${id}/status`, { status });
export const deleteReviewAdmin = (id) => api.delete(`/api/admin/reviews/${id}`);

// Orders
export const getAllOrdersAdmin = () => api.get('/api/admin/orders');
export const updateOrderStatusAdmin = (id, status) => api.patch(`/api/admin/orders/${id}/status`, { status });

// Reports (review queue)
export const getReportQueue = () => api.get('/api/admin/reports');
export const resolveReport = (id, action, message) =>
  api.patch(`/api/admin/reports/${id}/resolve`, { action, message });
