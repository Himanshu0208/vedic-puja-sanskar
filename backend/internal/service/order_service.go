package service

import (
	"errors"
	"fmt"
	
	"github.com/Himanshu0208/vedic-puja-sanskar/backend/internal/dto"
	"github.com/Himanshu0208/vedic-puja-sanskar/backend/internal/model"
	"github.com/Himanshu0208/vedic-puja-sanskar/backend/internal/repository"
	"github.com/Himanshu0208/vedic-puja-sanskar/backend/pkg/utils"
)

type OrderService struct {
	orderRepo *repository.OrderRepository
	cartRepo  *repository.CartRepository
}

func NewOrderService(orderRepo *repository.OrderRepository, cartRepo *repository.CartRepository) *OrderService {
	return &OrderService{
		orderRepo: orderRepo,
		cartRepo:  cartRepo,
	}
}

func (s *OrderService) CreateOrder(userID int, orderRequest dto.OrderRequest) (*dto.OrderResponse, error) {
	totalPrice, discountedTotalPrice, err := s.cartRepo.GetTotalPriceAndDiscountedPriceFromUserId(userID)
	if err != nil {
		return nil, fmt.Errorf("Failed to get total price")
	}
}