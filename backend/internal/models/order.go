package models

import "time"

type OrderStatus string

const (
	OrderPendingPayment OrderStatus = "PENDING_PAYMENT"
	OrderPlaced         OrderStatus = "PLACED"
	OrderProcessing     OrderStatus = "PROCESSING"
	OrderPacked         OrderStatus = "PACKED"
	OrderShipped        OrderStatus = "SHIPPED"
	OrderOutForDelivery OrderStatus = "OUT_FOR_DELIVERY"
	OrderDelivered      OrderStatus = "DELIVERED"
	OrderCancelled      OrderStatus = "CANCELLED"
	OrderRTO            OrderStatus = "RTO"
)

type ReturnStatus string

const (
	ReturnRequested ReturnStatus = "RETURN_REQUESTED"
	ReturnApproved  ReturnStatus = "RETURN_APPROVED"
	ReturnPicked    ReturnStatus = "RETURN_PICKED"
	ReturnCompleted ReturnStatus = "RETURN_COMPLETED"
	ReturnRejected  ReturnStatus = "RETURN_REJECTED"
)

type Order struct {
	ID                 int
	UserID             int
	Status             OrderStatus
	ReturnStatus       *ReturnStatus
	SubtotalAmount     float64
	DiscountAmount     float64
	TotalAmount        float64
	Currency           string
	ShippingFullName   string
	ShippingPhone      string
	ShippingLine1      string
	ShippingLine2      string
	ShippingCity       string
	ShippingState      string
	ShippingPostalCode string
	ShippingCountry    string
	CreatedAt          time.Time
}

type OrderItem struct {
	ID                  int
	OrderID             int
	ProductID           int
	ProductName         string
	Quantity            int
	UnitPrice           float64
	DiscountedUnitPrice float64
	CreatedAt           time.Time
}
