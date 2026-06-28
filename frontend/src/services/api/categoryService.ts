import axiosInstance, { getErrorMessage } from '@/services/axiosInstance';
import { CategoryListResponse } from '@/types/category';

class CategoryService {
    async getCategories() {
        try {
            const response = await axiosInstance.get<CategoryListResponse>('/categories');
            return response.data;
        }
        catch (error: unknown) {
            throw new Error(getErrorMessage(error, 'Failed to fetch categories'));
        }
    }

    async getCategoryById(categoryId: string) {
        try {
            const response = await axiosInstance.get(`/categories/${categoryId}`);
            return response.data;
        }
        catch (error: unknown) {
            throw new Error(getErrorMessage(error, 'Failed to fetch category'));
        }
    }
}

export const categoryService = new CategoryService();