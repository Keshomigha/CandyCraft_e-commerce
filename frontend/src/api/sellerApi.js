import api from './axiosInstance';

export const getPublicSellers = () => api.get('/api/sellers');
export const getSellerProfile = () => api.get('/api/seller/profile');
export const getSellerOrders = () => api.get('/api/seller/orders');
export const getSellerStats = () => api.get('/api/seller/stats');
export const getSellerReviews = () => api.get('/api/seller/reviews');
