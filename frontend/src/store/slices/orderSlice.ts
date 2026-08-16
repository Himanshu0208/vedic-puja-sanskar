import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AddItemToCartRequest, RemoveItemFromRequest, CartResponse } from '@/types/order';
import { orderService } from '@/services/api/orderService';
import { RootState } from '..';

export interface OrderState {
    cart: CartResponse | null;
    isLoading: boolean;
    error: string | null;
}

const initialState: OrderState = {
    cart: null,
    isLoading: false,
    error: null,
};

export const fetchCart = createAsyncThunk(
    'order/fetchCart',
    async (_, { rejectWithValue, getState }) => {
        try {
            const response = await orderService.fetchCart();
            return response;
        }
        catch (error: unknown) {
            return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch cart');
        }
    }
);

export const increaseQuantity = createAsyncThunk(
    'order/increaseQuantity',
    async (productId: number, { rejectWithValue, getState }) => {
        try {
            const increaseQuantityRequest : AddItemToCartRequest = {
                productId: productId,
                quantity: 1
            };
            
            const response = await orderService.addItem(increaseQuantityRequest); // Assuming quantity is always 1 for addition
            return response;
        }
        catch (error: unknown) {
            return rejectWithValue(error instanceof Error ? error.message : 'Failed to increase quantity ofitem to cart');
        }
    }
);

export const decreaseQuantity = createAsyncThunk(
    'order/decreaseQuantity',
    async (productId: number, { rejectWithValue, getState }) => {
        try {
            const decreaseQuantityRequest : RemoveItemFromRequest = {
                productId: productId,
                quantity: 1
            };
            const response = await orderService.removeItem(decreaseQuantityRequest);
            return response;
        }
        catch (error: unknown) {
            return rejectWithValue(error instanceof Error ? error.message : 'Failed to decrease quantity ofitem from cart');
        }
    }
);

export const removeItemFromCart = createAsyncThunk(
    '/order/removeItemFromCart',
    async (productId: number, { rejectWithValue, getState }) => {
        try {
            const removeItemRequest : RemoveItemFromRequest = {
                productId: productId,
                quantity: -1
            }
            const response = await orderService.removeItem(removeItemRequest);
            const refreshCart = await orderService.fetchCart();
            return response && refreshCart;
        }
        catch (error: unknown) {
            return rejectWithValue(error instanceof Error ? error.message : 'Failed to remove item from cart');
        }
    }
);

export const orderSlice = createSlice({
    name: 'order',
    initialState,
    reducers: {
      clearCart: (state) => {
        state.cart = null;
        state.isLoading = false;
        state.error = null;
      },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchCart.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            }
            )
            .addCase(fetchCart.fulfilled, (state, action: PayloadAction<CartResponse>) => {
                state.isLoading = false;
                state.cart = action.payload;
            })
            .addCase(fetchCart.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            .addCase(increaseQuantity.pending, (state) => {
                // state.isLoading = true;
                state.error = null;
            })
            .addCase(increaseQuantity.fulfilled, (state, action: PayloadAction<CartResponse>) => {
                // state.isLoading = false;
                state.cart = action.payload;
            })
            .addCase(increaseQuantity.rejected, (state, action) => {
                // state.isLoading = false;
                state.error = action.payload as string;
            })
            .addCase(decreaseQuantity.pending, (state) => {
                // state.isLoading = true;
                state.error = null;
            })
            .addCase(decreaseQuantity.fulfilled, (state, action: PayloadAction<CartResponse>) => {
                // state.isLoading = false;
                state.cart = action.payload;
            })
            .addCase(decreaseQuantity.rejected, (state, action) => {
                // state.isLoading = false;
                state.error = action.payload as string;
            })
            .addCase(removeItemFromCart.pending, (state) => {
                // state.isLoading = true;
                state.error = null;
            })
            .addCase(removeItemFromCart.fulfilled, (state, action: PayloadAction<CartResponse>) => {
                // state.isLoading = false;
                state.cart = action.payload;
            })
            .addCase(removeItemFromCart.rejected, (state, action) => {
                // state.isLoading = false;
                state.error = action.payload as string;
            });
    },
});

export const selectCart = (state: RootState) => state.order.cart;
export const selectIsLoading = (state: RootState) => state.order.isLoading;
export const selectError = (state: RootState) => state.order.error;
export const { clearCart } = orderSlice.actions;
export default orderSlice.reducer;  