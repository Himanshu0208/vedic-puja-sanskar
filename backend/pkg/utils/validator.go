package utils

import (
	"errors"
	"regexp"
)

const (
	minPasswordLength = 6
	maxPasswordLength = 100
)

var emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)

// ValidateEmail validates an email address
func ValidateEmail(email string) error {
	if email == "" {
		return errors.New("email is required")
	}
	if len(email) > 255 {
		return errors.New("email is too long")
	}
	if !emailRegex.MatchString(email) {
		return errors.New("invalid email format")
	}
	return nil
}

// ValidatePassword validates a password
func ValidatePassword(password string) error {
	if password == "" {
		return errors.New("password is required")
	}
	if len(password) < minPasswordLength {
		return errors.New("password must be at least 6 characters long")
	}
	if len(password) > maxPasswordLength {
		return errors.New("password is too long")
	}
	return nil
}
