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

type ReturnHandler struct {
	returnService *service.ReturnService
	uploadsDir    string
}

func NewReturnHandler(returnService *service.ReturnService, uploadsDir string) *ReturnHandler {
	return &ReturnHandler{returnService: returnService, uploadsDir: uploadsDir}
}

// POST /api/v1/orders/:id/return  (multipart/form-data: description, media[])
func (h *ReturnHandler) SubmitReturnRequest(w http.ResponseWriter, r *http.Request) {
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
	const suffix = "/return"
	path := strings.TrimSuffix(strings.TrimPrefix(r.URL.Path, prefix), suffix)
	orderID, err := strconv.Atoi(path)
	if err != nil || orderID < 1 {
		utils.WriteError(w, http.StatusBadRequest, "invalid order ID")
		return
	}

	// 10 MB max upload (ponytail: simple limit; increase when video support needed)
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "invalid multipart form")
		return
	}

	description := strings.TrimSpace(r.FormValue("description"))
	reason := strings.TrimSpace(r.FormValue("reason"))
	if reason == "" {
		utils.WriteError(w, http.StatusBadRequest, "return reason is required")
		return
	}
	if description == "" {
		utils.WriteError(w, http.StatusBadRequest, "description is required")
		return
	}

	var mediaURLs []string
	files := r.MultipartForm.File["media"]
	for _, fh := range files {
		f, err := fh.Open()
		if err != nil {
			utils.WriteError(w, http.StatusBadRequest, "could not read uploaded file")
			return
		}
		url, err := utils.SaveReturnMedia(f, fh, h.uploadsDir)
		f.Close()
		if err != nil {
			utils.WriteError(w, http.StatusBadRequest, err.Error())
			return
		}
		mediaURLs = append(mediaURLs, url)
	}

	if err := h.returnService.CreateReturnRequest(claims.UserID, orderID, reason, description, mediaURLs); err != nil {
		status := http.StatusConflict
		if strings.Contains(err.Error(), "not available") {
			status = http.StatusUnprocessableEntity
		}
		utils.WriteError(w, status, err.Error())
		return
	}
	utils.WriteJSON(w, http.StatusOK, map[string]any{"orderId": orderID, "status": "RETURN_REQUESTED"})
}

// GET /api/v1/admin/returns
func (h *ReturnHandler) AdminListReturns(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		utils.WriteError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	if _, ok := adminClaims(w, r); !ok {
		return
	}
	page, pageSize := pagination(r, 20)
	list, err := h.returnService.GetAdminReturnRequests(page, pageSize, r.URL.Query().Get("status"))
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "could not load return requests")
		return
	}
	utils.WriteJSON(w, http.StatusOK, list)
}

// PATCH /api/v1/admin/returns/:id/review
func (h *ReturnHandler) AdminReviewReturn(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPatch && r.Method != http.MethodPost {
		utils.WriteError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	if _, ok := adminClaims(w, r); !ok {
		return
	}

	const prefix = "/api/v1/admin/returns/"
	const suffix = "/review"
	path := strings.TrimSuffix(strings.TrimPrefix(r.URL.Path, prefix), suffix)
	returnID, err := strconv.Atoi(path)
	if err != nil || returnID < 1 {
		utils.WriteError(w, http.StatusBadRequest, "invalid return ID")
		return
	}

	var body struct {
		Approved bool   `json:"approved"`
		Remarks  string `json:"remarks"`
	}
	if err := json.NewDecoder(io.LimitReader(r.Body, 1<<20)).Decode(&body); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if err := h.returnService.ReviewReturnRequest(returnID, body.Approved, body.Remarks); err != nil {
		status := http.StatusConflict
		if strings.Contains(err.Error(), "remarks") {
			status = http.StatusBadRequest
		}
		utils.WriteError(w, status, err.Error())
		return
	}
	action := "REJECTED"
	if body.Approved {
		action = "APPROVED"
	}
	utils.WriteJSON(w, http.StatusOK, map[string]any{"returnId": returnID, "status": action})
}

// POST /api/v1/admin/returns/refund/:id confirms receipt and issues the online refund.
func (h *ReturnHandler) AdminProcessRefund(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		utils.WriteError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	if _, ok := adminClaims(w, r); !ok {
		return
	}
	returnID, err := strconv.Atoi(strings.TrimPrefix(r.URL.Path, "/api/v1/admin/returns/refund/"))
	if err != nil || returnID < 1 {
		utils.WriteError(w, http.StatusBadRequest, "invalid return ID")
		return
	}
	if err := h.returnService.ProcessReturnRefund(r.Context(), returnID); err != nil {
		status := http.StatusConflict
		if strings.Contains(err.Error(), "issue Razorpay refund") || strings.Contains(err.Error(), "not configured") {
			status = http.StatusBadGateway
		}
		utils.WriteError(w, status, err.Error())
		return
	}
	utils.WriteJSON(w, http.StatusOK, map[string]any{"returnId": returnID, "status": "REFUND_ISSUED"})
}

// POST /api/v1/admin/returns/manual-refund/:id records an already-sent COD refund.
func (h *ReturnHandler) AdminRecordCODRefund(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		utils.WriteError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	if _, ok := adminClaims(w, r); !ok {
		return
	}
	returnID, err := strconv.Atoi(strings.TrimPrefix(r.URL.Path, "/api/v1/admin/returns/manual-refund/"))
	if err != nil || returnID < 1 {
		utils.WriteError(w, http.StatusBadRequest, "invalid return ID")
		return
	}
	var body struct {
		Reference string `json:"reference"`
	}
	if err := json.NewDecoder(io.LimitReader(r.Body, 1<<20)).Decode(&body); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if err := h.returnService.RecordCODRefund(returnID, body.Reference); err != nil {
		status := http.StatusConflict
		if strings.Contains(err.Error(), "reference is required") {
			status = http.StatusBadRequest
		}
		utils.WriteError(w, status, err.Error())
		return
	}
	utils.WriteJSON(w, http.StatusOK, map[string]any{"returnId": returnID, "status": "REFUND_RECORDED"})
}
