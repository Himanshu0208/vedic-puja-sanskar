package models

import "time"

type PaymentMethod string

const (
	PaymentMethodRazorpay PaymentMethod = "RAZORPAY"
	PaymentMethodCOD      PaymentMethod = "COD"
)

type PaymentStatus string

const (
	PaymentPending  PaymentStatus = "pending"
	PaymentSuccess  PaymentStatus = "success"
	PaymentFailed   PaymentStatus = "failed"
	PaymentRefunded PaymentStatus = "refunded"
)

type Payment struct {
	ID                int
	Method            PaymentMethod
	Status            PaymentStatus
	RazorpayOrderID   string
	RazorpayPaymentID string
	Amount            float64
	UserID            int
	OrderID           int
	CreatedAt         time.Time
	UpdatedAt         time.Time
}

type PendingPayment struct {
	ID              int
	Amount          float64
	Currency        string
	RazorpayOrderID string
	Status          PaymentStatus
}
