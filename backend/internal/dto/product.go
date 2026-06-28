package dto

import (
	"mime/multipart"
	"time"
)

type ProductRequest struct {
	Name         string                `json:"name" form:"name" validate:"required"`
	Description  string                `json:"description" form:"description"`
	Benefits     string                `json:"benefits" form:"benefits"`
	Price        float64               `json:"price" form:"price" validate:"required,gt=0"`
	SellingPrice float64               `json:"sellingPrice" form:"sellingPrice" validate:"required,gt=0,gtfield=Price"`
	OfferPrice   *float64              `json:"offerPrice" form:"offerPrice" validate:"omitempty,gt=0,gtfield=Price,ltfield=SellingPrice"`
	Image        *multipart.FileHeader `form:"image"`
	CategoryID   int                   `json:"categoryId" form:"categoryId" validate:"required"`
	Quantity     int                   `json:"quantity" form:"quantity" validate:"required,gt=0"`
}

type ProductResponse struct {
	ID           int       `json:"id"`
	Name         string    `json:"name"`
	Description  string    `json:"description"`
	Benefits     string    `json:"benefits"`
	Price        float64   `json:"price"`
	SellingPrice float64   `json:"sellingPrice"`
	OfferPrice   float64   `json:"offerPrice"`
	ImageURL     string    `json:"image_url"`
	ImagePath    string    `json:"image_path"`
	Category     *Category `json:"category"`
	Quantity     int       `json:"quantity"`
	CreatedBy    int       `json:"createdBy"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

type UpdateProductRequest struct {
	ID           int                   `json:"id" form:"id" validate:"required"`
	Name         *string               `json:"name" form:"name"`
	Description  *string               `json:"description" form:"description"`
	Benefits     *string               `json:"benefits" form:"benefits"`
	Price        *float64              `json:"price" form:"price"`
	SellingPrice *float64              `json:"sellingPrice" form:"sellingPrice"`
	OfferPrice   *float64              `json:"offerPrice" form:"offerPrice"`
	ImageURL     *string               `json:"image_url" form:"image_url"`
	ImagePath    *string               `json:"image_path" form:"image_path"`
	Image        *multipart.FileHeader `form:"image"`
	CategoryID   *int                  `json:"categoryId" form:"categoryId"`
	Quantity     *int                  `json:"quantity" form:"quantity"`
}

type ProductListResponse struct {
	Products []*ProductResponse `json:"products"`
	Total    int                `json:"total"`
}

type ProductImageUploadResponse struct {
	ImageURL  string `json:"image_url"`
	ImagePath string `json:"image_path"`
}
type ProductImageUploadRequest struct {
	Image *multipart.FileHeader `form:"image" validate:"required"`
}

type DeleteProductReponse struct {
	ID      int    `json:"id"`
	Message string `json:"message"`
}
