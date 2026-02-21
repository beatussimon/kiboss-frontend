import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiError } from '../types';
import type { AppDispatch, RootState } from '../app/store';
import type { store } from '../app/store';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Helper to get auth state - lazy import to avoid circular dependency
let storeRef: typeof store | null = null;

export const setStore = (s: typeof store) => {
  storeRef = s;
};

const getAuthState = (): RootState['auth'] => {
  if (!storeRef) {
    // Fallback for when store is not yet set
    return {
      user: null,
      accessToken: localStorage.getItem('accessToken'),
      refreshToken: localStorage.getItem('refreshToken'),
      isAuthenticated: !!localStorage.getItem('accessToken'),
      isLoading: false,
      error: null,
    } as RootState['auth'];
  }
  return storeRef.getState().auth;
};

// Request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const auth = getAuthState();
    const accessToken = auth.accessToken;
    
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    // Handle 401 - Token expired or invalid
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const auth = getAuthState();
      const refreshToken = auth.refreshToken;
      
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
            refresh: refreshToken,
          });
          
          const { access } = response.data;
          storeRef?.dispatch({ type: 'auth/refreshToken/fulfilled', payload: { accessToken: access } });
          
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed - logout user
          storeRef?.dispatch({ type: 'auth/logout' });
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token - logout user
        storeRef?.dispatch({ type: 'auth/logout' });
        
        // Only redirect if not already on an auth page
        const currentPath = window.location.pathname;
        if (currentPath !== '/login' && currentPath !== '/register') {
          window.location.href = '/login';
        }
      }
    }
    
    // Handle other errors
    let message = 'An unexpected error occurred';
    const data = error.response?.data as any;
    
    if (data) {
      if (typeof data.error === 'string') {
        message = data.error;
      } else if (data.error?.message) {
        message = data.error.message;
      } else if (data.detail) {
        message = data.detail;
      } else if (data.message) {
        message = data.message;
      } else if (typeof data === 'object' && !Array.isArray(data)) {
        // Handle field-level errors
        const firstErrorKey = Object.keys(data)[0];
        const firstErrorValue = data[firstErrorKey];
        if (Array.isArray(firstErrorValue)) {
          message = `${firstErrorKey}: ${firstErrorValue[0]}`;
        } else if (typeof firstErrorValue === 'string') {
          message = firstErrorValue;
        }
      }
    }
    
    // Log detailed error information for debugging
    if (error.response) {
      console.error('API Error Response:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
      });
    } else if (error.request) {
      console.error('API Error Request:', error.request);
    } else {
      console.error('API Error:', error.message);
    }
    
    // Additional special case for 401
    if (error.response?.status === 401 && !message) {
      message = 'Invalid credentials';
    }
    
    console.error('API Error Final Message:', message);
    
    return Promise.reject(error);
  }
);

export default api;
