package models

import "time"

type Product struct {
	ID           int       `json:"id"`
	Name         string    `json:"name"`
	Description  string    `json:"description"`
	Benefits     string    `json:"benefits"`
	Price        float64   `json:"price"`
	SellingPrice float64   `json:"selling_price"`
	OfferPrice   float64   `json:"offer_price"`
	ImageURL     string    `json:"image_url"`
	ImagePath    string    `json:"image_path"`
	CategoryID   int       `json:"category_id"`
	Quantity     int       `json:"quantity"`
	CreatedBy    int       `json:"created_by"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type CreateProductRequest struct {
	Name         string  `json:"name"`
	Description  string  `json:"description"`
	Benefits     string  `json:"benefits"`
	Price        float64 `json:"price"`
	SellingPrice float64 `json:"selling_price"`
	OfferPrice   float64 `json:"offer_price"`
	ImageURL     string  `json:"image_url"`
	ImagePath    string  `json:"image_path"`
	CategoryID   int     `json:"category_id"`
	Quantity     int     `json:"quantity"`
}

type UpdateProductRequest struct {
	ID           int     `json:"id"`
	Name         string  `json:"name"`
	Description  string  `json:"description"`
	Benefits     string  `json:"benefits"`
	Price        float64 `json:"price"`
	SellingPrice float64 `json:"selling_price"`
	OfferPrice   float64 `json:"offer_price"`
	ImageURL     string  `json:"image_url"`
	ImagePath    string  `json:"image_path"`
	CategoryID   int     `json:"category_id"`
	Quantity     int     `json:"quantity"`
}

type ProductListResponse struct {
	Products []*Product `json:"products"`
	Total    int        `json:"total"`
}

type ProductWithCategory struct {
	ID           int       `json:"id"`
	Name         string    `json:"name"`
	Description  string    `json:"description"`
	Benefits     string    `json:"benefits"`
	Price        float64   `json:"price"`
	SellingPrice float64   `json:"selling_price"`
	OfferPrice   float64   `json:"offer_price"`
	ImageURL     string    `json:"image_url"`
	ImagePath    string    `json:"image_path"`
	CategoryID   int       `json:"category_id"`
	CategoryName string    `json:"category_name"`
	Quantity     int       `json:"quantity"`
	CreatedBy    int       `json:"created_by"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}
