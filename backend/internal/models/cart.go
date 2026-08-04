package models

import "time"

type CartItem struct {
	ID                 string
	UserID             int
	ProductID          int
	Quantity           int
	ProductName        string
	ProductDescription string
	ProductImageURL    string
	Price              float64
	OfferPrice         float64
	CreatedAt          time.Time
	UpdatedAt          time.Time
}
