package handler

import (
	"net/http"

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
	users, err := h.authService.GetAdminUsers()
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
	orders, err := h.orderService.GetAdminOrders()
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "could not load orders")
		return
	}
	utils.WriteJSON(w, http.StatusOK, orders)
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
