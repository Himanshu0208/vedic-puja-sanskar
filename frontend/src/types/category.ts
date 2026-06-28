export interface CategoryResponse {
    id: number;
    name: string;
}

export interface CategoryListResponse {
    categories: CategoryResponse[];
    total: number;
}