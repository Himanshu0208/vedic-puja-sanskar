package handler

import (
	"encoding/json"
	"io"
	"net/http"
	"strconv"
	"strings"

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

	setAuthCookies(w, r, response)
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

	setAuthCookies(w, r, response)
	utils.WriteJSON(w, http.StatusOK, response)
}

func setAuthCookies(w http.ResponseWriter, r *http.Request, response *dto.AuthResponse) {
	secure := r.TLS != nil || strings.EqualFold(r.Header.Get("X-Forwarded-Proto"), "https")
	http.SetCookie(w, &http.Cookie{Name: "access_token", Value: response.AccessToken, HttpOnly: true, Secure: secure, SameSite: http.SameSiteLaxMode, Path: "/", MaxAge: response.AccessTokenExpiresIn})
	http.SetCookie(w, &http.Cookie{Name: "refresh_token", Value: response.RefreshToken, HttpOnly: true, Secure: secure, SameSite: http.SameSiteLaxMode, Path: "/", MaxAge: response.RefreshTokenExpiresIn})
}

// GetProfile returns the current user's profile (protected endpoint)
func (h *AuthHandler) GetProfile(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodPut {
		h.UpdateProfile(w, r)
		return
	}
	if r.Method != http.MethodGet {
		utils.WriteError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	claims, ok := r.Context().Value("claims").(*jwt.Claims)
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	response, err := h.authService.GetProfile(claims.UserID)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "could not load profile")
		return
	}
	utils.WriteJSON(w, http.StatusOK, response)
}

func (h *AuthHandler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		utils.WriteError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	claims, ok := r.Context().Value("claims").(*jwt.Claims)
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	var req dto.UpdateProfileRequest
	if err := json.NewDecoder(io.LimitReader(r.Body, 1<<20)).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if err := h.validate.Struct(req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}
	profile, err := h.authService.UpdateProfile(claims.UserID, req)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "could not update profile")
		return
	}
	utils.WriteJSON(w, http.StatusOK, profile)
}

func (h *AuthHandler) Wishlist(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value("claims").(*jwt.Claims)
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	switch r.Method {
	case http.MethodGet:
		ids, err := h.authService.GetWishlist(claims.UserID)
		if err != nil {
			utils.WriteError(w, http.StatusInternalServerError, "could not load wishlist")
			return
		}
		utils.WriteJSON(w, http.StatusOK, ids)
	case http.MethodPost:
		var req dto.WishlistRequest
		if err := json.NewDecoder(io.LimitReader(r.Body, 1<<20)).Decode(&req); err != nil {
			utils.WriteError(w, http.StatusBadRequest, "invalid request body")
			return
		}
		if err := h.validate.Struct(req); err != nil {
			utils.WriteError(w, http.StatusBadRequest, err.Error())
			return
		}
		if err := h.authService.AddWishlist(claims.UserID, req.ProductID); err != nil {
			utils.WriteError(w, http.StatusBadRequest, "could not add product to wishlist")
			return
		}
		utils.WriteJSON(w, http.StatusCreated, map[string]int{"productId": req.ProductID})
	case http.MethodDelete:
		productID, err := strconv.Atoi(r.URL.Query().Get("productId"))
		if err != nil || productID < 1 {
			utils.WriteError(w, http.StatusBadRequest, "valid productId is required")
			return
		}
		if err := h.authService.RemoveWishlist(claims.UserID, productID); err != nil {
			utils.WriteError(w, http.StatusInternalServerError, "could not remove product from wishlist")
			return
		}
		w.WriteHeader(http.StatusNoContent)
	default:
		utils.WriteError(w, http.StatusMethodNotAllowed, "method not allowed")
	}
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

	response, err := h.authService.RefreshToken(refresh_token.Value, claims)
	if err != nil {
		utils.WriteError(w, http.StatusUnauthorized, "could not refresh session")
		return
	}

	setAuthCookies(w, r, response)
	utils.WriteJSON(w, http.StatusOK, response)
}
