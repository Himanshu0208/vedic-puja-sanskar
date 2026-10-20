export interface AdminUser {
  id: number;
  email: string;
  role: string;
  createdAt: string;
  orderCount: number;
}

export interface AdminUserPage {
  users: AdminUser[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AdminOrder {
  orderId: number;
  customerEmail: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  totalAmount: number;
  currency: string;
  createdAt: string;
}

export interface AdminOrderPage {
  orders: AdminOrder[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AdminReport {
  customers: number;
  products: number;
  orders: number;
  paidOrders: number;
  codOrders: number;
  razorpayOrders: number;
  cancelledOrders: number;
  returnedOrders: number;
  otherOrders: number;
  pendingOrders: number;
  deliveredOrders: number;
  revenue: number;
  refundedRevenue: number;
  codRevenue: number;
  razorpayRevenue: number;
  codReceivable: number;
  codReceivableOrders: number;
  monthlyRevenue: { month: string; revenue: number }[];
  orderStatuses: { status: string; count: number }[];
}

export interface AdminReturn {
  id: number; orderId: number; amount: number; currency: string; userId: number; customerEmail: string;
  reason: string; description: string; mediaUrls: string[]; status: string;
  adminRemarks: string; createdAt: string;
  paymentMethod: string; paymentStatus: string;
  refundId: string; refundReference: string; receivedAt?: string | null; refundProcessedAt?: string | null;
}

export interface AdminReturnPage {
  returns: AdminReturn[]; total: number; page: number; pageSize: number; totalPages: number;
}
