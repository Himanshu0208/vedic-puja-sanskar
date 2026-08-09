package service

import (
	"fmt"

	"github.com/Himanshu0208/vedic-puja-sanskar/backend/internal/dto"
	"github.com/Himanshu0208/vedic-puja-sanskar/backend/internal/repository"
)

type CartService struct {
	cartRepo *repository.CartRepository
	productRepo *repository.ProductRepository
}

func NewCartService(cartRepo *repository.CartRepository, productRepo *repository.ProductRepository) *CartService {
	return &CartService{
		cartRepo: cartRepo,
		productRepo: productRepo,
	}
}

func (s *CartService) CalculateTotalPrice(cartItems []*dto.CartItem) (float64, float64, error) {
	totalPrice := 0.0
	discountedTotalPrice := 0.0

	for _, item := range cartItems {
		totalPrice += item.Price * float64(item.Quantity)
		discountedTotalPrice += item.DiscountedPrice * float64(item.Quantity)
	}

	return totalPrice, discountedTotalPrice, nil
}

func (s *CartService) GetCart(userID int) (*dto.CartResponse, error) {
	cartItems, err := s.cartRepo.GetCartItemsByUserID(userID)
	if err != nil {
		return nil, err
	}

	totalPrice, discountedTotalPrice, err := s.CalculateTotalPrice(cartItems)
	if err != nil {
		return nil, fmt.Errorf("Error Occured while calulating Total Price: %w", err)
	}

	return &dto.CartResponse{
		UserId:               userID,
		Items:                cartItems,
		TotalPrice:           totalPrice,
		DiscountedTotalPrice: discountedTotalPrice,
		TotalSavings:         (totalPrice) - (discountedTotalPrice),
	}, nil
}

func (s *CartService) AddToCart(userID int, productID int, quantity int) (*dto.CartResponse, error) {
	product, err := s.productRepo.GetProductByID(productID)
	if err != nil {
		return nil, fmt.Errorf("Error: Unable to fetch product details: %w", err)
	}
	
	if product.Quantity < quantity {
		return nil, fmt.Errorf("Error: Insufficient stock for product ID %d", productID)
	}

	err = s.cartRepo.AddToCart(userID, quantity, product)
	if err != nil {
		return nil, fmt.Errorf("Error: Unable to add item to cart: %w", err)
	}

	return s.GetCart(userID);
}

func (s *CartService) RemoveFromCart(userID int, productID int, quantity int) (*dto.CartResponse, error) {
	err := s.cartRepo.RemoveFromCart(userID, productID, quantity)
	if err != nil {
		return nil, fmt.Errorf("unable to remove item from cart: %w", err)
	}

	return s.GetCart(userID);
}

func (s *CartService) ClearCart(userID int) error {
	err := s.cartRepo.ClearCart(userID)

	if err != nil {
		return fmt.Errorf("failed to clear cart: %w", err)
	}

	return nil
}
