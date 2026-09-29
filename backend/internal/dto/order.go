package dto

import "time"

type ShippingAddress struct {
	FullName   string `json:"fullName" validate:"required,max=120"`
	Phone      string `json:"phone" validate:"required,min=8,max=20"`
	Line1      string `json:"line1" validate:"required,max=255"`
	Line2      string `json:"line2" validate:"max=255"`
	City       string `json:"city" validate:"required,max=100"`
	State      string `json:"state" validate:"required,max=100"`
	PostalCode string `json:"postalCode" validate:"required,max=20"`
	Country    string `json:"country" validate:"required,len=2"`
}

type OrderRequest struct {
	PaymentMethod     string           `json:"paymentMethod" validate:"required,oneof=razorpay cod"`
	ProductID         *int             `json:"productId"`
	ShippingAddressID *int             `json:"shippingAddressId"`
	ShippingAddress   *ShippingAddress `json:"shippingAddress"`
}

type SavedAddress struct {
	ID int `json:"id"`
	ShippingAddress
}

type OrderItemResponse struct {
	ProductName string  `json:"productName"`
	ImageURL    string  `json:"imageURL"`
	Quantity    int     `json:"quantity"`
	UnitPrice   float64 `json:"unitPrice"`
	Amount      float64 `json:"amount"`
}

type UserOrderResponse struct {
	OrderID       int                 `json:"orderId"`
	Status        string              `json:"status"`
	PaymentStatus string              `json:"paymentStatus"`
	PaymentMethod string              `json:"paymentMethod"`
	ReturnStatus  string              `json:"returnStatus,omitempty"`
	TotalAmount   float64             `json:"totalAmount"`
	Currency      string              `json:"currency"`
	CreatedAt     time.Time           `json:"createdAt"`
	Items         []OrderItemResponse `json:"items"`
}

type UserOrderListResponse struct {
	Orders     []UserOrderResponse `json:"orders"`
	Total      int                 `json:"total"`
	Page       int                 `json:"page"`
	PageSize   int                 `json:"pageSize"`
	TotalPages int                 `json:"totalPages"`
}

type OrderActionResponse struct {
	OrderID int    `json:"orderId"`
	Status  string `json:"status"`
}

type VerifyPaymentRequest struct {
	RazorpayOrderID   string `json:"razorpayOrderId" validate:"required"`
	RazorpayPaymentID string `json:"razorpayPaymentId" validate:"required"`
	RazorpaySignature string `json:"razorpaySignature" validate:"required,len=64"`
}

type OrderResponse struct {
	OrderID         int    `json:"orderId"`
	Status          string `json:"status"`
	PaymentStatus   string `json:"paymentStatus"`
	PaymentMethod   string `json:"paymentMethod"`
	Amount          int64  `json:"amount"`
	Currency        string `json:"currency"`
	RazorpayOrderID string `json:"razorpayOrderId,omitempty"`
	RazorpayKeyID   string `json:"razorpayKeyId,omitempty"`
}

type VerifyPaymentResponse struct {
	OrderID       int    `json:"orderId"`
	Status        string `json:"status"`
	PaymentStatus string `json:"paymentStatus"`
}
