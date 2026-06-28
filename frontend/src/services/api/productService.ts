import axiosInstance, { getErrorMessage } from '@/services/axiosInstance';
import { CreateProductInput, ProductResponse, UpdateProductInput, DeleteProductResponse, ProductListResponse } from '@/types/product';
import { AxiosError } from 'axios';

const buildProductFormData = (productData: CreateProductInput | UpdateProductInput) => {
    const formData = new FormData();

    if (productData.name !== undefined) {
        formData.append('name', productData.name);
    }
    if (productData.description !== undefined) {
        formData.append('description', productData.description);
    }
    if (productData.benefits !== undefined) {
        formData.append('benefits', productData.benefits);
    }
    if (productData.categoryId !== undefined) {
        formData.append('categoryId', String(productData.categoryId));
    }
    if (productData.quantity !== undefined) {
        formData.append('quantity', String(productData.quantity));
    }
    if (productData.sellingPrice !== undefined) {
        formData.append('sellingPrice', String(productData.sellingPrice));
    }
    if (productData.costPrice !== undefined) {
        formData.append('price', String(productData.costPrice));
    }
    if (productData.offerPrice !== undefined) {
        formData.append('offerPrice', String(productData.offerPrice));
    }
    if (productData.imagePath !== undefined) {
        formData.append('image_path', productData.imagePath);
    }
    if (productData.imageURL !== undefined) {
        formData.append('image_url', productData.imageURL);
    }
    if (productData.image) {
        formData.append('image', productData.image);
    }

    return formData;
};

class ProductService {
    async createProduct(productData: CreateProductInput, token ?: string) {
        try {
            const response = await axiosInstance.post<ProductResponse>('/products/create', buildProductFormData(productData), {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
            });
            return response.data;
        }
        catch (error: unknown) {
            throw new Error(getErrorMessage(error, 'Product creation failed'));
        }   
    }

    async updateProduct(productId: number, productData: UpdateProductInput, token ?: string) {
        try {
            const formData = buildProductFormData(productData);
            formData.append('id', productId.toString());

            const response = await axiosInstance.put<ProductResponse>(`/products/update?id=${productId}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
            });
            return response.data;
        }
        catch (error: unknown) {
            throw new Error(getErrorMessage(error, 'Product update failed'));
        }
    }

    async deleteProduct(productId: number, token ?: string) {
        try {
            const response = await axiosInstance.delete<DeleteProductResponse>(`/products/delete?id=${productId}`, {
                headers: (token ? { Authorization: `Bearer ${token}` } : {}),
            });
            return response.data;
        }
        catch (error: unknown) {
            throw new Error(getErrorMessage(error, 'Product deletion failed'));
        }
    }
    
    async getAllProducts() {
        try {
            const response = await axiosInstance.get<ProductListResponse>('/products');
            return response.data;
        }
        catch (error: unknown) {
            throw new Error(getErrorMessage(error, 'Failed to fetch products'));
        }
    }

    async getProductById(productId: string) {
        try {
            const response = await axiosInstance.get<ProductResponse>(`/products/${productId}`);
            return response.data;
        }
        catch (error: unknown) {
            throw new Error(getErrorMessage(error, 'Failed to fetch product'));
        }
    }   
}

export const productService = new ProductService();
