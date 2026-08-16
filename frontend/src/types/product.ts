import { CategoryResponse } from "@/types/category";

export interface ProductInCart {
  productId: number;
  quantity: number;
  name: string;
  description: string;
  benefits: string;
  sellingPrice: number;
  offerPrice?: number;
  image_url: string;
  image_path: string;
  category: CategoryResponse;
}

export interface ProductResponse {
  id: number;
  name: string;
  description: string;
  benefits: string;
  price: number;
  sellingPrice: number;
  offerPrice?: number;
  image_url: string;
  image_path: string;
  category: CategoryResponse;
  quantity: number;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductListResponse {
  products: ProductResponse[];
  total: number;
}

export interface DeleteProductResponse {
  id: number;
  message: string;
}

export interface CreateProductInput {
  name: string;
  description: string;
  benefits: string;
  categoryId: number;
  quantity: number;
  sellingPrice: number;
  costPrice: number;
  offerPrice?: number;
  imageURL?: string;
  imagePath?: string;
  image: File | null;
}

export type UpdateProductInput = Partial<CreateProductInput>;
