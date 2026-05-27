import axiosInstance from './axiosInstance';
import { AuthResponse } from '@/store/slices/authSlice';

class AuthService {
  async signup(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await axiosInstance.post<AuthResponse>('auth/signup', {
        email,
        password,
      });
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error || error.message || 'Signup failed';
      throw new Error(message);
    }
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await axiosInstance.post<AuthResponse>('auth/login', {
        email,
        password,
      });
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error || error.message || 'Login failed';
      throw new Error(message);
    }
  }

  async getProfile() {
    try {
      const response = await axiosInstance.get('auth/profile');
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error || error.message || 'Failed to fetch profile';
      throw new Error(message);
    }
  }

  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
    }
  }
}

export const authService = new AuthService();
