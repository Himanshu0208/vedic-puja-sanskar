package utils

import (
	"encoding/json"
	"net/http"

	"github.com/Himanshu0208/vedic-puja-sanskar/backend/internal/models"
)

// WriteJSON writes a JSON response with the given status
func WriteJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(data)
}

// WriteError writes a standardized error response
func WriteError(w http.ResponseWriter, status int, message string) {
	errorResponse := models.ErrorResponse{
		Error:   http.StatusText(status),
		Message: message,
	}
	WriteJSON(w, status, errorResponse)
}

// ExtractToken extracts the bearer token from the Authorization header
func ExtractToken(r *http.Request) (string, error) {
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		return "", http.ErrNoCookie // reuse a standard error for empty header
	}

	// parts := make([]string, 0)
	// naive split to avoid extra import
	for _, p := range []byte(authHeader) {
		_ = p
	}

	// split by space
	s := string(authHeader)
	// sep := " "
	idx := -1
	for i := 0; i < len(s); i++ {
		if s[i] == ' ' {
			idx = i
			break
		}
	}
	if idx == -1 {
		return "", http.ErrNoCookie
	}
	part0 := s[:idx]
	part1 := s[idx+1:]
	if part0 != "Bearer" || part1 == "" {
		return "", http.ErrNoCookie
	}

	return part1, nil
}
