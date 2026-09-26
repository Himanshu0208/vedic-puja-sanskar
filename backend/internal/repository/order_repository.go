package repository

import (
	"database/sql"
	"errors"
	"fmt"
	"math"
	"strings"

	"github.com/Himanshu0208/vedic-puja-sanskar/backend/internal/dto"
	"github.com/Himanshu0208/vedic-puja-sanskar/backend/internal/models"
)

type OrderRepository struct {
	db *sql.DB
}

func NewOrderRepository(db *sql.DB) *OrderRepository {
	return &OrderRepository{db: db}
}

type checkoutItem struct {
	productID int
	name      string
	quantity  int
	stock     int
	price     float64
	payPrice  float64
}

func roundMoney(value float64) float64 { return math.Round(value*100) / 100 }

func (r *OrderRepository) CreateFromCart(userID int, req dto.OrderRequest) (*models.Order, *models.Payment, error) {
	tx, err := r.db.Begin()
	if err != nil {
		return nil, nil, err
	}
	defer tx.Rollback()

	items := make([]checkoutItem, 0)
	if req.ProductID != nil {
		var item checkoutItem
		err = tx.QueryRow(`SELECT id, name, quantity, selling_price, offer_price FROM products WHERE id=$1 FOR UPDATE`, *req.ProductID).Scan(
			&item.productID, &item.name, &item.stock, &item.price, &item.payPrice)
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil, errors.New("product not found")
		}
		if err != nil {
			return nil, nil, err
		}
		item.quantity = 1
		if item.stock < item.quantity {
			return nil, nil, fmt.Errorf("insufficient stock for %s", item.name)
		}
		if item.payPrice <= 0 || item.payPrice >= item.price {
			item.payPrice = item.price
		}
		items = append(items, item)
	} else {
		rows, err := tx.Query(`
		SELECT ci.product_id, p.name, ci.quantity, p.quantity, p.selling_price, p.offer_price
		FROM cart ci JOIN products p ON p.id = ci.product_id
		WHERE ci.user_id = $1 ORDER BY ci.created_at, ci.product_id
		FOR UPDATE OF ci, p`, userID)
		if err != nil {
			return nil, nil, fmt.Errorf("load cart for checkout: %w", err)
		}
		for rows.Next() {
			var item checkoutItem
			if err := rows.Scan(&item.productID, &item.name, &item.quantity, &item.stock, &item.price, &item.payPrice); err != nil {
				rows.Close()
				return nil, nil, err
			}
			if item.quantity < 1 || item.quantity > item.stock {
				rows.Close()
				return nil, nil, fmt.Errorf("insufficient stock for %s", item.name)
			}
			if item.payPrice <= 0 || item.payPrice >= item.price {
				item.payPrice = item.price
			}
			items = append(items, item)
		}
		if err := rows.Err(); err != nil {
			rows.Close()
			return nil, nil, err
		}
		rows.Close()
	}
	if len(items) == 0 {
		return nil, nil, errors.New("your cart is empty")
	}

	var subtotal, total float64
	for _, item := range items {
		subtotal += item.price * float64(item.quantity)
		total += item.payPrice * float64(item.quantity)
	}
	subtotal, total = roundMoney(subtotal), roundMoney(total)
	status := models.OrderPendingPayment
	method := models.PaymentMethodRazorpay
	if strings.EqualFold(req.PaymentMethod, "cod") {
		status, method = models.OrderPlaced, models.PaymentMethodCOD
	}
	var address dto.ShippingAddress
	if req.ShippingAddressID != nil {
		err = tx.QueryRow(`SELECT full_name, phone, line1, line2, city, state, postal_code, country
			FROM saved_addresses WHERE id = $1 AND user_id = $2`, *req.ShippingAddressID, userID).Scan(
			&address.FullName, &address.Phone, &address.Line1, &address.Line2, &address.City, &address.State, &address.PostalCode, &address.Country)
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil, errors.New("saved address not found")
		}
		if err != nil {
			return nil, nil, err
		}
	} else {
		address = *req.ShippingAddress
		// ponytail: exact matches are reused; concurrent first orders can duplicate an address. Add a unique index if that becomes a real issue.
		var addressID int
		err = tx.QueryRow(`SELECT id FROM saved_addresses WHERE user_id=$1 AND full_name=$2 AND phone=$3 AND line1=$4 AND line2=$5 AND city=$6 AND state=$7 AND postal_code=$8 AND country=$9 LIMIT 1`,
			userID, address.FullName, address.Phone, address.Line1, address.Line2, address.City, address.State, address.PostalCode, strings.ToUpper(address.Country)).Scan(&addressID)
		if errors.Is(err, sql.ErrNoRows) {
			err = tx.QueryRow(`INSERT INTO saved_addresses (user_id, full_name, phone, line1, line2, city, state, postal_code, country)
				VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`, userID, address.FullName, address.Phone, address.Line1, address.Line2, address.City, address.State, address.PostalCode, strings.ToUpper(address.Country)).Scan(&addressID)
		}
		if err != nil {
			return nil, nil, fmt.Errorf("save delivery address: %w", err)
		}
	}
	order := &models.Order{
		UserID: userID, Status: status, SubtotalAmount: subtotal,
		DiscountAmount: roundMoney(subtotal - total), TotalAmount: total, Currency: "INR",
		ShippingFullName: address.FullName, ShippingPhone: address.Phone,
		ShippingLine1: address.Line1, ShippingLine2: address.Line2,
		ShippingCity: address.City, ShippingState: address.State,
		ShippingPostalCode: address.PostalCode, ShippingCountry: strings.ToUpper(address.Country),
	}
	err = tx.QueryRow(`
		INSERT INTO orders (user_id, status, subtotal_amount, discount_amount, total_amount, currency,
		  shipping_full_name, shipping_phone, shipping_line1, shipping_line2, shipping_city,
		  shipping_state, shipping_postal_code, shipping_country)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING id, created_at`,
		order.UserID, order.Status, order.SubtotalAmount, order.DiscountAmount, order.TotalAmount, order.Currency,
		order.ShippingFullName, order.ShippingPhone, order.ShippingLine1, order.ShippingLine2,
		order.ShippingCity, order.ShippingState, order.ShippingPostalCode, order.ShippingCountry,
	).Scan(&order.ID, &order.CreatedAt)
	if err != nil {
		return nil, nil, fmt.Errorf("create order: %w", err)
	}

	for _, item := range items {
		if _, err := tx.Exec(`INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, discounted_unit_price)
			VALUES ($1,$2,$3,$4,$5,$6)`, order.ID, item.productID, item.name, item.quantity, item.price, item.payPrice); err != nil {
			return nil, nil, fmt.Errorf("save order item: %w", err)
		}
	}

	payment := &models.Payment{Method: method, Status: models.PaymentPending, Amount: total, UserID: userID, OrderID: order.ID}
	err = tx.QueryRow(`INSERT INTO payments (method, status, amount, user_id, order_id)
		VALUES ($1,$2,$3,$4,$5) RETURNING id`, payment.Method, payment.Status, payment.Amount, userID, order.ID).Scan(&payment.ID)
	if err != nil {
		return nil, nil, fmt.Errorf("create payment: %w", err)
	}
	if method == models.PaymentMethodCOD && req.ProductID == nil {
		if _, err := tx.Exec("DELETE FROM cart WHERE user_id = $1", userID); err != nil {
			return nil, nil, fmt.Errorf("clear ordered cart: %w", err)
		}
	}
	if err := tx.Commit(); err != nil {
		return nil, nil, err
	}
	return order, payment, nil
}

func (r *OrderRepository) GetAddressesByUserID(userID int) ([]dto.SavedAddress, error) {
	rows, err := r.db.Query(`SELECT id, full_name, phone, line1, line2, city, state, postal_code, country
		FROM saved_addresses WHERE user_id=$1 ORDER BY updated_at DESC, id DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	addresses := make([]dto.SavedAddress, 0)
	for rows.Next() {
		var a dto.SavedAddress
		if err := rows.Scan(&a.ID, &a.FullName, &a.Phone, &a.Line1, &a.Line2, &a.City, &a.State, &a.PostalCode, &a.Country); err != nil {
			return nil, err
		}
		addresses = append(addresses, a)
	}
	return addresses, rows.Err()
}

func (r *OrderRepository) GetOrdersByUserID(userID int) ([]dto.UserOrderResponse, error) {
	rows, err := r.db.Query(`SELECT o.id, o.status, COALESCE(o.return_status,''), p.status, p.method, o.total_amount, o.currency, o.created_at,
		oi.product_name, COALESCE(pr.image_url,''), oi.quantity, oi.unit_price, oi.discounted_unit_price
		FROM orders o JOIN payments p ON p.order_id=o.id
		LEFT JOIN order_items oi ON oi.order_id=o.id LEFT JOIN products pr ON pr.id=oi.product_id WHERE o.user_id=$1
		ORDER BY o.created_at DESC, o.id DESC, oi.id`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	orders := make([]dto.UserOrderResponse, 0)
	byID := make(map[int]int)
	for rows.Next() {
		var orderID int
		var itemName sql.NullString
		var imageURL sql.NullString
		var quantity sql.NullInt64
		var unitPrice, amount sql.NullFloat64
		var order dto.UserOrderResponse
		if err := rows.Scan(&orderID, &order.Status, &order.ReturnStatus, &order.PaymentStatus, &order.PaymentMethod, &order.TotalAmount, &order.Currency, &order.CreatedAt, &itemName, &imageURL, &quantity, &unitPrice, &amount); err != nil {
			return nil, err
		}
		index, exists := byID[orderID]
		if !exists {
			order.OrderID = orderID
			order.PaymentMethod = strings.ToLower(order.PaymentMethod)
			order.Items = make([]dto.OrderItemResponse, 0)
			orders = append(orders, order)
			index = len(orders) - 1
			byID[orderID] = index
		}
		if itemName.Valid {
			orders[index].Items = append(orders[index].Items, dto.OrderItemResponse{ProductName: itemName.String, ImageURL: imageURL.String, Quantity: int(quantity.Int64), UnitPrice: unitPrice.Float64, Amount: amount.Float64})
		}
	}
	return orders, rows.Err()
}

func (r *OrderRepository) GetRetryPayment(userID, orderID int) (*models.PendingPayment, error) {
	payment := &models.PendingPayment{}
	err := r.db.QueryRow(`SELECT p.id, p.amount, o.currency, COALESCE(p.razorpay_order_id,''), p.status
		FROM payments p JOIN orders o ON o.id=p.order_id
		WHERE p.user_id=$1 AND p.order_id=$2 AND p.method='RAZORPAY'
		AND p.status='pending' AND o.status='PENDING_PAYMENT'`, userID, orderID).Scan(
		&payment.ID, &payment.Amount, &payment.Currency, &payment.RazorpayOrderID, &payment.Status)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, errors.New("payment is not available to retry")
	}
	return payment, err
}

func (r *OrderRepository) CancelOrder(userID, orderID int) error {
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()
	var status, paymentStatus, method string
	err = tx.QueryRow(`SELECT o.status,p.status,p.method FROM orders o JOIN payments p ON p.order_id=o.id
		WHERE o.id=$1 AND o.user_id=$2 FOR UPDATE OF o,p`, orderID, userID).Scan(&status, &paymentStatus, &method)
	if errors.Is(err, sql.ErrNoRows) {
		return errors.New("order not found")
	}
	if err != nil {
		return err
	}
	if status != string(models.OrderPendingPayment) && !(status == string(models.OrderPlaced) && method == string(models.PaymentMethodCOD) && paymentStatus == string(models.PaymentPending)) {
		return errors.New("order cannot be cancelled online")
	}
	if _, err := tx.Exec(`UPDATE orders SET status='CANCELLED', updated_at=NOW() WHERE id=$1`, orderID); err != nil {
		return err
	}
	if _, err := tx.Exec(`UPDATE payments SET status='failed', remarks='Cancelled by customer', updated_at=NOW() WHERE order_id=$1 AND status='pending'`, orderID); err != nil {
		return err
	}
	return tx.Commit()
}

func (r *OrderRepository) RequestReturn(userID, orderID int) error {
	result, err := r.db.Exec(`UPDATE orders SET return_status='RETURN_REQUESTED', updated_at=NOW()
		WHERE id=$1 AND user_id=$2 AND status='DELIVERED' AND return_status IS NULL`, orderID, userID)
	if err != nil {
		return err
	}
	if count, _ := result.RowsAffected(); count != 1 {
		return errors.New("return is not available for this order")
	}
	return nil
}

func (r *OrderRepository) GetAdminOrders() ([]dto.AdminOrder, error) {
	rows, err := r.db.Query(`SELECT o.id,u.email,o.status,COALESCE(p.status,'unknown'),COALESCE(p.method,'unknown'),o.total_amount,o.currency,o.created_at
		FROM orders o JOIN users u ON u.id=o.user_id LEFT JOIN payments p ON p.order_id=o.id
		ORDER BY o.created_at DESC LIMIT 100`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	orders := make([]dto.AdminOrder, 0)
	for rows.Next() {
		var order dto.AdminOrder
		if err := rows.Scan(&order.OrderID, &order.CustomerEmail, &order.Status, &order.PaymentStatus, &order.PaymentMethod, &order.TotalAmount, &order.Currency, &order.CreatedAt); err != nil {
			return nil, err
		}
		order.PaymentMethod = strings.ToLower(order.PaymentMethod)
		orders = append(orders, order)
	}
	return orders, rows.Err()
}

func (r *OrderRepository) GetAdminReport() (*dto.AdminReport, error) {
	report := &dto.AdminReport{MonthlyRevenue: make([]dto.MonthlyRevenue, 0, 6), OrderStatuses: make([]dto.OrderStatusCount, 0)}
	err := r.db.QueryRow(`SELECT
		(SELECT COUNT(*) FROM users WHERE is_admin=false),
		(SELECT COUNT(*) FROM products),
		COUNT(o.id), COUNT(o.id) FILTER (WHERE p.status='success'),
		COUNT(o.id) FILTER (WHERE p.method='COD'),
		COUNT(o.id) FILTER (WHERE p.method='RAZORPAY'),
		COUNT(o.id) FILTER (WHERE o.status='CANCELLED'),
		COUNT(o.id) FILTER (WHERE o.status='RTO' OR o.return_status='RETURN_COMPLETED'),
		COUNT(o.id) FILTER (WHERE p.id IS NULL),
		COUNT(o.id) FILTER (WHERE o.status='PENDING_PAYMENT'),
		COUNT(o.id) FILTER (WHERE o.status='DELIVERED'),
		COALESCE(SUM(p.amount) FILTER (WHERE p.status='success'),0),
		COALESCE(SUM(p.amount) FILTER (WHERE p.status='success' AND p.method='COD'),0),
		COALESCE(SUM(p.amount) FILTER (WHERE p.status='success' AND p.method='RAZORPAY'),0),
		COALESCE(SUM(o.total_amount) FILTER (WHERE p.method='COD' AND p.status='pending' AND o.status NOT IN ('CANCELLED','RTO') AND COALESCE(o.return_status,'') <> 'RETURN_COMPLETED'),0),
		COUNT(o.id) FILTER (WHERE p.method='COD' AND p.status='pending' AND o.status NOT IN ('CANCELLED','RTO') AND COALESCE(o.return_status,'') <> 'RETURN_COMPLETED')
		FROM orders o LEFT JOIN payments p ON p.order_id=o.id`).Scan(
		&report.Customers, &report.Products, &report.Orders, &report.PaidOrders, &report.CODOrders, &report.RazorpayOrders,
		&report.CancelledOrders, &report.ReturnedOrders, &report.OtherOrders, &report.PendingOrders, &report.DeliveredOrders, &report.Revenue,
		&report.CODRevenue, &report.RazorpayRevenue,
		&report.CODReceivable, &report.CODReceivableOrders)
	if err != nil {
		return nil, err
	}
	statusRows, err := r.db.Query(`SELECT order_status, COUNT(*)
		FROM (
			SELECT CASE
				WHEN status='RTO' OR return_status='RETURN_COMPLETED' THEN 'RETURNED'
				WHEN return_status IN ('RETURN_REQUESTED','RETURN_APPROVED','RETURN_PICKED') THEN 'RETURN_IN_PROGRESS'
				ELSE status
			END AS order_status
			FROM orders
		) AS order_states
		GROUP BY order_status ORDER BY order_status`)
	if err != nil {
		return nil, err
	}
	defer statusRows.Close()
	for statusRows.Next() {
		var status dto.OrderStatusCount
		if err := statusRows.Scan(&status.Status, &status.Count); err != nil {
			return nil, err
		}
		report.OrderStatuses = append(report.OrderStatuses, status)
	}
	if err := statusRows.Err(); err != nil {
		return nil, err
	}
	rows, err := r.db.Query(`SELECT TO_CHAR(months.month,'YYYY-MM'),COALESCE(SUM(p.amount) FILTER (WHERE p.status='success'),0)
		FROM generate_series(date_trunc('month',NOW())-INTERVAL '5 months',date_trunc('month',NOW()),INTERVAL '1 month') AS months(month)
		LEFT JOIN orders o ON date_trunc('month',o.created_at)=months.month
		LEFT JOIN payments p ON p.order_id=o.id
		GROUP BY months.month ORDER BY months.month`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var month dto.MonthlyRevenue
		if err := rows.Scan(&month.Month, &month.Revenue); err != nil {
			return nil, err
		}
		report.MonthlyRevenue = append(report.MonthlyRevenue, month)
	}
	return report, rows.Err()
}

func (r *OrderRepository) SaveRazorpayOrderID(paymentID int, razorpayOrderID string) error {
	_, err := r.db.Exec("UPDATE payments SET razorpay_order_id = $1, updated_at = NOW() WHERE id = $2", razorpayOrderID, paymentID)
	return err
}

func (r *OrderRepository) FailOrder(orderID int, reason string) error {
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()
	if _, err = tx.Exec("UPDATE payments SET status = 'failed', remarks = $1, updated_at = NOW() WHERE order_id = $2", reason, orderID); err != nil {
		return err
	}
	if _, err = tx.Exec("UPDATE orders SET status = 'CANCELLED', updated_at = NOW() WHERE id = $1 AND status = 'PENDING_PAYMENT'", orderID); err != nil {
		return err
	}
	return tx.Commit()
}

func (r *OrderRepository) GetPaymentForVerification(userID, orderID int) (*models.PendingPayment, error) {
	payment := &models.PendingPayment{}
	err := r.db.QueryRow(`SELECT p.id, p.amount, o.currency, COALESCE(p.razorpay_order_id, ''), p.status
		FROM payments p JOIN orders o ON o.id = p.order_id
		WHERE p.order_id = $1 AND p.user_id = $2 AND p.method = 'RAZORPAY'
		AND o.status IN ('PENDING_PAYMENT', 'PLACED')`, orderID, userID).Scan(
		&payment.ID, &payment.Amount, &payment.Currency, &payment.RazorpayOrderID, &payment.Status)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, errors.New("order not found")
	}
	return payment, err
}

func (r *OrderRepository) CompletePayment(userID, orderID, paymentID int, razorpayPaymentID, signature string) error {
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()
	var status, previousPaymentID string
	err = tx.QueryRow(`SELECT status, COALESCE(razorpay_payment_id, '') FROM payments
		WHERE id = $1 AND order_id = $2 AND user_id = $3 FOR UPDATE`, paymentID, orderID, userID).Scan(&status, &previousPaymentID)
	if err != nil {
		return err
	}
	if status == string(models.PaymentSuccess) && previousPaymentID == razorpayPaymentID {
		return tx.Commit()
	}
	if status != string(models.PaymentPending) {
		return errors.New("payment is not pending")
	}
	if _, err := tx.Exec(`UPDATE payments SET status = 'success', razorpay_payment_id = $1,
		razorpay_signature = $2, updated_at = NOW() WHERE id = $3`, razorpayPaymentID, signature, paymentID); err != nil {
		return err
	}
	result, err := tx.Exec(`UPDATE orders SET status = 'PLACED', updated_at = NOW()
		WHERE id = $1 AND user_id = $2 AND status = 'PENDING_PAYMENT'`, orderID, userID)
	if err != nil {
		return err
	}
	if n, _ := result.RowsAffected(); n != 1 {
		return errors.New("order is no longer awaiting payment")
	}
	if _, err := tx.Exec("DELETE FROM cart WHERE user_id = $1", userID); err != nil {
		return err
	}
	return tx.Commit()
}
