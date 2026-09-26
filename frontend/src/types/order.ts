export interface CartItem {
    productId: number,
    productImageURL: string,
    productName: string,
    productDescription: string,
    quantity: number,
    price: number,
    discountedPrice: number
}

export interface CartResponse {
	userId: number,
	items: CartItem[],
	totalPrice: number,
	discountedTotalPrice: number,
	totalSavings: number,
}

export interface AddItemToCartRequest {
	productId: number,
	quantity: number
}

export interface RemoveItemFromRequest {
	productId: number,
	quantity: number
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface CreateOrderRequest {
  paymentMethod: 'razorpay' | 'cod';
  shippingAddressId?: number;
  shippingAddress?: ShippingAddress;
}

export interface SavedAddress extends ShippingAddress { id: number }

export interface UserOrder {
  orderId: number;
  status: string;
  paymentStatus: string;
  paymentMethod: 'razorpay' | 'cod';
  totalAmount: number;
  currency: string;
  createdAt: string;
  items: { productName: string; quantity: number; unitPrice: number; amount: number }[];
}

export interface CreateOrderResponse {
  orderId: number;
  status: string;
  paymentStatus: string;
  paymentMethod: 'razorpay' | 'cod';
  amount: number;
  currency: string;
  razorpayOrderId?: string;
  razorpayKeyId?: string;
}

export interface VerifyPaymentRequest {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface VerifyPaymentResponse {
  orderId: number;
  status: string;
  paymentStatus: string;
}
