import api from './axiosInstance';

export const uploadCustomizationPhoto = (file) => {
  const fd = new FormData();
  fd.append('photo', file);
  return api.post('/api/uploads/customization-photo', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
