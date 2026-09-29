package handler

import (
	"database/sql"
	"encoding/json"
	"errors"
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

type OrderHandler struct {
	orderService *service.OrderService
	validate     *validator.Validate
}

func NewOrderHandler(orderService *service.OrderService, validate *validator.Validate) *OrderHandler {
	return &OrderHandler{orderService: orderService, validate: validate}
}

func (h *OrderHandler) CreateOrder(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		utils.WriteError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	claims, ok := r.Context().Value("claims").(*jwt.Claims)
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	var req dto.OrderRequest
	decoder := json.NewDecoder(io.LimitReader(r.Body, 1<<20))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if err := h.validate.Struct(req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}
	if (req.ShippingAddressID == nil) == (req.ShippingAddress == nil) || (req.ShippingAddressID != nil && *req.ShippingAddressID < 1) {
		utils.WriteError(w, http.StatusBadRequest, "provide either shippingAddressId or shippingAddress")
		return
	}
	if req.ProductID != nil && *req.ProductID < 1 {
		utils.WriteError(w, http.StatusBadRequest, "invalid product id")
		return
	}
	if req.ShippingAddress != nil {
		if err := h.validate.Struct(req.ShippingAddress); err != nil {
			utils.WriteError(w, http.StatusBadRequest, err.Error())
			return
		}
	}
	response, err := h.orderService.CreateOrder(r.Context(), claims.UserID, req)
	if err != nil {
		status := http.StatusInternalServerError
		if strings.Contains(err.Error(), "Razorpay is not configured") {
			status = http.StatusServiceUnavailable
		} else if strings.Contains(err.Error(), "create Razorpay order") {
			status = http.StatusBadGateway
		}
		if strings.Contains(err.Error(), "cart is empty") {
			status = http.StatusBadRequest
		}
		if strings.Contains(err.Error(), "insufficient stock") {
			status = http.StatusConflict
		}
		if strings.Contains(err.Error(), "saved address not found") {
			status = http.StatusNotFound
		}
		if strings.Contains(err.Error(), "product not found") {
			status = http.StatusNotFound
		}
		utils.WriteError(w, status, err.Error())
		return
	}
	utils.WriteJSON(w, http.StatusCreated, response)
}

func (h *OrderHandler) Orders(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodPost {
		h.CreateOrder(w, r)
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
	page, pageSize := pagination(r, 10)
	orders, err := h.orderService.GetOrders(claims.UserID, page, pageSize)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "could not load orders")
		return
	}
	utils.WriteJSON(w, http.StatusOK, orders)
}

func (h *OrderHandler) GetAddresses(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodPut || r.Method == http.MethodDelete {
		h.AddressAction(w, r)
		return
	}
	claims, ok := r.Context().Value("claims").(*jwt.Claims)
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	switch r.Method {
	case http.MethodGet:
		addresses, err := h.orderService.GetAddresses(claims.UserID)
		if err != nil {
			utils.WriteError(w, http.StatusInternalServerError, "could not load addresses")
			return
		}
		utils.WriteJSON(w, http.StatusOK, addresses)
	case http.MethodPost:
		var address dto.ShippingAddress
		if err := json.NewDecoder(io.LimitReader(r.Body, 1<<20)).Decode(&address); err != nil {
			utils.WriteError(w, http.StatusBadRequest, "invalid request body")
			return
		}
		if err := h.validate.Struct(address); err != nil {
			utils.WriteError(w, http.StatusBadRequest, err.Error())
			return
		}
		created, err := h.orderService.CreateAddress(claims.UserID, address)
		if err != nil {
			utils.WriteError(w, http.StatusInternalServerError, "could not save address")
			return
		}
		utils.WriteJSON(w, http.StatusCreated, created)
	default:
		utils.WriteError(w, http.StatusMethodNotAllowed, "method not allowed")
	}
}

func (h *OrderHandler) AddressAction(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value("claims").(*jwt.Claims)
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	const prefix = "/api/v1/addresses/"
	id, err := strconv.Atoi(strings.TrimPrefix(r.URL.Path, prefix))
	if err != nil || id < 1 || r.URL.Path != prefix+strconv.Itoa(id) {
		utils.WriteError(w, http.StatusBadRequest, "invalid address ID")
		return
	}
	if r.Method == http.MethodDelete {
		if err := h.orderService.DeleteAddress(claims.UserID, id); err != nil {
			status := http.StatusInternalServerError
			if errors.Is(err, sql.ErrNoRows) {
				status = http.StatusNotFound
			}
			utils.WriteError(w, status, "could not delete address")
			return
		}
		w.WriteHeader(http.StatusNoContent)
		return
	}
	if r.Method != http.MethodPut {
		utils.WriteError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	var address dto.ShippingAddress
	if err := json.NewDecoder(io.LimitReader(r.Body, 1<<20)).Decode(&address); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if err := h.validate.Struct(address); err != nil {
		utils.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}
	updated, err := h.orderService.UpdateAddress(claims.UserID, id, address)
	if err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, sql.ErrNoRows) {
			status = http.StatusNotFound
		}
		utils.WriteError(w, status, "could not update address")
		return
	}
	utils.WriteJSON(w, http.StatusOK, updated)
}

func (h *OrderHandler) OrderAction(w http.ResponseWriter, r *http.Request) {
	if strings.HasSuffix(r.URL.Path, "/payment/verify") {
		h.VerifyPayment(w, r)
		return
	}
	claims, ok := r.Context().Value("claims").(*jwt.Claims)
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	const prefix = "/api/v1/orders/"
	parts := strings.Split(strings.TrimPrefix(r.URL.Path, prefix), "/")
	if len(parts) != 2 {
		utils.WriteError(w, http.StatusNotFound, "not found")
		return
	}
	orderID, err := strconv.Atoi(parts[0])
	if err != nil || orderID < 1 {
		utils.WriteError(w, http.StatusBadRequest, "invalid order ID")
		return
	}
	if r.Method != http.MethodPost {
		utils.WriteError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	switch parts[1] {
	case "cancel":
		err = h.orderService.CancelOrder(claims.UserID, orderID)
		if err == nil {
			utils.WriteJSON(w, http.StatusOK, dto.OrderActionResponse{OrderID: orderID, Status: "CANCELLED"})
			return
		}
	case "return":
		err = h.orderService.RequestReturn(claims.UserID, orderID)
		if err == nil {
			utils.WriteJSON(w, http.StatusOK, dto.OrderActionResponse{OrderID: orderID, Status: "RETURN_REQUESTED"})
			return
		}
	case "retry-payment":
		response, retryErr := h.orderService.RetryPayment(claims.UserID, orderID)
		if retryErr == nil {
			utils.WriteJSON(w, http.StatusOK, response)
			return
		}
		err = retryErr
	default:
		utils.WriteError(w, http.StatusNotFound, "not found")
		return
	}
	status := http.StatusConflict
	if strings.Contains(err.Error(), "not found") {
		status = http.StatusNotFound
	}
	utils.WriteError(w, status, err.Error())
}

func (h *OrderHandler) VerifyPayment(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		utils.WriteError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	claims, ok := r.Context().Value("claims").(*jwt.Claims)
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	const prefix = "/api/v1/orders/"
	const suffix = "/payment/verify"
	path := strings.TrimSuffix(strings.TrimPrefix(r.URL.Path, prefix), suffix)
	orderID, err := strconv.Atoi(path)
	if err != nil || orderID < 1 || r.URL.Path != prefix+strconv.Itoa(orderID)+suffix {
		utils.WriteError(w, http.StatusBadRequest, "invalid order ID")
		return
	}
	var req dto.VerifyPaymentRequest
	decoder := json.NewDecoder(io.LimitReader(r.Body, 1<<20))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if err := h.validate.Struct(req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}
	response, err := h.orderService.VerifyPayment(r.Context(), claims.UserID, orderID, req)
	if err != nil {
		status := http.StatusBadRequest
		if strings.Contains(err.Error(), "fetch Razorpay payment") {
			status = http.StatusBadGateway
		}
		utils.WriteError(w, status, err.Error())
		return
	}
	utils.WriteJSON(w, http.StatusOK, response)
}
