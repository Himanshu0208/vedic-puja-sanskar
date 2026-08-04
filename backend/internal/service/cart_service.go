package service

import (
	"fmt"

	"github.com/Himanshu0208/vedic-puja-sanskar/backend/internal/dto"
	"github.com/Himanshu0208/vedic-puja-sanskar/backend/internal/repository"
)

type CartService struct {
	cartRepo *repository.CartRepository
}

func NewCartService(cartRepo *repository.CartRepository) *CartService {
	return &CartService{
		cartRepo: cartRepo,
	}
}

func (s *CartService) CalculateTotalPrice(userID int) (float64, float64, error) {
	totalPrice, discountedTotalPrice, err := s.cartRepo.GetTotalPriceAndDiscountedPriceFromUserId(userID)

	if err != nil {
		return -1, -1, err
	}

	return totalPrice, discountedTotalPrice, nil
}

func (s *CartService) GetCart(userID int) (*dto.CartResponse, error) {
	cartItems, err := s.cartRepo.GetCartItemsByUserID(userID)
	if err != nil {
		return nil, err
	}

	totalPrice, discountedTotalPrice, err := s.CalculateTotalPrice(userID)
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
	err := s.cartRepo.AddToCart(userID, productID, quantity)
	if err != nil {
		return nil, fmt.Errorf("Error: Unable to add item to cart: %w", err)
	}

	// After removing, get the updated cart state
	cartItems, err := s.cartRepo.GetCartItemsByUserID(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get updated cart items: %w", err)
	}

	totalPrice, discountedTotalPrice, err := s.CalculateTotalPrice(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to calculate total price: %w", err)
	}

	return &dto.CartResponse{
		UserId:               userID,
		Items:                cartItems,
		TotalPrice:           totalPrice,
		DiscountedTotalPrice: discountedTotalPrice,
		TotalSavings:         (totalPrice) - (discountedTotalPrice),
	}, nil
}

func (s *CartService) RemoveFromCart(userID int, productID int) (*dto.CartResponse, error) {
	err := s.cartRepo.RemoveFromCart(userID, productID)
	if err != nil {
		return nil, fmt.Errorf("unable to remove item from cart: %w", err)
	}

	// After removing, get the updated cart state
	cartItems, err := s.cartRepo.GetCartItemsByUserID(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get updated cart items: %w", err)
	}

	totalPrice, discountedTotalPrice, err := s.CalculateTotalPrice(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to calculate total price: %w", err)
	}

	return &dto.CartResponse{
		UserId:               userID,
		Items:                cartItems,
		TotalPrice:           totalPrice,
		DiscountedTotalPrice: discountedTotalPrice,
		TotalSavings:         (totalPrice) - (discountedTotalPrice),
	}, nil
}

func (s *CartService) ClearCart(userID int) error {
	err := s.cartRepo.ClearCart(userID)

	if err != nil {
		return fmt.Errorf("failed to clear cart: %w", err)
	}

	return nil
}
