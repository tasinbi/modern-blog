import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with improved configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Increased timeout to 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
  // Additional configuration for better reliability
  maxRedirects: 5,
  validateStatus: (status) => status < 500, // Don't reject 4xx errors automatically
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Retry function for failed requests
const retryRequest = async (originalRequest, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
      const response = await axios(originalRequest);
      return response;
    } catch (error) {
      if (i === retries - 1) throw error;
      console.log(`🔄 Retry attempt ${i + 1} failed, trying again...`);
    }
  }
};

// Response interceptor to handle common errors with retry logic
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Handle network errors with retry logic
    if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK' || !error.response) {
      if (!originalRequest._retry) {
        originalRequest._retry = true;
        try {
          console.log('🔄 Retrying request due to network error...');
          const response = await retryRequest(originalRequest);
          return response;
        } catch (retryError) {
          toast.error('Network error. Please check your connection.');
          return Promise.reject(retryError);
        }
      }
    }
    
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          localStorage.removeItem('token');
          if (window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login') {
            window.location.href = '/admin/login';
          }
          break;
        case 403:
          toast.error('Access forbidden');
          break;
        case 404:
          toast.error('Resource not found');
          break;
        case 429:
          toast.error('Too many requests. Please try again later.');
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          // Server errors - attempt retry for GET requests
          if (originalRequest.method.toLowerCase() === 'get' && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
              console.log('🔄 Retrying GET request due to server error...');
              const response = await retryRequest(originalRequest, 2);
              return response;
            } catch (retryError) {
              toast.error('Server error. Please try again later.');
              return Promise.reject(retryError);
            }
          } else {
            toast.error('Server error. Please try again later.');
          }
          break;
        default:
          if (data?.message) {
            toast.error(data.message);
          }
      }
    } else {
      // Network error without response
      toast.error('Network error. Please check your connection.');
    }
    
    return Promise.reject(error);
  }
);

// API methods for different resources
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  verify: () => api.get('/auth/verify'),
  register: (data) => api.post('/auth/register', data),
};

export const blogAPI = {
  getAll: (params) => api.get('/blogs', { params }),
  getById: (id) => api.get(`/blogs/${id}`),
  create: (formData) => api.post('/blogs', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id, formData) => api.put(`/blogs/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  delete: (id) => api.delete(`/blogs/${id}`),
};

export const categoryAPI = {
  getAll: () => api.get('/categories'),
  getById: (id) => api.get(`/categories/${id}`),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};

export const publicAPI = {
  getBlogs: (params) => api.get('/public/blogs', { params }),
  getBlogBySlug: (slug) => api.get(`/public/blogs/${slug}`),
  getCategories: () => api.get('/public/categories'),
  getFeaturedBlogs: (params) => api.get('/public/featured', { params }),
  getRecentBlogs: (params) => api.get('/public/recent', { params }),
  getStats: () => api.get('/public/stats'),
};

export const adminAuthAPI = {
  login: (credentials) => api.post('/admin-auth/login', credentials),
  register: (data) => api.post('/admin-auth/register', data),
  verify: () => api.get('/admin-auth/verify'),
  forgotPassword: (email) => api.post('/admin-auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/admin-auth/reset-password', { token, password }),
  getAdmins: () => api.get('/admin-auth/admins'),
  updateAdminStatus: (id, is_active) => api.put(`/admin-auth/admins/${id}/status`, { is_active }),
};

export const siteSettingsAPI = {
  // Get all site settings (public)
  getSettings: () => api.get('/site/settings'),
  
  // Upload logo (admin only)
  uploadLogo: (formData) => api.post('/site/upload-logo', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  
  // Upload favicon (admin only)
  uploadFavicon: (formData) => api.post('/site/upload-favicon', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  
  // Update site setting (admin only)
  updateSetting: (key, value) => api.put(`/site/setting/${key}`, { value }),
  
  // Reset logo to default (admin only)
  resetLogo: () => api.delete('/site/logo'),
  
  // Reset favicon to default (admin only)
  resetFavicon: () => api.delete('/site/favicon'),
};

export default api;