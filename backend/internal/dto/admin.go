package dto

import "time"

type AdminUser struct {
	ID         int       `json:"id"`
	Email      string    `json:"email"`
	Role       string    `json:"role"`
	CreatedAt  time.Time `json:"createdAt"`
	OrderCount int       `json:"orderCount"`
}

type AdminOrder struct {
	OrderID       int       `json:"orderId"`
	CustomerEmail string    `json:"customerEmail"`
	Status        string    `json:"status"`
	PaymentStatus string    `json:"paymentStatus"`
	PaymentMethod string    `json:"paymentMethod"`
	TotalAmount   float64   `json:"totalAmount"`
	Currency      string    `json:"currency"`
	CreatedAt     time.Time `json:"createdAt"`
}

type MonthlyRevenue struct {
	Month   string  `json:"month"`
	Revenue float64 `json:"revenue"`
}

type OrderStatusCount struct {
	Status string `json:"status"`
	Count  int    `json:"count"`
}

type AdminReport struct {
	Customers           int                `json:"customers"`
	Products            int                `json:"products"`
	Orders              int                `json:"orders"`
	PaidOrders          int                `json:"paidOrders"`
	CODOrders           int                `json:"codOrders"`
	RazorpayOrders      int                `json:"razorpayOrders"`
	CancelledOrders     int                `json:"cancelledOrders"`
	ReturnedOrders      int                `json:"returnedOrders"`
	OtherOrders         int                `json:"otherOrders"`
	PendingOrders       int                `json:"pendingOrders"`
	DeliveredOrders     int                `json:"deliveredOrders"`
	Revenue             float64            `json:"revenue"`
	CODRevenue          float64            `json:"codRevenue"`
	RazorpayRevenue     float64            `json:"razorpayRevenue"`
	CODReceivable       float64            `json:"codReceivable"`
	CODReceivableOrders int                `json:"codReceivableOrders"`
	MonthlyRevenue      []MonthlyRevenue   `json:"monthlyRevenue"`
	OrderStatuses       []OrderStatusCount `json:"orderStatuses"`
}
