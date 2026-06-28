import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/store/slices/authSlice';
import sidebarReducer from '@/store/slices/sidebarSlice';
import productReducer from '@/store/slices/productSlice';
import categoryReducer from '@/store/slices/categorySlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    sidebar: sidebarReducer,
    product: productReducer,
    category: categoryReducer,
  },
});
console.log("STORE CREATED");
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
