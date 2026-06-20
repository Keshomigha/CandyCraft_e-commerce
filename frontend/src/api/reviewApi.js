import api from './axiosInstance';

export const getMyReviews      = ()           => api.get('/api/reviews/me');
export const getPendingReviews = ()           => api.get('/api/reviews/pending');
export const submitReview      = (data)       => api.post('/api/reviews', data);
export const getProductReviews = (productId)  => api.get(`/api/reviews/product/${productId}`);
