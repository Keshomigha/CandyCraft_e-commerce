import api from './axiosInstance';

export const getMyOrders   = ()        => api.get('/api/orders');
export const getOrderById  = (id)      => api.get(`/api/orders/${id}`);
export const cancelOrder   = (id)      => api.put(`/api/orders/${id}/cancel`);
export const checkout      = (data)    => api.post('/api/orders', data);
