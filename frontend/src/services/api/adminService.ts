import axiosInstance from '@/services/axiosInstance';
import type { AdminOrderPage, AdminReport, AdminReturnPage, AdminUserPage } from '@/types/admin';

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
  async getReturns(params: { page?: number; pageSize?: number; status?: string } = {}) {
    return (await axiosInstance.get<AdminReturnPage>('/admin/returns', { params })).data;
  },
  async reviewReturn(id: number, approved: boolean, remarks: string) {
    return (await axiosInstance.patch(`/admin/returns/${id}/review`, { approved, remarks })).data;
  },
  async processReturnRefund(id: number) {
    return (await axiosInstance.post(`/admin/returns/refund/${id}`)).data;
  },
  async recordCODRefund(id: number, reference: string) {
    return (await axiosInstance.post(`/admin/returns/manual-refund/${id}`, { reference })).data;
  },
};
