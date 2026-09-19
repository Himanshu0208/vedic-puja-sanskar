package repository

import (
	"database/sql"
	"errors"
	"time"

	"github.com/Himanshu0208/vedic-puja-sanskar/backend/internal/models"
)

type OrderRepository struct {
	db *sql.DB
}

func NewOrderRepository(db *sql.DB) *OrderRepository {
	return &OrderRepository{db: db}
}

// ------------------ ORDER ------------------

// CreateOrder inserts a new order and returns its ID
func (r *OrderRepository) CreateOrder( order *models.Order) (int, error) {
	query := `
		INSERT INTO orders (user_id, status, return_status, total_price, discount_amount, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id
	`
	var id int
	err := r.db.QueryRow(query,
		order.UserID,
		order.Status,
		order.ReturnStatus,
		order.TotalPrice,
		order.DiscountAmount,
		time.Now(),
	).Scan(&id)
	if err != nil {
		return 0, err
	}
	return id, nil
}

// GetOrderByID fetches a single order by ID
func (r *OrderRepository) GetOrderByID( orderID int) (*models.Order, error) {
	query := `
		SELECT id, user_id, status, return_status, total_price, tax, coupon_code, discount_amount, payment_id, created_at
		FROM orders
		WHERE id = $1
	`
	var o models.Order
	err := r.db.QueryRow(query, orderID).Scan(
		&o.ID, &o.UserID, &o.Status, &o.ReturnStatus, &o.TotalPrice, &o.DiscountAmount, &o.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.New("order not found")
		}
		return nil, err
	}
	return &o, nil
}

// GetOrdersByUserID fetches all orders placed by a user
func (r *OrderRepository) GetOrdersByUserID( userID int) ([]*models.Order, error) {
	query := `
		SELECT id, user_id, status, return_status, total_price, tax, coupon_code, discount_amount, payment_id, created_at
		FROM orders
		WHERE user_id = $1
		ORDER BY created_at DESC
	`
	rows, err := r.db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var orders []*models.Order
	for rows.Next() {
		var o models.Order
		if err := rows.Scan(
			&o.ID, &o.UserID, &o.Status, &o.ReturnStatus, &o.TotalPrice, &o.DiscountAmount, &o.CreatedAt,
		); err != nil {
			return nil, err
		}
		orders = append(orders, &o)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return orders, nil
}

// UpdateOrderStatus updates only the order status field
func (r *OrderRepository) UpdateOrderStatus( orderID int, status models.OrderStatus) error {
	query := `
		UPDATE orders
		SET status = $1
		WHERE id = $2
	`
	result, err := r.db.Exec(query, status, orderID)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rowsAffected == 0 {
		return errors.New("order not found")
	}
	return nil
}

// UpdateReturnStatus updates only the return_status field (return/refund flow ke liye)
func (r *OrderRepository) UpdateReturnStatus( orderID int, returnStatus models.ReturnStatus) error {
	query := `
		UPDATE orders
		SET return_status = $1
		WHERE id = $2
	`
	result, err := r.db.Exec(query, returnStatus, orderID)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rowsAffected == 0 {
		return errors.New("order not found")
	}
	return nil
}

// UpdateOrderPaymentID links a payment to an order
func (r *OrderRepository) UpdateOrderPaymentID( orderID int, paymentID int) error {
	query := `
		UPDATE orders
		SET payment_id = $1
		WHERE id = $2
	`
	result, err := r.db.Exec(query, paymentID, orderID)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rowsAffected == 0 {
		return errors.New("order not found")
	}
	return nil
}