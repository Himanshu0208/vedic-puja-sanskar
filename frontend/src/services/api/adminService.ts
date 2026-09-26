import axiosInstance from '@/services/axiosInstance';
import type { AdminOrder, AdminReport, AdminUser } from '@/types/admin';

export const adminService = {
  async getUsers() { return (await axiosInstance.get<AdminUser[]>('/admin/users')).data; },
  async getOrders() { return (await axiosInstance.get<AdminOrder[]>('/admin/orders')).data; },
  async getReports() { return (await axiosInstance.get<AdminReport>('/admin/reports')).data; },
};
