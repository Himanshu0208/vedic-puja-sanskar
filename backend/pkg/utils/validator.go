package utils

import (
	"github.com/Himanshu0208/vedic-puja-sanskar/backend/internal/dto"

	"github.com/go-playground/validator/v10"
)

func ValidateImageFields(sl validator.StructLevel) {
	req := sl.Current().Interface().(dto.UpdateProductRequest)

	hasImage := req.Image != nil
	hasImagePath := req.ImagePath != nil && *req.ImagePath != ""
	hasImageURL := req.ImageURL != nil && *req.ImageURL != ""

	if !hasImage && !(hasImagePath && hasImageURL) {
		sl.ReportError(req.Image, "Image", "image", "imageOrPathUrl", "")
	}
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