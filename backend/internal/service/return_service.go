package service

import (
	"context"
	"fmt"
	"strings"

	"github.com/Himanshu0208/vedic-puja-sanskar/backend/internal/dto"
	"github.com/Himanshu0208/vedic-puja-sanskar/backend/internal/repository"
)

type ReturnService struct {
	repo     *repository.ReturnRepository
	razorpay *RazorpayClient
}

func NewReturnService(repo *repository.ReturnRepository, razorpay *RazorpayClient) *ReturnService {
	return &ReturnService{repo: repo, razorpay: razorpay}
}

func (s *ReturnService) CreateReturnRequest(userID, orderID int, reason, description string, mediaURLs []string) error {
	switch reason {
	case "Damaged or defective", "Wrong item received", "Item missing parts", "Quality not as expected", "No longer needed", "Other":
	default:
		return fmt.Errorf("invalid return reason")
	}
	return s.repo.CreateReturnRequest(userID, orderID, reason, description, mediaURLs)
}

func (s *ReturnService) GetAdminReturnRequests(page, pageSize int, status string) (*dto.AdminReturnList, error) {
	return s.repo.GetAdminReturnRequests(page, pageSize, status)
}

func (s *ReturnService) ReviewReturnRequest(returnID int, approved bool, remarks string) error {
	remarks = strings.TrimSpace(remarks)
	if remarks == "" {
		return fmt.Errorf("admin remarks are required")
	}
	return s.repo.ReviewReturnRequest(returnID, approved, remarks)
}

func (s *ReturnService) ProcessReturnRefund(ctx context.Context, returnID int) error {
	if s.razorpay == nil {
		return fmt.Errorf("Razorpay refund is not configured")
	}
	return s.repo.ProcessReturnRefund(ctx, returnID, s.razorpay.RefundPayment)
}

func (s *ReturnService) RecordCODRefund(returnID int, reference string) error {
	reference = strings.TrimSpace(reference)
	if reference == "" {
		return fmt.Errorf("refund reference is required")
	}
	return s.repo.RecordCODRefund(returnID, reference)
}
