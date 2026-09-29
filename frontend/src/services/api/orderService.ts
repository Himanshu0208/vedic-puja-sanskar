import axiosInstance, { getErrorMessage } from "../axiosInstance";
import { AddItemToCartRequest, CartResponse, CreateOrderRequest, CreateOrderResponse, RemoveItemFromRequest, SavedAddress, UserOrderPage, VerifyPaymentRequest, VerifyPaymentResponse } from "@/types/order";

class OrderService {
  async getOrders(params: { page?: number; pageSize?: number } = {}): Promise<UserOrderPage> {
    const response = await axiosInstance.get<UserOrderPage>('/orders', { params });
    return response.data;
  }

  async getAddresses(): Promise<SavedAddress[]> {
    try { return (await axiosInstance.get<SavedAddress[]>('/addresses')).data; }
    catch (error: unknown) { throw new Error(getErrorMessage(error, 'Could not load saved addresses')); }
  }

  async saveAddress(address: Omit<SavedAddress, 'id'>, id?: number): Promise<SavedAddress> {
    try {
      const response = id
        ? await axiosInstance.put<SavedAddress>(`/addresses/${id}`, address)
        : await axiosInstance.post<SavedAddress>('/addresses', address);
      return response.data;
    } catch (error: unknown) { throw new Error(getErrorMessage(error, 'Could not save address')); }
  }

  async deleteAddress(id: number): Promise<void> {
    try { await axiosInstance.delete(`/addresses/${id}`); }
    catch (error: unknown) { throw new Error(getErrorMessage(error, 'Could not delete address')); }
  }

  async retryPayment(orderId: number): Promise<CreateOrderResponse> {
    const response = await axiosInstance.post<CreateOrderResponse>(`/orders/${orderId}/retry-payment`);
    return response.data;
  }

  async cancelOrder(orderId: number): Promise<void> {
    await axiosInstance.post(`/orders/${orderId}/cancel`);
  }

  async requestReturn(orderId: number): Promise<void> {
    await axiosInstance.post(`/orders/${orderId}/return`);
  }

  async createOrder(request: CreateOrderRequest): Promise<CreateOrderResponse> {
    try {
      const response = await axiosInstance.post<CreateOrderResponse>('/orders', request);
      return response.data;
    } catch (error: unknown) {
      throw new Error(getErrorMessage(error, 'Failed to create order'));
    }
  }

  async verifyPayment(orderId: number, request: VerifyPaymentRequest): Promise<VerifyPaymentResponse> {
    try {
      const response = await axiosInstance.post<VerifyPaymentResponse>(`/orders/${orderId}/payment/verify`, request);
      return response.data;
    } catch (error: unknown) {
      throw new Error(getErrorMessage(error, 'Failed to verify payment'));
    }
  }

  async fetchCart(): Promise<CartResponse> {
    try {
      const response = await axiosInstance.get<CartResponse>('/cart', {});
      return response.data;
    } catch (error: unknown) {
      const message = getErrorMessage(error, 'Failed to fetch cart');
      throw new Error(message);
    }
  }

  async addItem(item: AddItemToCartRequest): Promise<CartResponse> {
    try {
      const reponse = await axiosInstance.put<CartResponse>('/cart/item/add', { 
        productId: item.productId, 
        quantity: item.quantity 
      });
      return reponse.data;
    } catch (error: unknown) {
      const message = getErrorMessage(error, 'Failed to add item to cart');
      throw new Error(message);
    }
  }

  async removeItem(item: RemoveItemFromRequest): Promise<CartResponse> {
    try {
      const response = await axiosInstance.put<CartResponse>('/cart/item/remove', {
        productId: item.productId,
        quantity: item.quantity
      });
      return response.data;
    } catch (error: unknown) {
      const message = getErrorMessage(error, 'Failed to remove item from cart');
      throw new Error(message);
    }
  }

  async clearCart(): Promise<CartResponse> {
    try {
      const reponse = await axiosInstance.put<CartResponse>('/clear', {});
      return reponse.data;
    } catch (error: unknown) {
      const message = getErrorMessage(error, 'Failed to clear cart');
      throw new Error(message);
    }
  }
}

export const orderService = new OrderService();
