export interface AdminUser {
  id: number;
  email: string;
  role: string;
  createdAt: string;
  orderCount: number;
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
  codRevenue: number;
  razorpayRevenue: number;
  codReceivable: number;
  codReceivableOrders: number;
  monthlyRevenue: { month: string; revenue: number }[];
  orderStatuses: { status: string; count: number }[];
}
