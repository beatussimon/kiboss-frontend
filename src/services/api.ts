import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiError } from '../types';
import type { store } from '../app/store';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true, // Crucial for sending/receiving HttpOnly cookies
});

// Helper to get auth state - lazy import to avoid circular dependency
let storeRef: typeof store | null = null;

export const setStore = (s: typeof store) => {
  storeRef = s;
};

// Request Queueing Mechanism for Token Refresh Race Conditions
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // We no longer manually attach the Authorization header.
    // The browser automatically attaches the HttpOnly 'access_token' cookie 
    // due to `withCredentials: true`.
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

    // Prevent retry loops for the refresh endpoint itself
    if (originalRequest.url === '/auth/token/refresh/') {
      return Promise.reject(error);
    }

    // Handle 401 - Token expired or invalid
    if (error.response?.status === 401 && !originalRequest._retry) {
      
      if (isRefreshing) {
        // If already refreshing, put the request in a queue and wait
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // The refresh token is sent automatically via HttpOnly cookie
        await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {}, {
          withCredentials: true 
        });

        isRefreshing = false;
        processQueue(null, 'success');
        
        // Replay original request
        return api(originalRequest);

      } catch (refreshError) {
        isRefreshing = false;
        processQueue(refreshError, null);
        
        // Refresh failed - logout user by calling the backend to clear cookies
        try {
          await axios.post(`${API_BASE_URL}/auth/logout/`, {}, { withCredentials: true });
        } catch (e) {
           // Ignore logout error
        }
        
        storeRef?.dispatch({ type: 'auth/logout' });
        
        // Only redirect if not already on an auth page
        const currentPath = window.location.pathname;
        if (currentPath !== '/login' && currentPath !== '/register') {
          window.location.href = '/login?reason=session_expired';
        }
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors (Formatting)
    let message = 'An unexpected error occurred';
    const data = error.response?.data as any;

    if (data) {
      if (typeof data.error === 'string') {
        message = data.error;
      } else if (data.error && typeof data.error === 'object') {
        const errorDetail = data.error as any;
        message = errorDetail.message || errorDetail.code || JSON.stringify(errorDetail);
      } else if (data.detail && typeof data.detail === 'string') {
        message = data.detail;
      } else if (data.message && typeof data.message === 'string') {
        message = data.message;
      } else if (typeof data === 'object' && !Array.isArray(data)) {
        const firstKey = Object.keys(data)[0];
        const firstVal = data[firstKey];
        if (Array.isArray(firstVal)) {
          message = `${firstKey}: ${firstVal[0]}`;
        } else if (typeof firstVal === 'string') {
          message = firstVal;
        } else if (typeof firstVal === 'object') {
          message = `${firstKey}: ${JSON.stringify(firstVal)}`;
        } else {
          message = JSON.stringify(data);
        }
      }
    }

    if (error.response?.status === 401 && (!message || message === 'An unexpected error occurred')) {
      message = 'Invalid credentials';
    }

    error.message = message;
    return Promise.reject(error);
  }
);

export default api;
