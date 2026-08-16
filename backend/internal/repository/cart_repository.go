package repository

import (
	"database/sql"
	"fmt"

	"github.com/Himanshu0208/vedic-puja-sanskar/backend/internal/dto"
	"github.com/Himanshu0208/vedic-puja-sanskar/backend/internal/models"
)

// CartRepository handles database operations for the cart
type CartRepository struct {
	db *sql.DB
}

// NewCartRepository creates a new cart repository
func NewCartRepository(db *sql.DB) *CartRepository {
	return &CartRepository{
		db: db,
	}
}

// GetCartItemsByUserID retrieves cart items for a specific user
func (r *CartRepository) GetCartItemsByUserID(userID int) ([]*dto.CartItem, error) {
	query := `
		SELECT ci.product_id, ci.quantity, p.name, p.description, p.image_url, p.selling_price, p.offer_price
		FROM cart ci
		JOIN products p ON ci.product_id = p.id
		WHERE ci.user_id = $1
	`
	rows, err := r.db.Query(query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to query cart items: %w", err)
	}
	defer rows.Close()
	cartItems := []*dto.CartItem{}
	for rows.Next() {
		cartItem := &dto.CartItem{}
		if err := rows.Scan(&cartItem.ProductID, &cartItem.Quantity, &cartItem.ProductName, &cartItem.ProductDescription, &cartItem.ProductImageURL, &cartItem.Price, &cartItem.DiscountedPrice); err != nil {
			return nil, fmt.Errorf("failed to scan cart item: %w", err)
		}
		cartItems = append(cartItems, cartItem)
	}
	return cartItems, nil;
}

func (r *CartRepository) AddToCart(userID int, quantity int, product *models.ProductWithCategory) error {
	// Check if the product already exists in the cart
	var existingQuantity int
	err := r.db.QueryRow("SELECT quantity FROM cart WHERE user_id = $1 AND product_id = $2", userID, product.ID).Scan(&existingQuantity)
	if err != nil && err != sql.ErrNoRows {
		return err
	}

	if err == sql.ErrNoRows {
		// Insert new cart item
		_, err = r.db.Exec("INSERT INTO cart (user_id, product_id, quantity, price, offer_price) VALUES ($1, $2, $3, $4, $5)", userID, product.ID, quantity, product.Price, product.OfferPrice)
		if err != nil {
			return err
		}
	} else {
		// Update existing cart item
		newQuantity := existingQuantity + quantity
		if(newQuantity > product.Quantity) {
			return fmt.Errorf("Error: Insufficient stock for product ID %d", product.ID)
		}
		_, err = r.db.Exec("UPDATE cart SET quantity = $1 WHERE user_id = $2 AND product_id = $3", newQuantity, userID, product.ID)
		if err != nil {
			return err
		}
	}

	return nil
}

func (r *CartRepository) RemoveFromCart(userID int, productID int, quantity int) error {
	var existingQuantity int
	err := r.db.QueryRow("SELECT quantity FROM cart WHERE user_id = $1 AND product_id = $2", userID, productID).Scan(&existingQuantity)
	if err != nil && err != sql.ErrNoRows {
		return fmt.Errorf("failed to check existing cart item: %w", err)
	}

	if err == sql.ErrNoRows {
		return fmt.Errorf("item not found in cart")
	}

	if quantity > existingQuantity {
		return fmt.Errorf("cannot remove more items than exist in cart")
	}

	if existingQuantity == 1 || existingQuantity == quantity || quantity == -1 {
		if _, err = r.db.Exec("DELETE FROM cart WHERE user_id = $1 AND product_id = $2", userID, productID); err != nil {
			return fmt.Errorf("failed to delete cart item: %w", err)
		}
	} else {
		if _, err = r.db.Exec("UPDATE cart SET quantity = $1 WHERE user_id = $2 AND product_id = $3", existingQuantity-1, userID, productID); err != nil {
			return fmt.Errorf("failed to update cart item: %w", err)
		}
	}
	return nil
}

func (r *CartRepository) ClearCart(userID int) error {
	_, err := r.db.Exec("DELETE FROM cart WHERE user_id = $1", userID)
	if err != nil {
		return err;
	}
	return err
}

func (r *CartRepository) GetTotalPriceAndDiscountedPriceFromUserId(userID int) (float64, float64, error) {
	var totalPrice float64
	var discountedTotalPrice float64
	err := r.db.QueryRow(`SELECT SUM(ci.price * ci.quantity), SUM(ci.offer_price * ci.quantity) 
		FROM cart ci 
		JOIN products p 
		ON ci.product_id = p.id WHERE ci.user_id = $1`, userID).Scan(&totalPrice, &discountedTotalPrice)
	if err != nil {
		return 0, 0, err
	}

	return totalPrice, discountedTotalPrice, nil
}
