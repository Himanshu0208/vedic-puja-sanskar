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

// Request interceptor to include auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle auth errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
      }
    }
    return Promise.reject(error);
  }
);

// Helper function to get auth token from localStorage
function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('authToken');
  }
  return null;
}

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
