package handler

import (
	"encoding/json"
	"io"
	"net/http"
	"strconv"
	"strings"

	"github.com/Himanshu0208/vedic-puja-sanskar/backend/internal/service"
	"github.com/Himanshu0208/vedic-puja-sanskar/backend/pkg/jwt"
	"github.com/Himanshu0208/vedic-puja-sanskar/backend/pkg/utils"
)

type AdminHandler struct {
	authService  *service.AuthService
	orderService *service.OrderService
}

func NewAdminHandler(authService *service.AuthService, orderService *service.OrderService) *AdminHandler {
	return &AdminHandler{authService: authService, orderService: orderService}
}

func adminClaims(w http.ResponseWriter, r *http.Request) (*jwt.Claims, bool) {
	claims, ok := r.Context().Value("claims").(*jwt.Claims)
	if !ok || claims == nil || claims.Role != "admin" {
		utils.WriteError(w, http.StatusForbidden, "admin access required")
		return nil, false
	}
	return claims, true
}

func (h *AdminHandler) Users(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		utils.WriteError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	if _, ok := adminClaims(w, r); !ok {
		return
	}
	page, pageSize := pagination(r, 25)
	users, err := h.authService.GetAdminUsers(page, pageSize, r.URL.Query().Get("search"))
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "could not load users")
		return
	}
	utils.WriteJSON(w, http.StatusOK, users)
}

func (h *AdminHandler) Orders(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		utils.WriteError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	if _, ok := adminClaims(w, r); !ok {
		return
	}
	page, pageSize := pagination(r, 25)
	orders, err := h.orderService.GetAdminOrders(page, pageSize, r.URL.Query().Get("search"), r.URL.Query().Get("status"), r.URL.Query().Get("paymentStatus"))
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "could not load orders")
		return
	}
	utils.WriteJSON(w, http.StatusOK, orders)
}

func (h *AdminHandler) OrderAction(w http.ResponseWriter, r *http.Request) {
	if _, ok := adminClaims(w, r); !ok {
		return
	}
	const prefix = "/api/v1/admin/orders/"
	trimmed := strings.TrimPrefix(r.URL.Path, prefix)
	trimmed = strings.Trim(trimmed, "/")
	parts := strings.Split(trimmed, "/")
	if len(parts) != 2 {
		utils.WriteError(w, http.StatusNotFound, "not found")
		return
	}
	orderID, err := strconv.Atoi(parts[0])
	if err != nil || orderID < 1 {
		utils.WriteError(w, http.StatusBadRequest, "invalid order ID")
		return
	}
	action := parts[1]
	if action != "status" {
		utils.WriteError(w, http.StatusNotFound, "not found")
		return
	}
	if r.Method != http.MethodPatch && r.Method != http.MethodPut && r.Method != http.MethodPost {
		utils.WriteError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	var body struct {
		Status string `json:"status"`
	}
	if err := json.NewDecoder(io.LimitReader(r.Body, 1<<20)).Decode(&body); err != nil || strings.TrimSpace(body.Status) == "" {
		utils.WriteError(w, http.StatusBadRequest, "valid status is required")
		return
	}
	if err := h.orderService.UpdateOrderStatus(orderID, body.Status); err != nil {
		status := http.StatusConflict
		if strings.Contains(err.Error(), "not found") {
			status = http.StatusNotFound
		}
		utils.WriteError(w, status, err.Error())
		return
	}
	utils.WriteJSON(w, http.StatusOK, map[string]any{"orderId": orderID, "status": strings.ToUpper(strings.TrimSpace(body.Status))})
}

func (h *AdminHandler) Reports(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		utils.WriteError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	if _, ok := adminClaims(w, r); !ok {
		return
	}
	report, err := h.orderService.GetAdminReport()
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "could not load report data")
		return
	}
	utils.WriteJSON(w, http.StatusOK, report)
}
