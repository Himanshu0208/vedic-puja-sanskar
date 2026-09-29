import axios from 'axios';
import axiosInstance from '@/services/axiosInstance';
import { AuthResponse } from '@/store/slices/authSlice';

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.error || error.message || fallback;
  }

  return error instanceof Error ? error.message : fallback;
};

class AuthService {
  async signup(details: { fullName: string; phone: string; gender: string; email: string; password: string }): Promise<AuthResponse> {
    try {
      const response = await axiosInstance.post<AuthResponse>('/auth/signup', details);
      return response.data;
    } catch (error: unknown) {
      const message = getApiErrorMessage(error, 'Signup failed');
      throw new Error(message);
    }
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await axiosInstance.post<AuthResponse>('/auth/login', {
        email,
        password,
      });
      return response.data;
    } catch (error: unknown) {
      const message = getApiErrorMessage(error, 'Login failed');
      throw new Error(message);
    }
  }

  async getProfile() {
    try {
      const response = await axiosInstance.get('/auth/profile');
      return response.data;
    } catch (error: unknown) {
      const message = getApiErrorMessage(error, 'Failed to fetch profile');
      throw new Error(message);
    }
  }

  async updateProfile(details: { fullName: string; phone: string; gender?: string }) {
    const response = await axiosInstance.put('/auth/profile', details);
    return response.data;
  }

  async getWishlist(): Promise<number[]> {
    const response = await axiosInstance.get<number[]>('/auth/wishlist');
    return response.data;
  }

  async addWishlist(productId: number) { await axiosInstance.post('/auth/wishlist', { productId }); }
  async removeWishlist(productId: number) { await axiosInstance.delete('/auth/wishlist', { params: { productId } }); }

  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
    }
  }
}

export const authService = new AuthService();
