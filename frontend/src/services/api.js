import axios from 'axios';
import { auth } from './firebase';

// Use Cloud Run URL directly since Firebase proxy has permission issues
const getApiUrl = () => {
  // Check if we're in production (deployed environment)
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    // In production, use the deployed backend URL
    return 'https://your-backend-url.com/api'; // Replace with your actual backend URL
  }
  // In development, use localhost backend
  return 'http://localhost:5001/api';
};

const api = axios.create({
  baseURL: getApiUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  // Add timeout and other configurations
  timeout: 30000,
});

// Helper to set the Authorization header with the Firebase token
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// Central authorized request function
export async function authorizedRequest(config) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  let token = await user.getIdToken();
  try {
    config.headers = { ...config.headers, Authorization: `Bearer ${token}` };
    return await api(config);
  } catch (err) {
    // If token expired or unauthorized, force refresh and retry once
    if (err.response && (err.response.status === 401 || err.response.status === 403)) {
      token = await user.getIdToken(true);
      config.headers = { ...config.headers, Authorization: `Bearer ${token}` };
      return await api(config);
    }
    throw err;
  }
}

// Add request interceptor to log requests in development
if (process.env.NODE_ENV === 'development') {
  api.interceptors.request.use(request => {
    console.log('API Request:', request.method?.toUpperCase(), request.url);
    return request;
  });
}

export default api; 