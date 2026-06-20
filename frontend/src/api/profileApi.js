import api from './axiosInstance';

export const getProfile    = ()     => api.get('/api/auth/profile');
export const updateProfile = (data) => api.put('/api/auth/profile', data);
