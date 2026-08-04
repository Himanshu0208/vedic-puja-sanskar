package handler

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/Himanshu0208/vedic-puja-sanskar/backend/internal/dto"
	"github.com/Himanshu0208/vedic-puja-sanskar/backend/internal/service"
	"github.com/Himanshu0208/vedic-puja-sanskar/backend/pkg/jwt"
	"github.com/Himanshu0208/vedic-puja-sanskar/backend/pkg/utils"

	"github.com/go-playground/form/v4"
	"github.com/go-playground/validator/v10"
)

// ProductHandler handles product endpoints
type ProductHandler struct {
	productService *service.ProductService
	uploadsDir     string
	validate       *validator.Validate
	formDecoder    *form.Decoder
}

// NewProductHandler creates a new product handler
func NewProductHandler(productService *service.ProductService, uploadsDir string, validate *validator.Validate) *ProductHandler {
	formDecoder := form.NewDecoder()
	return &ProductHandler{
		productService: productService,
		uploadsDir:     uploadsDir,
		validate:       validate,
		formDecoder:    formDecoder,
	}
}

// GetAllProducts retrieves all products
func (h *ProductHandler) GetAllProducts(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		utils.WriteError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	
	role := "user"
	claims, isAuthorized := r.Context().Value("claims").(*jwt.Claims)
	if isAuthorized {
		role = claims.Role
	}

	response, err := h.productService.GetAllProducts(role)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.WriteJSON(w, http.StatusOK, response)
}

// GetProductByID retrieves a product by ID
func (h *ProductHandler) GetProductByID(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		utils.WriteError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	var userID int
	var role string
	claims, isAuthorized := r.Context().Value("claims").(*jwt.Claims)
	if isAuthorized {
		userID = claims.UserID
		role = claims.Role
	}
	idStr := r.URL.Query().Get("id")
	if idStr == "" {
		utils.WriteError(w, http.StatusBadRequest, "product id is required")
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "invalid product id")
		return
	}

	product, err := h.productService.GetProductByID(id, userID, role, isAuthorized);
	if err != nil {
		utils.WriteError(w, http.StatusNotFound, err.Error())
		return
	}

	utils.WriteJSON(w, http.StatusOK, product)
}

// CreateProduct creates a new product (admin only)
func (h *ProductHandler) CreateProduct(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		utils.WriteError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	claims, ok := r.Context().Value("claims").(*jwt.Claims)
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	if err := r.ParseMultipartForm(10 << 20); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "failed to parse form")
		return
	}

	var imagePath string
	file, header, err := r.FormFile("image")
	if err == nil {
		defer file.Close()
		imagePath, err = utils.SaveProductImage(file, header, h.uploadsDir)
		if err != nil {
			utils.WriteError(w, http.StatusBadRequest, "failed to upload image: "+err.Error())
			return
		}
	} else {
		utils.WriteError(w, http.StatusBadRequest, "image is required")
		return
	}

	req := &dto.ProductRequest{}

	if err := h.formDecoder.Decode(&req, r.PostForm); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "failed to decode form data: "+err.Error())
		return
	}

	req.Image = header
	if err := h.validate.Struct(req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	product, err := h.productService.CreateProduct(req, claims.UserID, imagePath)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	utils.WriteJSON(w, http.StatusCreated, product)
}

// UpdateProduct updates a product
func (h *ProductHandler) UpdateProduct(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		utils.WriteError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	claims, ok := r.Context().Value("claims").(*jwt.Claims)
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	if err := r.ParseMultipartForm(10 << 20); err != nil {
		// fallback to regular form if not multipart
		if err := r.ParseForm(); err != nil {
			utils.WriteError(w, http.StatusBadRequest, "failed to parse form")
			return
		}
	}

	req := &dto.UpdateProductRequest{}

	if err := h.formDecoder.Decode(&req, r.PostForm); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "failed to decode form data: "+err.Error())
		return
	}

	if err := h.validate.Struct(req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	var imagePath string
	file, header, err := r.FormFile("image")
	if err == nil {
		defer file.Close()
		imagePath, err = utils.SaveProductImage(file, header, h.uploadsDir)
		if err != nil {
			utils.WriteError(w, http.StatusBadRequest, "failed to upload image: "+err.Error())
			return
		}
	} else if req.ImagePath != nil && req.ImageURL != nil {
		imagePath = *req.ImagePath
	} else {
		utils.WriteError(w, http.StatusBadRequest, "image is required")
		return
	}


	product, err := h.productService.UpdateProduct(req.ID, req, claims.UserID, imagePath)
	if err != nil {
		if strings.Contains(err.Error(), "unauthorized") {
			utils.WriteError(w, http.StatusForbidden, err.Error())
		} else if strings.Contains(err.Error(), "not found") {
			utils.WriteError(w, http.StatusNotFound, err.Error())
		} else {
			utils.WriteError(w, http.StatusBadRequest, err.Error())
		}
		return
	}

	utils.WriteJSON(w, http.StatusOK, product)
}

// DeleteProduct deletes a product
func (h *ProductHandler) DeleteProduct(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		utils.WriteError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	claims, ok := r.Context().Value("claims").(*jwt.Claims)
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	idStr := r.URL.Query().Get("id")
	if idStr == "" {
		utils.WriteError(w, http.StatusBadRequest, "product id is required")
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "invalid product id")
		return
	}

	deletedProduct, err := h.productService.DeleteProduct(id, claims.UserID)
	if err != nil {
		if strings.Contains(err.Error(), "unauthorized") {
			utils.WriteError(w, http.StatusForbidden, err.Error())
		} else if strings.Contains(err.Error(), "not found") {
			utils.WriteError(w, http.StatusNotFound, err.Error())
		} else {
			utils.WriteError(w, http.StatusBadRequest, err.Error())
		}
		return
	}

	utils.WriteJSON(w, http.StatusOK, deletedProduct)
}
