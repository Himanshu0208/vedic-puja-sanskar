package service

import (
	"errors"
	"fmt"
	"time"

	"github.com/Himanshu0208/vedic-puja-sanskar/backend/internal/models"
	"github.com/Himanshu0208/vedic-puja-sanskar/backend/internal/repository"
)

// ProductService handles product business logic
type ProductService struct {
	productRepo *repository.ProductRepository
}

// NewProductService creates a new product service
func NewProductService(productRepo *repository.ProductRepository) *ProductService {
	return &ProductService{
		productRepo: productRepo,
	}
}

// CreateProduct creates a new product (admin only)
func (s *ProductService) CreateProduct(req *models.CreateProductRequest, createdBy int, imagePath string) (*models.Product, error) {
	// Validate input
	if req.Name == "" {
		return nil, errors.New("product name is required")
	}
	if req.Price <= 0 {
		return nil, errors.New("product price must be greater than 0")
	}
	if req.SalePrice < 0 {
		return nil, errors.New("sale price cannot be negative")
	}
	if req.SalePrice > req.Price {
		return nil, errors.New("sale price cannot be greater than regular price")
	}

	// Create product
	product := &models.Product{
		Name:        req.Name,
		Description: req.Description,
		Price:       req.Price,
		SalePrice:   req.SalePrice,
		ImagePath:   imagePath,
		CreatedBy:   createdBy,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	// Save product
	if err := s.productRepo.SaveProduct(product); err != nil {
		return nil, fmt.Errorf("failed to save product: %w", err)
	}

	return product, nil
}

// GetAllProducts retrieves all products
func (s *ProductService) GetAllProducts() (*models.ProductListResponse, error) {
	products, err := s.productRepo.GetAllProducts()
	if err != nil {
		return nil, fmt.Errorf("failed to get products: %w", err)
	}

	return &models.ProductListResponse{
		Products: products,
		Total:    len(products),
	}, nil
}

// GetProductByID retrieves a product by ID
func (s *ProductService) GetProductByID(id int) (*models.Product, error) {
	product, err := s.productRepo.GetProductByID(id)
	if err != nil {
		return nil, fmt.Errorf("product not found: %w", err)
	}

	return product, nil
}

// UpdateProduct updates a product (admin only)
func (s *ProductService) UpdateProduct(id int, req *models.UpdateProductRequest, userID int) (*models.Product, error) {
	// Get product
	product, err := s.productRepo.GetProductByID(id)
	if err != nil {
		return nil, errors.New("product not found")
	}

	// Check if user is the creator
	if product.CreatedBy != userID {
		return nil, errors.New("unauthorized: only product creator can update it")
	}

	// Update fields
	if req.Name != "" {
		product.Name = req.Name
	}
	if req.Description != "" {
		product.Description = req.Description
	}
	if req.Price > 0 {
		product.Price = req.Price
	}
	if req.SalePrice >= 0 {
		product.SalePrice = req.SalePrice
	}
	if req.SalePrice > req.Price && req.Price > 0 {
		return nil, errors.New("sale price cannot be greater than regular price")
	}

	product.UpdatedAt = time.Now()

	// Save product
	if err := s.productRepo.SaveProduct(product); err != nil {
		return nil, fmt.Errorf("failed to update product: %w", err)
	}

	return product, nil
}

// DeleteProduct deletes a product (admin only)
func (s *ProductService) DeleteProduct(id int, userID int) error {
	// Get product
	product, err := s.productRepo.GetProductByID(id)
	if err != nil {
		return errors.New("product not found")
	}

	// Check if user is the creator
	if product.CreatedBy != userID {
		return errors.New("unauthorized: only product creator can delete it")
	}

	// Delete product
	if err := s.productRepo.DeleteProduct(id); err != nil {
		return fmt.Errorf("failed to delete product: %w", err)
	}

	return nil
}
