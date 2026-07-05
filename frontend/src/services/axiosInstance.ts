import axios, { AxiosInstance } from 'axios';

const backendUrl = process.env.NEXT_PUBLIC_API_URL;

// Create axios instance with base configuration
const axiosInstance: AxiosInstance = axios.create({
  baseURL: backendUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor to handle auth errors
let isRefreshing = false;

// Response interceptor to handle auth errors
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry && !isRefreshing) {
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await axiosInstance.post('/auth/refresh');
        isRefreshing = false;
        return axiosInstance(originalRequest); // original request retry
      } catch (refreshError) {
        isRefreshing = false;
        if (typeof window !== 'undefined') {
          localStorage.removeItem('userData');
          window.location.href = '/';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

const getErrorMessage = (error: unknown, fallback: string) => {
    if (axios.isAxiosError<{ error?: string }>(error)) {
        return error.response?.data?.error || error.message || fallback;
    }

    if (error instanceof Error) {
        return error.message;
    }

    return fallback;
};

export { getErrorMessage };
export default axiosInstance;
