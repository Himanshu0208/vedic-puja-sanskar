package handler

import (
	"encoding/json"
	"net/http"

	"github.com/Himanshu0208/vedic-puja-sanskar/backend/internal/service"
	"github.com/Himanshu0208/vedic-puja-sanskar/backend/pkg/jwt"
	"github.com/Himanshu0208/vedic-puja-sanskar/backend/pkg/utils"
	"github.com/go-playground/form/v4"
	"github.com/go-playground/validator/v10"
	"github.com/Himanshu0208/vedic-puja-sanskar/backend/internal/dto"

)

type OrderHandler struct {
	orderService *service.OrderService
	validate     *validator.Validate
	formDecoder *form.Decoder
}

func NewOrderHandler(orderService *service.OrderService, validate *validator.Validate) *OrderHandler {
	formDecoder := form.NewDecoder()
	return &OrderHandler{
		orderService: orderService,
		validate:     validate,
		formDecoder:  formDecoder,
	}
}

func (h *OrderHandler) CreateOrder(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		utils.WriteError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	claims, isAuthorized := r.Context().Value("claims").(*jwt.Claims)
	if !isAuthorized {
		utils.WriteError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var orderRequest dto.OrderRequest
	err := json.NewDecoder(r.Body).Decode(&orderRequest)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	err = h.validate.Struct(orderRequest)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	orderResponse, err := h.orderService.CreateOrder(claims.UserID, orderRequest)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.WriteJSON(w, http.StatusCreated, orderResponse)
}