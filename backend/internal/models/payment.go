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
	ID                 int
	Method             PaymentMethod
	Status             PaymentStatus
	RazorpayOrderID    string
	RazorpayPaymentID  string
	RazorpaySignature  string
	Amount             float64
	Remarks            *string // nullable — sirf failure case mein set hoga
	UserID             int
	OrderID            int
	CreatedAt          time.Time
	UpdatedAt          time.Time
}