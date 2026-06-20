import api from './axiosInstance';

export const getProducts = (params = {}) => api.get('/api/products', { params });
export const getProductById = (id) => api.get(`/api/products/${id}`);
export const getCategories = () => api.get('/api/categories');
