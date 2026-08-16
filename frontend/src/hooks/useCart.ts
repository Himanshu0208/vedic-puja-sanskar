import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { useMemo } from "react";

export function useCart() {
  const order = useSelector((state: RootState) => state.order);

  const productQuantityMap = useMemo(() => {
    return order.cart?.items.reduce((map, item) => {
      map.set(item.productId, item.quantity);
      return map;
    }, new Map<number, number>());
  }, [order.cart]);

  return { cart: order.cart, isLoading: order.isLoading, selectedProductQuantities: productQuantityMap };
}