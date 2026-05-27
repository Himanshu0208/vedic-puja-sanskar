package models

import "time"

// Product represents a product in the system
type Product struct {
	ID          int       `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Price       float64   `json:"price"`
	SalePrice   float64   `json:"sale_price"`
	ImageURL    string    `json:"image_url"`
	ImagePath   string    `json:"image_path"`
	Category    string    `json:"category"`
	Stock       int       `json:"stock"`
	CreatedBy   int       `json:"created_by"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// CreateProductRequest represents a product creation request
type CreateProductRequest struct {
	Name        string  `json:"name"`
	Description string  `json:"description"`
	Price       float64 `json:"price"`
	SalePrice   float64 `json:"sale_price"`
}

// UpdateProductRequest represents a product update request
type UpdateProductRequest struct {
	Name        string  `json:"name"`
	Description string  `json:"description"`
	Price       float64 `json:"price"`
	SalePrice   float64 `json:"sale_price"`
}

// ProductListResponse represents a list of products
type ProductListResponse struct {
	Products []*Product `json:"products"`
	Total    int        `json:"total"`
}
