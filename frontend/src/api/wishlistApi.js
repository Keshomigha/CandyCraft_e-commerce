import api from './axiosInstance';

export const getWishlist        = ()          => api.get('/api/wishlist');
export const addToWishlist      = (productId) => api.post('/api/wishlist', { productId });
export const removeFromWishlist = (productId) => api.delete(`/api/wishlist/${productId}`);
export const checkWishlist      = (productId) => api.get(`/api/wishlist/check/${productId}`);
