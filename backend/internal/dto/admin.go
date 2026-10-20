package dto

import "time"

type AdminUser struct {
	ID         int       `json:"id"`
	Email      string    `json:"email"`
	Role       string    `json:"role"`
	CreatedAt  time.Time `json:"createdAt"`
	OrderCount int       `json:"orderCount"`
}

type AdminUserList struct {
	Users      []AdminUser `json:"users"`
	Total      int         `json:"total"`
	Page       int         `json:"page"`
	PageSize   int         `json:"pageSize"`
	TotalPages int         `json:"totalPages"`
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

type AdminOrderList struct {
	Orders     []AdminOrder `json:"orders"`
	Total      int          `json:"total"`
	Page       int          `json:"page"`
	PageSize   int          `json:"pageSize"`
	TotalPages int          `json:"totalPages"`
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
	RefundedRevenue     float64            `json:"refundedRevenue"`
	CODRevenue          float64            `json:"codRevenue"`
	RazorpayRevenue     float64            `json:"razorpayRevenue"`
	CODReceivable       float64            `json:"codReceivable"`
	CODReceivableOrders int                `json:"codReceivableOrders"`
	MonthlyRevenue      []MonthlyRevenue   `json:"monthlyRevenue"`
	OrderStatuses       []OrderStatusCount `json:"orderStatuses"`
}

type AdminReturn struct {
	ID                int        `json:"id"`
	OrderID           int        `json:"orderId"`
	Amount            float64    `json:"amount"`
	Currency          string     `json:"currency"`
	UserID            int        `json:"userId"`
	CustomerEmail     string     `json:"customerEmail"`
	Description       string     `json:"description"`
	Reason            string     `json:"reason"`
	MediaURLs         []string   `json:"mediaUrls"`
	Status            string     `json:"status"`
	AdminRemarks      string     `json:"adminRemarks"`
	PaymentMethod     string     `json:"paymentMethod"`
	PaymentStatus     string     `json:"paymentStatus"`
	RefundID          string     `json:"refundId"`
	RefundReference   string     `json:"refundReference"`
	ReceivedAt        *time.Time `json:"receivedAt,omitempty"`
	RefundProcessedAt *time.Time `json:"refundProcessedAt,omitempty"`
	CreatedAt         time.Time  `json:"createdAt"`
}

type AdminReturnList struct {
	Returns    []AdminReturn `json:"returns"`
	Total      int           `json:"total"`
	Page       int           `json:"page"`
	PageSize   int           `json:"pageSize"`
	TotalPages int           `json:"totalPages"`
}
