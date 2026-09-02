import api from './axiosInstance';

export const register = (data) => api.post('/api/auth/register', data);
export const login    = (data) => api.post('/api/auth/login', data);

// TODO(backend): swap this mock for the real Google OAuth flow once the
// server side exists. Expected real usage: obtain a Google ID token via
// Google Identity Services on the client, then
//   api.post('/api/auth/google', { idToken, role, shopName })
// with the backend responding { token, user, isNewUser } — same shape as
// login()/register() so the callers below don't need to change.
export const googleAuth = ({ role, shopName } = {}) =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        data: {
          token: 'mock-google-token',
          user: {
            id: `google-${Date.now()}`,
            name: 'Google User',
            email: 'google.user@example.com',
            role,
            ...(role === 'seller' && shopName ? { shopName } : {}),
          },
        },
      });
    }, 900);
  });
