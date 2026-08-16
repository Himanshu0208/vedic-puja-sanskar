package dto

type AddItemToCartRequest struct {
	ProductID int `json:"productId" validate:"required"`
	Quantity  int `json:"quantity" validate:"required"`
}

type RemoveItemFromCartRequest struct {
	ProductID int `json:"productId" validate:"required"`
	Quantity  int `json:"quantity" validate:"required"`
}

type CartResponse struct {
	UserId               int         `json:"userId"`
	Items                []*CartItem `json:"items"`
	TotalPrice           float64     `json:"totalPrice"`
	DiscountedTotalPrice float64     `json:"discountedTotalPrice"`
	TotalSavings         float64     `json:"totalSavings"`
}

type CartItem struct {
	ProductID          int     `json:"productId"`
	ProductImageURL    string  `json:"productImageURL"`
	ProductName        string  `json:"productName"`
	ProductDescription string  `json:"productDescription"`
	Quantity           int     `json:"quantity"`
	Price              float64 `json:"price"`
	DiscountedPrice    float64 `json:"discountedPrice"`
}
