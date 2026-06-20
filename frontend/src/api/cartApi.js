import api from './axiosInstance';

export const getCart       = ()           => api.get('/api/cart');
export const addToCart     = (productId, quantity = 1) => api.post('/api/cart', { productId, quantity });
export const updateCart    = (productId, quantity)     => api.put(`/api/cart/${productId}`, { quantity });
export const removeFromCart = (productId)              => api.delete(`/api/cart/${productId}`);
export const clearCart     = ()           => api.delete('/api/cart');
