package repository

import (
	"database/sql"
	"fmt"

	"github.com/Himanshu0208/vedic-puja-sanskar/backend/internal/models"
)

// ProductRepository handles all product-related database operations
type ProductRepository struct {
	db *sql.DB
}

// NewProductRepository creates a new product repository instance
func NewProductRepository(db *sql.DB) *ProductRepository {
	return &ProductRepository{db: db}
}

// GetProductByID retrieves a product by ID
func (pr *ProductRepository) GetProductByID(id int) (*models.Product, error) {
	product := &models.Product{}
	err := pr.db.QueryRow(
		"SELECT id, name, description, category, price, image_url, stock, created_at FROM products WHERE id = $1",
		id,
	).Scan(&product.ID, &product.Name, &product.Description, &product.Category, &product.Price, &product.ImageURL, &product.Stock, &product.CreatedAt)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("product not found")
	}
	if err != nil {
		return nil, err
	}

	return product, nil
}

// SaveProduct saves or updates a product
func (pr *ProductRepository) SaveProduct(product *models.Product) error {
	if product.Name == "" {
		return fmt.Errorf("product name is required")
	}

	var id int
	err := pr.db.QueryRow(
		"INSERT INTO products (name, description, category, price, image_url, stock, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id",
		product.Name, product.Description, product.Category, product.Price, product.ImageURL, product.Stock, product.CreatedBy,
	).Scan(&id)

	if err != nil {
		return fmt.Errorf("failed to save product: %w", err)
	}

	product.ID = id
	return nil
}

// GetAllProducts retrieves all products
func (pr *ProductRepository) GetAllProducts() ([]*models.Product, error) {
	rows, err := pr.db.Query("SELECT id, name, description, category, price, image_url, stock, created_at FROM products ORDER BY created_at DESC")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var products []*models.Product
	for rows.Next() {
		product := &models.Product{}
		err := rows.Scan(&product.ID, &product.Name, &product.Description, &product.Category, &product.Price, &product.ImageURL, &product.Stock, &product.CreatedAt)
		if err != nil {
			return nil, err
		}
		products = append(products, product)
	}

	return products, rows.Err()
}

// GetProductsByCategory retrieves products by category
func (pr *ProductRepository) GetProductsByCategory(category string) ([]*models.Product, error) {
	rows, err := pr.db.Query(
		"SELECT id, name, description, category, price, image_url, stock, created_at FROM products WHERE category = $1 ORDER BY created_at DESC",
		category,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var products []*models.Product
	for rows.Next() {
		product := &models.Product{}
		err := rows.Scan(&product.ID, &product.Name, &product.Description, &product.Category, &product.Price, &product.ImageURL, &product.Stock, &product.CreatedAt)
		if err != nil {
			return nil, err
		}
		products = append(products, product)
	}

	return products, rows.Err()
}

// DeleteProduct deletes a product
func (pr *ProductRepository) DeleteProduct(id int) error {
	result, err := pr.db.Exec("DELETE FROM products WHERE id = $1", id)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return fmt.Errorf("product not found")
	}

	return nil
}
