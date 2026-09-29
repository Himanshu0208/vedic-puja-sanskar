import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { CreateProductInput, ProductResponse, UpdateProductInput, DeleteProductResponse, ProductListResponse } from '@/types/product';
import { productService } from '@/services/api/productService';

export interface ProductState {
    products: ProductResponse[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    isLoading: boolean;
    error: string | null;
}

const initialState: ProductState = {
    products: [],
    total: 0,
    page: 1,
    pageSize: 12,
    totalPages: 0,
    isLoading: false,
    error: null,
};

export const createProduct = createAsyncThunk(
    'products/createProduct',
    async (productData: CreateProductInput, { rejectWithValue }) => {
        try {
            const response = await productService.createProduct(productData);
            return response;
        }
        catch (error: unknown) {
            return rejectWithValue(error instanceof Error ? error.message : 'Product creation failed');
        }
    }
);

export const updateProduct = createAsyncThunk(
    'products/updateProduct',
    async ({ productId, productData }: { productId: number; productData: UpdateProductInput }, { rejectWithValue }) => {
        try {
            const response = await productService.updateProduct(productId, productData);
            return response;
        }
        catch (error: unknown) {
            return rejectWithValue(error instanceof Error ? error.message : 'Product update failed');
        }
    }
);

export const deleteProduct = createAsyncThunk(
  'product/delete',
  async (productId: number, { rejectWithValue }) => {
    try {
      const response = await productService.deleteProduct(productId);
      return response;
    } catch (error: unknown) {
      return rejectWithValue(error instanceof Error ? error.message : 'Product deletion failed');
    }
  }
);

export const getProductById = createAsyncThunk(
    'products/getProductById',
    async (productId: string, { rejectWithValue }) => {
        try {
            const response = await productService.getProductById(productId);
            return response;
        }
        catch (error: unknown) {
            return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch product');
        }
    }
);

export const getAllProducts = createAsyncThunk(
    'products/getAllProducts',
    async (params: { page?: number; pageSize?: number; search?: string; category?: string } | undefined, { rejectWithValue }) => {
        try {
            return await productService.getAllProducts(params);
        }
        catch (error: unknown) {
            return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch products');
        }
    }
);

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // getAllProducts 
    builder
      .addCase(getAllProducts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getAllProducts.fulfilled, (state, action: PayloadAction<ProductListResponse | ProductResponse[]>) => {
        state.isLoading = false;
        if (Array.isArray(action.payload)) {
          state.products = action.payload;
          state.total = action.payload.length;
          state.page = 1;
          state.pageSize = action.payload.length || 12;
          state.totalPages = 1;
        } else if (action.payload && Array.isArray(action.payload.products)) {
          state.products = action.payload.products;
          state.total = action.payload.total ?? action.payload.products.length;
          state.page = action.payload.page ?? 1;
          state.pageSize = action.payload.pageSize ?? 12;
          state.totalPages = action.payload.totalPages ?? 1;
        } else {
          state.products = [];
          state.total = 0;
          state.page = 1;
          state.pageSize = 12;
          state.totalPages = 0;
        }
      })
      .addCase(getAllProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
    
    // createProduct
    builder
      .addCase(createProduct.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createProduct.fulfilled, (state, action: PayloadAction<ProductResponse>) => {
        state.isLoading = false;
        state.products.push(action.payload);
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
      
    // updateProduct 
    builder
      .addCase(updateProduct.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProduct.fulfilled, (state, action: PayloadAction<ProductResponse>) => {
        state.isLoading = false;
        const index = state.products.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.products[index] = action.payload;
        }
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // deleteProduct
    builder
      .addCase(deleteProduct.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteProduct.fulfilled, (state, action: PayloadAction<DeleteProductResponse>) => {
        state.isLoading = false;
        const deletedProductId = action.payload.id;
        if(deletedProductId !== -1) {
          state.products = state.products.filter((product) => product.id !== deletedProductId);
        }
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // getProductById
    builder
      .addCase(getProductById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getProductById.fulfilled, (state, action: PayloadAction<ProductResponse>) => {
        state.isLoading = false;
        const index = state.products.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.products[index] = action.payload;
        } else {
          state.products.push(action.payload);
        }
      })
      .addCase(getProductById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export default productSlice.reducer;
