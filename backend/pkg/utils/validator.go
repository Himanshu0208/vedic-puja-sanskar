package utils

import (
	"github.com/go-playground/validator/v10"
)

func ValidateStrongPassword(fl validator.FieldLevel) bool {
	password := fl.Field().String()

	var (
		hasMinLen  = len(password) >= 8
		hasUpper   = false
		hasLower   = false
		hasNumber  = false
		hasSpecial = false
	)

	for _, ch := range password {
		switch {
		case 'A' <= ch && ch <= 'Z':
			hasUpper = true
		case 'a' <= ch && ch <= 'z':
			hasLower = true
		case '0' <= ch && ch <= '9':
			hasNumber = true
		default:
			hasSpecial = true
		}
	}

	return hasMinLen && hasUpper && hasLower && hasNumber && hasSpecial
}
