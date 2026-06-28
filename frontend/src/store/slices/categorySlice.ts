import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { CategoryListResponse, CategoryResponse } from '@/types/category';
import { categoryService } from '@/services/api/categoryService';

export interface CategoryState {
    category: CategoryListResponse | null;
    isCategoryLoading: boolean;
    error: string | null;
}

const initialState: CategoryState = {
    category: null,
    isCategoryLoading: false,
    error: null,
};

export const getAllCategories = createAsyncThunk(
    'categories/getAllCategories',
    async (_, { rejectWithValue }) => {
        try {
            const response = await categoryService.getCategories();
            return response;
        }
        catch (error: unknown) {
            return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch categories');
        }
    }
);

const categorySlice = createSlice({
    name: 'categories',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(getAllCategories.pending, (state) => {
                state.isCategoryLoading = true;
                state.error = null;
            })
            .addCase(getAllCategories.fulfilled, (state, action: PayloadAction<CategoryListResponse>) => {
                state.isCategoryLoading = false;
                state.category = action.payload;
            })
            .addCase(getAllCategories.rejected, (state, action) => {
                state.isCategoryLoading = false;
                state.error = action.payload as string;
            });
    },
});

export default categorySlice.reducer;