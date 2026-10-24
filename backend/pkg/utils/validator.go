package utils

import (
	"regexp"

	"github.com/go-playground/validator/v10"
)

var indiaPhonePattern = regexp.MustCompile(`^\+91[6-9][0-9]{9}$`)

func ValidateIndiaPhone(fl validator.FieldLevel) bool {
	return indiaPhonePattern.MatchString(fl.Field().String())
}

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
