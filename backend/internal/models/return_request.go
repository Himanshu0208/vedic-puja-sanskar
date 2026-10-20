package models

import "time"

type ReturnRequestStatus string

const (
	ReturnRequestPending  ReturnRequestStatus = "PENDING"
	ReturnRequestApproved ReturnRequestStatus = "APPROVED"
	ReturnRequestRejected ReturnRequestStatus = "REJECTED"
)

type ReturnRequest struct {
	ID           int
	OrderID      int
	UserID       int
	Description  string
	MediaURLs    []string
	Status       ReturnRequestStatus
	AdminRemarks *string
	CreatedAt    time.Time
	UpdatedAt    time.Time
}
