package handler

import (
	"encoding/json"
	"net/http"

	"github.com/Himanshu0208/vedic-puja-sanskar/backend/internal/dto"
	"github.com/Himanshu0208/vedic-puja-sanskar/backend/internal/service"
	"github.com/Himanshu0208/vedic-puja-sanskar/backend/pkg/jwt"
	"github.com/Himanshu0208/vedic-puja-sanskar/backend/pkg/utils"
	"github.com/go-playground/validator/v10"
)

// AuthHandler handles authentication endpoints
type AuthHandler struct {
	authService *service.AuthService
	validate    *validator.Validate
}

// NewAuthHandler creates a new auth handler
func NewAuthHandler(authService *service.AuthService, validate *validator.Validate) *AuthHandler {
	return &AuthHandler{
		authService: authService,
		validate:    validate,
	}
}

// Signup handles user registration
func (h *AuthHandler) Signup(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		utils.WriteError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	var req dto.SignupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	defer r.Body.Close()

	if err := h.validate.Struct(req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	response, err := h.authService.Signup(&req)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	http.SetCookie(w, &http.Cookie{Name: "access_token", Value: response.AccessToken, HttpOnly: true, Secure: true, SameSite: http.SameSiteLaxMode, Path: "/", MaxAge: response.AccessTokenExpiresIn})
	http.SetCookie(w, &http.Cookie{Name: "refresh_token", Value: response.RefreshToken, HttpOnly: true, Secure: true, SameSite: http.SameSiteLaxMode, Path: "/", MaxAge: response.RefreshTokenExpiresIn})
	utils.WriteJSON(w, http.StatusCreated, response)
}

// Login handles user login
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		utils.WriteError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	var req dto.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	defer r.Body.Close()

	if err := h.validate.Struct(req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	response, err := h.authService.Login(&req)
	if err != nil {
		utils.WriteError(w, http.StatusUnauthorized, err.Error())
		return
	}

	http.SetCookie(w, &http.Cookie{Name: "access_token", Value: response.AccessToken, HttpOnly: true, Secure: true, SameSite: http.SameSiteLaxMode, Path: "/", MaxAge: response.AccessTokenExpiresIn})
	http.SetCookie(w, &http.Cookie{Name: "refresh_token", Value: response.RefreshToken, HttpOnly: true, Secure: true, SameSite: http.SameSiteLaxMode, Path: "/", MaxAge: response.RefreshTokenExpiresIn})
	utils.WriteJSON(w, http.StatusOK, response)
}

// GetProfile returns the current user's profile (protected endpoint)
func (h *AuthHandler) GetProfile(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		utils.WriteError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	claims, ok := r.Context().Value("claims").(*jwt.Claims)
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	response := map[string]interface{}{
		"id":    claims.UserID,
		"email": claims.Email,
	}

	utils.WriteJSON(w, http.StatusOK, response)
}

func (h *AuthHandler) RefreshAuthToken(w http.ResponseWriter, r *http.Request) {
	refresh_token, err := r.Cookie("refresh_token")
	if err != nil {
		utils.WriteError(w, http.StatusUnauthorized, "unauthorized from middleware")
		return
	}

	claims, err := h.authService.VerifyToken(refresh_token.Value)
	if err != nil {
		utils.WriteError(w, http.StatusUnauthorized, "invalid or expired token")
		return
	}

	response, err := h.authService.RefreshToken(refresh_token.Value ,claims);
	
	http.SetCookie(w, &http.Cookie{Name: "access_token", Value: response.AccessToken, HttpOnly: true, Secure: true, SameSite: http.SameSiteLaxMode, Path: "/", MaxAge: response.AccessTokenExpiresIn})
	http.SetCookie(w, &http.Cookie{Name: "refresh_token", Value: response.RefreshToken, HttpOnly: true, Secure: true, SameSite: http.SameSiteLaxMode, Path: "/", MaxAge: response.RefreshTokenExpiresIn})
	utils.WriteJSON(w, http.StatusOK, response);
}