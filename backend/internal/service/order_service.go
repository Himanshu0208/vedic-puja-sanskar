package service

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"math"
	"strings"

	"github.com/Himanshu0208/vedic-puja-sanskar/backend/internal/dto"
	"github.com/Himanshu0208/vedic-puja-sanskar/backend/internal/models"
	"github.com/Himanshu0208/vedic-puja-sanskar/backend/internal/repository"
)

type OrderService struct {
	orderRepo      *repository.OrderRepository
	razorpay       *RazorpayClient
	razorpayKeyID  string
	razorpaySecret string
}

func NewOrderService(orderRepo *repository.OrderRepository, keyID, keySecret string) *OrderService {
	return &OrderService{orderRepo: orderRepo, razorpay: NewRazorpayClient(keyID, keySecret), razorpayKeyID: keyID, razorpaySecret: keySecret}
}

func (s *OrderService) CreateOrder(ctx context.Context, userID int, req dto.OrderRequest) (*dto.OrderResponse, error) {
	if req.PaymentMethod == "razorpay" && (s.razorpayKeyID == "" || s.razorpaySecret == "") {
		return nil, errors.New("Razorpay is not configured; set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET")
	}
	order, payment, err := s.orderRepo.CreateFromCart(userID, req)
	if err != nil {
		return nil, err
	}
	response := &dto.OrderResponse{
		OrderID: order.ID, Status: string(order.Status), PaymentStatus: string(payment.Status),
		PaymentMethod: strings.ToLower(string(payment.Method)), Amount: int64(math.Round(order.TotalAmount * 100)), Currency: order.Currency,
	}
	if payment.Method == models.PaymentMethodCOD {
		return response, nil
	}

	remoteOrderID, err := s.razorpay.CreateOrder(ctx, response.Amount, fmt.Sprintf("vps_%d", order.ID))
	if err != nil {
		_ = s.orderRepo.FailOrder(order.ID, "Razorpay order creation failed")
		return nil, fmt.Errorf("create Razorpay order: %w", err)
	}
	if err := s.orderRepo.SaveRazorpayOrderID(payment.ID, remoteOrderID); err != nil {
		return nil, fmt.Errorf("save Razorpay order ID: %w", err)
	}
	response.RazorpayOrderID = remoteOrderID
	response.RazorpayKeyID = s.razorpayKeyID
	return response, nil
}

func (s *OrderService) GetOrders(userID, page, pageSize int) (*dto.UserOrderListResponse, error) {
	return s.orderRepo.GetOrdersByUserID(userID, page, pageSize)
}

func (s *OrderService) GetAddresses(userID int) ([]dto.SavedAddress, error) {
	return s.orderRepo.GetAddressesByUserID(userID)
}

func (s *OrderService) CreateAddress(userID int, address dto.ShippingAddress) (*dto.SavedAddress, error) {
	return s.orderRepo.CreateAddress(userID, address)
}
func (s *OrderService) UpdateAddress(userID, addressID int, address dto.ShippingAddress) (*dto.SavedAddress, error) {
	return s.orderRepo.UpdateAddress(userID, addressID, address)
}
func (s *OrderService) DeleteAddress(userID, addressID int) error {
	return s.orderRepo.DeleteAddress(userID, addressID)
}

func (s *OrderService) RetryPayment(userID, orderID int) (*dto.OrderResponse, error) {
	payment, err := s.orderRepo.GetRetryPayment(userID, orderID)
	if err != nil {
		return nil, err
	}
	if payment.RazorpayOrderID == "" {
		return nil, errors.New("payment is not available to retry")
	}
	return &dto.OrderResponse{OrderID: orderID, Status: string(models.OrderPendingPayment), PaymentStatus: string(payment.Status), PaymentMethod: "razorpay", Amount: int64(math.Round(payment.Amount * 100)), Currency: payment.Currency, RazorpayOrderID: payment.RazorpayOrderID, RazorpayKeyID: s.razorpayKeyID}, nil
}

func (s *OrderService) CancelOrder(userID, orderID int) error {
	return s.orderRepo.CancelOrder(userID, orderID)
}

func (s *OrderService) RequestReturn(userID, orderID int) error {
	return s.orderRepo.RequestReturn(userID, orderID)
}

func (s *OrderService) GetAdminOrders(page, pageSize int, search, status, paymentStatus string) (*dto.AdminOrderList, error) {
	return s.orderRepo.GetAdminOrders(page, pageSize, search, status, paymentStatus)
}

func (s *OrderService) UpdateOrderStatus(orderID int, newStatus string) error {
	return s.orderRepo.UpdateOrderStatus(orderID, newStatus)
}

func (s *OrderService) GetAdminReport() (*dto.AdminReport, error) {
	return s.orderRepo.GetAdminReport()
}

func (s *OrderService) VerifyPayment(ctx context.Context, userID, orderID int, req dto.VerifyPaymentRequest) (*dto.VerifyPaymentResponse, error) {
	payment, err := s.orderRepo.GetPaymentForVerification(userID, orderID)
	if err != nil {
		return nil, err
	}
	if payment.Status != models.PaymentPending && payment.Status != models.PaymentSuccess {
		return nil, errors.New("payment is not pending")
	}
	if payment.RazorpayOrderID == "" || payment.RazorpayOrderID != req.RazorpayOrderID {
		return nil, errors.New("Razorpay order does not match")
	}
	if !verifyRazorpaySignature(s.razorpaySecret, req.RazorpayOrderID, req.RazorpayPaymentID, req.RazorpaySignature) {
		return nil, errors.New("invalid Razorpay signature")
	}
	remotePayment, err := s.razorpay.GetPayment(ctx, req.RazorpayPaymentID)
	if err != nil {
		return nil, fmt.Errorf("fetch Razorpay payment: %w", err)
	}
	if remotePayment.OrderID != req.RazorpayOrderID || remotePayment.Amount != int64(math.Round(payment.Amount*100)) || remotePayment.Currency != payment.Currency {
		return nil, errors.New("Razorpay payment details do not match the order")
	}
	if remotePayment.Status != "captured" {
		return nil, errors.New("Razorpay payment has not been captured")
	}
	if err := s.orderRepo.CompletePayment(userID, orderID, payment.ID, req.RazorpayPaymentID, req.RazorpaySignature); err != nil {
		return nil, err
	}
	return &dto.VerifyPaymentResponse{OrderID: orderID, Status: string(models.OrderPlaced), PaymentStatus: string(models.PaymentSuccess)}, nil
}

func verifyRazorpaySignature(secret, orderID, paymentID, signature string) bool {
	provided, err := hex.DecodeString(signature)
	if err != nil {
		return false
	}
	mac := hmac.New(sha256.New, []byte(secret))
	_, _ = mac.Write([]byte(orderID + "|" + paymentID))
	return hmac.Equal(provided, mac.Sum(nil))
}
