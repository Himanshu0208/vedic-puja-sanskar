import { DO_NOT_USE_OR_YOU_WILL_BE_FIRED_EXPERIMENTAL_FORM_ACTIONS } from "react";
import axiosInstance, {getErrorMessage}  from "../axiosInstance";
import { AddItemToCartRequest, CartResponse, RemoveItemFromRequest } from "@/types/order";

class OrderService {
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