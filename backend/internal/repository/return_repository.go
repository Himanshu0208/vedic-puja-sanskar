package repository

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/Himanshu0208/vedic-puja-sanskar/backend/internal/dto"
	"github.com/Himanshu0208/vedic-puja-sanskar/backend/internal/models"
	"github.com/lib/pq"
)

type ReturnRepository struct {
	db *sql.DB
}

func NewReturnRepository(db *sql.DB) *ReturnRepository {
	return &ReturnRepository{db: db}
}

// CreateReturnRequest inserts into return_requests and marks order.return_status.
func (r *ReturnRepository) CreateReturnRequest(userID, orderID int, reason, description string, mediaURLs []string) error {
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	result, err := tx.Exec(
		`UPDATE orders SET return_status='RETURN_REQUESTED', updated_at=NOW()
		 WHERE id=$1 AND user_id=$2 AND status='DELIVERED' AND delivered_at >= NOW() - INTERVAL '7 days' AND return_status IS NULL`,
		orderID, userID,
	)
	if err != nil {
		return err
	}
	if n, _ := result.RowsAffected(); n != 1 {
		return errors.New("return is not available for this order")
	}

	if mediaURLs == nil {
		mediaURLs = []string{}
	}
	_, err = tx.Exec(
		`INSERT INTO return_requests (order_id, user_id, reason, description, media_urls)
		 VALUES ($1,$2,$3,$4,$5)`,
		orderID, userID, reason, description, pq.Array(mediaURLs),
	)
	if err != nil {
		return fmt.Errorf("save return request: %w", err)
	}
	return tx.Commit()
}

// GetAdminReturnRequests returns paginated return requests for admin.
func (r *ReturnRepository) GetAdminReturnRequests(page, pageSize int, status string) (*dto.AdminReturnList, error) {
	filter := ""
	countJoin := ""
	args := []any{}
	argIdx := 1

	if status == "REFUND_DUE" {
		filter = ` WHERE rr.status='APPROVED' AND COALESCE(p.refund_id,'')='' AND rr.refund_processed_at IS NULL`
		countJoin = ` LEFT JOIN payments p ON p.order_id=rr.order_id`
	} else if status != "" && status != "all" {
		filter = fmt.Sprintf(" WHERE rr.status=$%d", argIdx)
		args = append(args, strings.ToUpper(status))
		argIdx++
	}

	result := &dto.AdminReturnList{Page: page, PageSize: pageSize, Returns: make([]dto.AdminReturn, 0)}

	countQuery := "SELECT COUNT(*) FROM return_requests rr" + countJoin + filter
	if err := r.db.QueryRow(countQuery, args...).Scan(&result.Total); err != nil {
		return nil, err
	}
	result.TotalPages = (result.Total + pageSize - 1) / pageSize

	args = append(args, pageSize, (page-1)*pageSize)
	rows, err := r.db.Query(fmt.Sprintf(`
		SELECT rr.id, rr.order_id, o.total_amount, o.currency, rr.user_id, u.email, rr.description, rr.reason,
		       rr.media_urls, rr.status, COALESCE(rr.admin_remarks,''), rr.created_at,
	       COALESCE(p.method,''), COALESCE(p.status,''), COALESCE(p.refund_id,''),
	       COALESCE(rr.manual_refund_reference,''), rr.received_at, rr.refund_processed_at
		FROM return_requests rr
		JOIN orders o ON o.id=rr.order_id
		JOIN users u ON u.id=rr.user_id
		LEFT JOIN payments p ON p.order_id=rr.order_id
		%s
		ORDER BY rr.created_at DESC
		LIMIT $%d OFFSET $%d`, filter, argIdx, argIdx+1), args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var ret dto.AdminReturn
		var mediaURLs pq.StringArray
		var receivedAt sql.NullTime
		var refundProcessedAt sql.NullTime
		if err := rows.Scan(&ret.ID, &ret.OrderID, &ret.Amount, &ret.Currency, &ret.UserID, &ret.CustomerEmail,
			&ret.Description, &ret.Reason, &mediaURLs, &ret.Status, &ret.AdminRemarks, &ret.CreatedAt,
			&ret.PaymentMethod, &ret.PaymentStatus, &ret.RefundID, &ret.RefundReference, &receivedAt, &refundProcessedAt); err != nil {
			return nil, err
		}
		ret.MediaURLs = []string(mediaURLs)
		if receivedAt.Valid {
			ret.ReceivedAt = &receivedAt.Time
		}
		if refundProcessedAt.Valid {
			ret.RefundProcessedAt = &refundProcessedAt.Time
		}
		result.Returns = append(result.Returns, ret)
	}
	return result, rows.Err()
}

func (r *ReturnRepository) ProcessReturnRefund(ctx context.Context, returnID int, refund func(context.Context, string, int) (string, error)) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	var orderID int
	var status string
	if err := tx.QueryRowContext(ctx, `SELECT order_id, status FROM return_requests WHERE id=$1 FOR UPDATE`, returnID).Scan(&orderID, &status); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return errors.New("return request not found")
		}
		return err
	}
	if status != "APPROVED" {
		return errors.New("return must be approved before refunding")
	}
	var method, paymentStatus, paymentID, refundID string
	err = tx.QueryRowContext(ctx, `SELECT method, status, COALESCE(razorpay_payment_id,''), COALESCE(refund_id,'') FROM payments WHERE order_id=$1 FOR UPDATE`, orderID).Scan(&method, &paymentStatus, &paymentID, &refundID)
	if err != nil {
		return err
	}
	if method != "RAZORPAY" || paymentStatus != "success" || paymentID == "" {
		return errors.New("refund requires a successful Razorpay payment")
	}
	if _, err := tx.ExecContext(ctx, `UPDATE return_requests SET received_at=COALESCE(received_at,NOW()), updated_at=NOW() WHERE id=$1`, returnID); err != nil {
		return err
	}
	if refundID == "" {
		refundID, err = refund(ctx, paymentID, returnID)
		if err != nil {
			return errors.Join(fmt.Errorf("issue Razorpay refund: %w", err), tx.Commit())
		}
		if refundID == "" {
			return errors.New("Razorpay returned an empty refund ID")
		}
		if _, err := tx.ExecContext(ctx, `UPDATE payments SET refund_id=$1, updated_at=NOW() WHERE order_id=$2`, refundID, orderID); err != nil {
			return err
		}
	}
	if _, err := tx.ExecContext(ctx, `UPDATE return_requests SET refund_processed_at=COALESCE(refund_processed_at,NOW()), updated_at=NOW() WHERE id=$1`, returnID); err != nil {
		return err
	}
	return tx.Commit()
}

func (r *ReturnRepository) RecordCODRefund(returnID int, reference string) error {
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	var orderID int
	var status string
	var processedAt sql.NullTime
	if err := tx.QueryRow(`SELECT order_id, status, refund_processed_at FROM return_requests WHERE id=$1 FOR UPDATE`, returnID).Scan(&orderID, &status, &processedAt); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return errors.New("return request not found")
		}
		return err
	}
	if status != "APPROVED" {
		return errors.New("return must be approved before refunding")
	}
	if processedAt.Valid {
		return errors.New("refund has already been recorded")
	}
	var method, paymentStatus string
	if err := tx.QueryRow(`SELECT method, status FROM payments WHERE order_id=$1 FOR UPDATE`, orderID).Scan(&method, &paymentStatus); err != nil {
		return err
	}
	if method != "COD" || paymentStatus != "success" {
		return errors.New("manual refund requires a successful COD payment")
	}
	if _, err := tx.Exec(`UPDATE return_requests SET received_at=COALESCE(received_at,NOW()), manual_refund_reference=$1, refund_processed_at=NOW(), updated_at=NOW() WHERE id=$2`, reference, returnID); err != nil {
		return err
	}
	return tx.Commit()
}

// ReviewReturnRequest approves or rejects a return request with mandatory remarks.
func (r *ReturnRepository) ReviewReturnRequest(returnID int, approved bool, remarks string) error {
	newStatus := "REJECTED"
	orderReturnStatus := string(models.ReturnRejected)
	if approved {
		newStatus = "APPROVED"
		orderReturnStatus = string(models.ReturnApproved)
	}

	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	var orderID int
	var currentStatus string
	err = tx.QueryRow(
		`SELECT order_id, status FROM return_requests WHERE id=$1 FOR UPDATE`,
		returnID,
	).Scan(&orderID, &currentStatus)
	if errors.Is(err, sql.ErrNoRows) {
		return errors.New("return request not found")
	}
	if err != nil {
		return err
	}
	if currentStatus != "PENDING" {
		return errors.New("return request has already been reviewed")
	}
	_, err = tx.Exec(
		`UPDATE return_requests SET status=$1, admin_remarks=$2, updated_at=$3 WHERE id=$4`,
		newStatus, remarks, time.Now(), returnID,
	)
	if err != nil {
		return err
	}
	_, err = tx.Exec(
		`UPDATE orders SET return_status=$1, updated_at=NOW() WHERE id=$2`,
		orderReturnStatus, orderID,
	)
	if err != nil {
		return err
	}
	return tx.Commit()
}
