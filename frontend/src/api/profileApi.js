import api from './axiosInstance';

export const getProfile    = ()     => api.get('/api/auth/profile');
export const updateProfile = (data) => api.put('/api/auth/profile', data);

export const updateProfilePhoto = (file) => {
  const fd = new FormData();
  fd.append('photo', file);
  return api.put('/api/auth/profile/photo', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
