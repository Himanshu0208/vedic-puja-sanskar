package repository

import (
	"database/sql"
	"errors"
	"time"

	"github.com/Himanshu0208/vedic-puja-sanskar/backend/internal/models"
	"github.com/lib/pq"
)

var ErrInvalidSignupCode = errors.New("invalid or expired verification code")
var ErrEmailAlreadyRegistered = errors.New("an account with this email already exists")
var ErrPhoneAlreadyRegistered = errors.New("an account with this phone number already exists")

func (ur *UserRepository) PhoneExists(phone string, exceptUserID int) bool {
	var exists bool
	err := ur.db.QueryRow(`SELECT EXISTS(SELECT 1 FROM users WHERE id <> $2 AND
		CASE WHEN LENGTH(REGEXP_REPLACE(phone, '[^0-9]', '', 'g')) = 10 THEN '91' || REGEXP_REPLACE(phone, '[^0-9]', '', 'g') ELSE REGEXP_REPLACE(phone, '[^0-9]', '', 'g') END =
		CASE WHEN LENGTH(REGEXP_REPLACE($1, '[^0-9]', '', 'g')) = 10 THEN '91' || REGEXP_REPLACE($1, '[^0-9]', '', 'g') ELSE REGEXP_REPLACE($1, '[^0-9]', '', 'g') END)`, phone, exceptUserID).Scan(&exists)
	return err == nil && exists
}

func mapContactUniqueError(err error) error {
	var pqErr *pq.Error
	if errors.As(err, &pqErr) && pqErr.Code == "23505" {
		switch pqErr.Constraint {
		case "idx_users_email_normalized":
			return ErrEmailAlreadyRegistered
		case "idx_users_phone_normalized":
			return ErrPhoneAlreadyRegistered
		}
	}
	return err
}

func (ur *UserRepository) SavePendingSignup(user *models.User, codeHash string, expiresAt time.Time) error {
	result, err := ur.db.Exec(`INSERT INTO pending_signups (email, full_name, phone, gender, password_hash, code_hash, expires_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7)
		ON CONFLICT (email) DO UPDATE SET full_name=$2, phone=$3, gender=$4, password_hash=$5, code_hash=$6, expires_at=$7, attempts=0, created_at=CURRENT_TIMESTAMP
		WHERE pending_signups.created_at < CURRENT_TIMESTAMP - INTERVAL '60 seconds' OR pending_signups.expires_at < CURRENT_TIMESTAMP`,
		user.Email, user.FullName, user.Phone, user.Gender, user.Password, codeHash, expiresAt)
	if err != nil {
		return err
	}
	count, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if count == 0 {
		return errors.New("a verification code was recently sent; wait a minute before requesting another")
	}
	return nil
}

func (ur *UserRepository) VerifyPendingSignup(email, codeHash string, now time.Time) (*models.User, error) {
	tx, err := ur.db.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()
	user := &models.User{}
	var storedHash string
	var expiresAt time.Time
	var attempts int
	err = tx.QueryRow(`SELECT full_name, phone, gender, password_hash, code_hash, expires_at, attempts FROM pending_signups WHERE email=$1 FOR UPDATE`, email).
		Scan(&user.FullName, &user.Phone, &user.Gender, &user.Password, &storedHash, &expiresAt, &attempts)
	if err == sql.ErrNoRows {
		return nil, ErrInvalidSignupCode
	}
	if err != nil {
		return nil, err
	}
	if now.After(expiresAt) || attempts >= 5 {
		_, _ = tx.Exec(`DELETE FROM pending_signups WHERE email=$1`, email)
		_ = tx.Commit()
		return nil, ErrInvalidSignupCode
	}
	if storedHash != codeHash {
		_, _ = tx.Exec(`UPDATE pending_signups SET attempts=attempts+1 WHERE email=$1`, email)
		_ = tx.Commit()
		return nil, ErrInvalidSignupCode
	}
	user.Email = email
	err = tx.QueryRow(`INSERT INTO users (email, password, is_admin, full_name, phone, gender) VALUES ($1,$2,false,$3,$4,$5) RETURNING id, created_at`,
		user.Email, user.Password, user.FullName, user.Phone, user.Gender).Scan(&user.ID, &user.CreatedAt)
	if err != nil {
		return nil, mapContactUniqueError(err)
	}
	if _, err = tx.Exec(`DELETE FROM pending_signups WHERE email=$1`, email); err != nil {
		return nil, err
	}
	if err = tx.Commit(); err != nil {
		return nil, err
	}
	user.Role = models.RoleUser
	return user, nil
}
