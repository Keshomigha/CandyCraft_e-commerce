import api from './axiosInstance';

export const submitReport = ({ targetType, targetId, reason, details }) =>
  api.post('/api/reports', { targetType, targetId, reason, details });
