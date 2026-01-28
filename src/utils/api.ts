import axios from 'axios';
import { getAuthToken } from './auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

export const fetchData = async <T>(endpoint: string, params?: Record<string, unknown>): Promise<T> => {
  const response = await api.get(endpoint, { params });
  return response.data;
};

export const postData = async <T>(endpoint: string, data: Record<string, unknown>): Promise<T> => {
  const response = await api.post(endpoint, data);
  return response.data;
};

export const updateData = async <T>(endpoint: string, data: Record<string, unknown>): Promise<T> => {
  const response = await api.put(endpoint, data);
  return response.data;
};

export const deleteData = async <T>(endpoint: string): Promise<T> => {
  const response = await api.delete(endpoint);
  return response.data;
};
