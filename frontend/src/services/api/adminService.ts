import axiosInstance from '@/services/axiosInstance';
import type { AdminOrderPage, AdminReport, AdminUserPage } from '@/types/admin';

export const adminService = {
  async getUsers(params: { page?: number; pageSize?: number; search?: string } = {}) {
    return (await axiosInstance.get<AdminUserPage>('/admin/users', { params })).data;
  },
  async getOrders(params: { page: number; pageSize: number; search?: string; status?: string; paymentStatus?: string }) {
    return (await axiosInstance.get<AdminOrderPage>('/admin/orders', { params })).data;
  },
  async updateOrderStatus(orderId: number, status: string) {
    return (await axiosInstance.patch<{ orderId: number; status: string }>(`/admin/orders/${orderId}/status`, { status })).data;
  },
  async getReports() {
    return (await axiosInstance.get<AdminReport>('/admin/reports')).data;
  },
};
