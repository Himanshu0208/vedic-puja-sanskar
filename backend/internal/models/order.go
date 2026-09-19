package models

import "time"


type OrderStatus string

const (
	OrderPending        OrderStatus = "PENDING"
	OrderPlaced         OrderStatus = "PLACED"
	OrderProcessing     OrderStatus = "PROCESSING"
	OrderPacked         OrderStatus = "PACKED"
	OrderShipped        OrderStatus = "SHIPPED"
	OrderOutForDelivery OrderStatus = "OUT_FOR_DELIVERY"
	OrderDelivered      OrderStatus = "DELIVERED"
	OrderCancelled      OrderStatus = "CANCELLED"
	OrderRTO            OrderStatus = "RTO" // Return to Origin — delivery fail hui
	OrderOnHold         OrderStatus = "ON_HOLD"
)

type ReturnStatus string

const (
	ReturnRequested ReturnStatus = "RETURN_REQUESTED" // ye sirf tab set hoga jab order DELIVERED tha
	ReturnApproved  ReturnStatus = "RETURN_APPROVED"
	ReturnPicked    ReturnStatus = "RETURN_PICKED"
	ReturnCompleted ReturnStatus = "RETURN_COMPLETED"
	ReturnRejected  ReturnStatus = "RETURN_REJECTED"
)

// Order table
type Order struct {
	ID             int
	UserID         int
	Status         OrderStatus
	ReturnStatus   *ReturnStatus // nullable — sirf return/refund case mein set hoga
	TotalPrice     float64
	DiscountAmount float64
	CreatedAt      time.Time
	updatedAt      time.Time
}

// OrderItem table
type OrderItem struct {
	ID              int
	OrderID         int
	ProductID       int
	Quantity        int
	Price           float64
	DiscountedPrice float64
	CreatedAt       time.Time
}
