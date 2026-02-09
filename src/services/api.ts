import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiError } from '../types';
import type { AppDispatch, RootState } from '../app/store';
import type { store } from '../app/store';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
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
    };
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
        window.location.href = '/login';
      }
    }
    
    // Handle other errors
    let message = error.response?.data?.message || 'An unexpected error occurred';
    
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
    
    // Handle Django SimpleJWT specific errors
    if (error.response?.status === 401) {
      message = error.response?.data?.detail || 'Invalid credentials';
    } else if (error.response?.status === 400) {
      message = error.response?.data?.detail || error.response?.data?.message || 'Invalid request';
    }
    
    console.error('API Error:', message);
    
    return Promise.reject(error);
  }
);

export default api;
