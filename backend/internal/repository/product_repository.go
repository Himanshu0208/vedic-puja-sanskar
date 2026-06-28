package repository

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/Himanshu0208/vedic-puja-sanskar/backend/internal/models"
)

type ProductRepository struct {
	db *sql.DB
}

func NewProductRepository(db *sql.DB) *ProductRepository {
	return &ProductRepository{db: db}
}

func (pr *ProductRepository) GetProductByID(id int) (*models.ProductWithCategory, error) {
	product := &models.ProductWithCategory{}
	err := pr.db.QueryRow(
		`SELECT p.id, p.name, p.description, p.benefits, p.price, p.selling_price, p.offer_price, 
        p.image_url, p.image_path, p.category_id, p.quantity, p.created_by, p.created_at, p.updated_at, c.name as category_name
        FROM products as p JOIN categories c ON p.category_id = c.id WHERE p.id = $1`,
		id,
	).Scan(
		&product.ID, &product.Name, &product.Description, &product.Benefits,
		&product.Price, &product.SellingPrice, &product.OfferPrice,
		&product.ImageURL, &product.ImagePath, &product.CategoryID,
		&product.Quantity, &product.CreatedBy, &product.CreatedAt, &product.UpdatedAt, &product.CategoryName,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("product not found")
	}
	if err != nil {
		return nil, err
	}

	return product, nil
}

func (pr *ProductRepository) SaveProduct(product *models.Product) error {
	if product.Name == "" {
		return fmt.Errorf("product name is required")
	}

	var id int
	err := pr.db.QueryRow(
		`INSERT INTO products 
        (name, description, benefits, price, selling_price, offer_price, image_url, image_path, category_id, quantity, created_by) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
        RETURNING id`,
		product.Name, product.Description, product.Benefits,
		product.Price, product.SellingPrice, product.OfferPrice,
		product.ImageURL, product.ImagePath, product.CategoryID,
		product.Quantity, product.CreatedBy,
	).Scan(&id)

	if err != nil {
		return fmt.Errorf("failed to save product: %w", err)
	}

	product.ID = id
	product.CreatedAt = time.Now()
	product.UpdatedAt = time.Now()

	return nil
}

func (pr *ProductRepository) UpdateProduct(product *models.Product) error {
	result, err := pr.db.Exec(
		`UPDATE products SET 
        name = $1, description = $2, benefits = $3, price = $4, selling_price = $5, 
        offer_price = $6, image_url = $7, image_path = $8, category_id = $9, 
        quantity = $10, updated_at = CURRENT_TIMESTAMP
        WHERE id = $11`,
		product.Name, product.Description, product.Benefits,
		product.Price, product.SellingPrice, product.OfferPrice,
		product.ImageURL, product.ImagePath, product.CategoryID,
		product.Quantity, product.ID,
	)
	if err != nil {
		return fmt.Errorf("failed to update product: %w", err)
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

func (pr *ProductRepository) GetAllProducts() ([]*models.ProductWithCategory, error) {
	rows, err := pr.db.Query(
		`SELECT p.id, p.name, p.description, p.benefits, p.price, p.selling_price, p.offer_price, 
        p.image_url, p.image_path, p.category_id, p.quantity, p.created_by, p.created_at, p.updated_at, c.name as category_name
        FROM products as p JOIN categories c ON p.category_id = c.id ORDER BY p.created_at DESC`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var products []*models.ProductWithCategory
	for rows.Next() {
		product := &models.ProductWithCategory{}
		err := rows.Scan(
			&product.ID, &product.Name, &product.Description, &product.Benefits,
			&product.Price, &product.SellingPrice, &product.OfferPrice,
			&product.ImageURL, &product.ImagePath, &product.CategoryID,
			&product.Quantity, &product.CreatedBy, &product.CreatedAt, &product.UpdatedAt, &product.CategoryName,
		)
		if err != nil {
			return nil, err
		}
		products = append(products, product)
	}

	return products, rows.Err()
}

func (pr *ProductRepository) GetProductsByCategory(categoryID int) ([]*models.ProductWithCategory, error) {
	rows, err := pr.db.Query(
		`SELECT p.id, p.name, p.description, p.benefits, p.price, p.selling_price, p.offer_price, 
        p.image_url, p.image_path, p.category_id, p.quantity, p.created_by, p.created_at, p.updated_at, c.name as category_name
        FROM products as p JOIN categories c ON p.category_id = c.id WHERE p.category_id = $1 ORDER BY p.created_at DESC`,
		categoryID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var products []*models.ProductWithCategory
	for rows.Next() {
		product := &models.ProductWithCategory{}
		err := rows.Scan(
			&product.ID, &product.Name, &product.Description, &product.Benefits,
			&product.Price, &product.SellingPrice, &product.OfferPrice,
			&product.ImageURL, &product.ImagePath, &product.CategoryID,
			&product.Quantity, &product.CreatedBy, &product.CreatedAt, &product.UpdatedAt, &product.CategoryName,
		)
		if err != nil {
			return nil, err
		}
		products = append(products, product)
	}

	return products, rows.Err()
}

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
