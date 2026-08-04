package service

import (
	"errors"
	"fmt"
	"time"

	"github.com/Himanshu0208/vedic-puja-sanskar/backend/internal/dto"
	"github.com/Himanshu0208/vedic-puja-sanskar/backend/internal/models"
	"github.com/Himanshu0208/vedic-puja-sanskar/backend/internal/repository"
)

// ProductService handles product business logic
type ProductService struct {
	productRepo  *repository.ProductRepository
	categoryRepo *repository.CategoryRepository
}

// NewProductService creates a new product service
func NewProductService(productRepo *repository.ProductRepository, categoryRepo *repository.CategoryRepository) *ProductService {
	return &ProductService{
		productRepo:  productRepo,
		categoryRepo: categoryRepo,
	}
}

// CreateProduct creates a new product (admin only)
func (s *ProductService) CreateProduct(req *dto.ProductRequest, createdBy int, imagePath string) (*dto.ProductResponse, error) {
	product := &models.Product{
		Name:         req.Name,
		Description:  req.Description,
		Benefits:     req.Benefits,
		Price:        req.Price,
		SellingPrice: req.SellingPrice,
		OfferPrice:   *req.OfferPrice,
		ImageURL:     imagePath,
		ImagePath:    imagePath,
		CategoryID:   req.CategoryID,
		Quantity:     req.Quantity,
		CreatedBy:    createdBy,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	if err := s.productRepo.SaveProduct(product); err != nil {
		return nil, fmt.Errorf("failed to save product: %w", err)
	}

	category, err := s.categoryRepo.GetCategoryByID(product.CategoryID)
	if err != nil {
		return nil, fmt.Errorf("failed to get category: %w", err)
	}

	categoryDTO := &dto.Category{
		ID:   category.ID,
		Name: category.Name,
	}

	return &dto.ProductResponse{
		ID:           product.ID,
		Name:         product.Name,
		Description:  product.Description,
		Benefits:     product.Benefits,
		Price:        product.Price,
		SellingPrice: product.SellingPrice,
		OfferPrice:   product.OfferPrice,
		ImageURL:     product.ImageURL,
		ImagePath:    product.ImagePath,
		Category:     categoryDTO,
		Quantity:     product.Quantity,
		CreatedBy:    product.CreatedBy,
		CreatedAt:    product.CreatedAt,
		UpdatedAt:    product.UpdatedAt,
	}, nil
}

// UpdateProduct updates an existing product (admin only)
func (s *ProductService) UpdateProduct(id int, req *dto.UpdateProductRequest, userID int, imagePath string) (*dto.ProductResponse, error) {
	product, err := s.productRepo.GetProductByID(id)
	if err != nil {
		return nil, errors.New("product not found")
	}
	updatedProduct := &models.Product{
		ID:           product.ID,
		Name:         *req.Name,
		Description:  *req.Description,
		Benefits:     *req.Benefits,
		Price:        *req.Price,
		SellingPrice: *req.SellingPrice,
		OfferPrice:   *req.OfferPrice,
		ImageURL:     imagePath,
		ImagePath:    imagePath,
		CategoryID:   *req.CategoryID,
		Quantity:     *req.Quantity,
		CreatedBy:    product.CreatedBy,
		CreatedAt:    product.CreatedAt,
		UpdatedAt:    time.Now(),
	}

	if err := s.productRepo.UpdateProduct(updatedProduct); err != nil {
		return nil, fmt.Errorf("failed to update product: %w", err)
	}

	category, err := s.categoryRepo.GetCategoryByID(product.CategoryID)
	if err != nil {
		return nil, fmt.Errorf("failed to get category: %w", err)
	}

	categoryDTO := &dto.Category{
		ID:   category.ID,
		Name: category.Name,
	}
	return &dto.ProductResponse{
		ID:           updatedProduct.ID,
		Name:         updatedProduct.Name,
		Description:  updatedProduct.Description,
		Benefits:     updatedProduct.Benefits,
		Price:        updatedProduct.Price,
		SellingPrice: updatedProduct.SellingPrice,
		OfferPrice:   updatedProduct.OfferPrice,
		ImageURL:     updatedProduct.ImageURL,
		ImagePath:    updatedProduct.ImagePath,
		Category:     categoryDTO,
		Quantity:     updatedProduct.Quantity,
		CreatedBy:    updatedProduct.CreatedBy,
		CreatedAt:    updatedProduct.CreatedAt,
		UpdatedAt:    updatedProduct.UpdatedAt,
	}, nil
}

// GetAllProducts retrieves all products
func (s *ProductService) GetAllProducts() (*dto.ProductListResponse, error) {
	products, err := s.productRepo.GetAllProducts()
	if err != nil {
		return nil, fmt.Errorf("failed to get products: %w", err)
	}

	productsDTO := make([]*dto.ProductResponse, len(products))
	for i, product := range products {
		categoryDTO := &dto.Category{
			ID:   product.CategoryID,
			Name: product.CategoryName,
		}

		productsDTO[i] = &dto.ProductResponse{
			ID:           product.ID,
			Name:         product.Name,
			Description:  product.Description,
			Benefits:     product.Benefits,
			Price:        product.Price,
			SellingPrice: product.SellingPrice,
			OfferPrice:   product.OfferPrice,
			ImageURL:     product.ImageURL,
			ImagePath:    product.ImagePath,
			Category:     categoryDTO,
			Quantity:     product.Quantity,
			CreatedBy:    product.CreatedBy,
			CreatedAt:    product.CreatedAt,
			UpdatedAt:    product.UpdatedAt,
		}
	}

	return &dto.ProductListResponse{
		Products: productsDTO,
		Total:    len(products),
	}, nil
}

// GetProductByID retrieves a product by ID
func (s *ProductService) GetProductByID(id int, userID int, role string, isAuthorized bool) (*dto.ProductResponse, error) {
	product, err := s.productRepo.GetProductByID(id)
	if err != nil {
		return nil, fmt.Errorf("product not found: %w", err)
	}

	categoryDTO := &dto.Category{
		ID:   product.CategoryID,
		Name: product.CategoryName,
	}

	response := &dto.ProductResponse{
		ID:           product.ID,
		Name:         product.Name,
		Description:  product.Description,
		Benefits:     product.Benefits,
		SellingPrice: product.SellingPrice,
		OfferPrice:   product.OfferPrice,
		ImageURL:     product.ImageURL,
		ImagePath:    product.ImagePath,
		Category:     categoryDTO,
		CreatedBy:    product.CreatedBy,
		CreatedAt:    product.CreatedAt,
		UpdatedAt:    product.UpdatedAt,
	}

	if !isAuthorized || role != "admin" {
		response.Price = product.Price;
		response.Quantity = product.Quantity;
	}

	return response, nil;
}

// DeleteProduct deletes a product (admin only)
func (s *ProductService) DeleteProduct(id int, userID int) (*dto.DeleteProductReponse, error) {
	product, err := s.productRepo.GetProductByID(id)

	if err != nil {
		return nil, errors.New("product not found")
	}

	if product.CreatedBy != userID {
		return nil, errors.New("unauthorized: only product creator can delete it")
	}

	if err := s.productRepo.DeleteProduct(id); err != nil {
		return nil, fmt.Errorf("failed to delete product: %w", err)
	}

	return &dto.DeleteProductReponse{
		ID:      id,
		Message: "Product deleted Succesfully",
	}, nil
}
