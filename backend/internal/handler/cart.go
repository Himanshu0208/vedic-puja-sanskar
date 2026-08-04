package handler

import (
	"encoding/json"
	"net/http"

	"github.com/Himanshu0208/vedic-puja-sanskar/backend/internal/dto"
	"github.com/Himanshu0208/vedic-puja-sanskar/backend/internal/service"
	"github.com/Himanshu0208/vedic-puja-sanskar/backend/pkg/jwt"
	"github.com/Himanshu0208/vedic-puja-sanskar/backend/pkg/utils"
	"github.com/go-playground/form/v4"
	"github.com/go-playground/validator/v10"
)

type CartHandler struct {
	cartService *service.CartService
	validate    *validator.Validate
	formDecoder *form.Decoder
}

func NewCartHandler(cartService *service.CartService, validate *validator.Validate) *CartHandler {
	formDecoder := form.NewDecoder()
	return &CartHandler{
		cartService: cartService,
		validate:    validate,
		formDecoder: formDecoder,
	}
}

func (h *CartHandler) GetCart(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		utils.WriteError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	claims, isAuthorized := r.Context().Value("claims").(*jwt.Claims)
	if !isAuthorized {
		utils.WriteError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	cart, err := h.cartService.GetCart(claims.UserID)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.WriteJSON(w, http.StatusOK, cart)
}

func (h *CartHandler) AddToCart(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		utils.WriteError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	claims, isAuthorized := r.Context().Value("claims").(*jwt.Claims)
	if !isAuthorized {
		utils.WriteError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var req dto.AddItemToCartRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	defer r.Body.Close()

	if err := h.validate.Struct(req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	cartItemResponse, err := h.cartService.AddToCart(claims.UserID, req.ProductID, req.Quantity)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.WriteJSON(w, http.StatusOK, cartItemResponse)
}

func (h *CartHandler) RemoveFromCart(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		utils.WriteError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	claims, isAuthorized := r.Context().Value("claims").(*jwt.Claims)
	if !isAuthorized {
		utils.WriteError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var req dto.AddItemToCartRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	defer r.Body.Close()

	if err := h.validate.Struct(req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	cartItemResponse, err := h.cartService.RemoveFromCart(claims.UserID, req.ProductID)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.WriteJSON(w, http.StatusOK, cartItemResponse)
}
