package dto

type OrderRequest struct {

	TotalAmount   float64           `json:"totalAmount" validate:"required,gt=0"`
	PaymentMethod string            `json:"paymentMethod" validate:"required,oneof=razorpay cod"`
}
