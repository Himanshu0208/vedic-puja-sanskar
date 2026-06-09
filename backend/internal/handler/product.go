package handler

import (
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/Himanshu0208/vedic-puja-sanskar/backend/internal/models"
	"github.com/Himanshu0208/vedic-puja-sanskar/backend/internal/service"
	"github.com/Himanshu0208/vedic-puja-sanskar/backend/pkg/jwt"
	"github.com/Himanshu0208/vedic-puja-sanskar/backend/pkg/utils"
)

// ProductHandler handles product endpoints
type ProductHandler struct {
	productService *service.ProductService
	uploadsDir     string
}

// NewProductHandler creates a new product handler
func NewProductHandler(productService *service.ProductService, uploadsDir string) *ProductHandler {
	return &ProductHandler{
		productService: productService,
		uploadsDir:     uploadsDir,
	}
}

// GetAllProducts retrieves all products
func (h *ProductHandler) GetAllProducts(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		utils.WriteError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	response, err := h.productService.GetAllProducts()
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

	product, err := h.productService.GetProductByID(id)
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

	// Get user from context
	claims, ok := r.Context().Value("claims").(*jwt.Claims)
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	// Parse multipart form
	if err := r.ParseMultipartForm(10 << 20); err != nil { // 10 MB max
		utils.WriteError(w, http.StatusBadRequest, "failed to parse form")
		return
	}

	// Get form values
	name := r.FormValue("name")
	description := r.FormValue("description")
	priceStr := r.FormValue("price")
	salePriceStr := r.FormValue("sale_price")

	// Validate required fields
	if name == "" || priceStr == "" || salePriceStr == "" {
		utils.WriteError(w, http.StatusBadRequest, "name, price, and sale_price are required")
		return
	}

	// Parse prices
	var price, salePrice float64
	if _, err := fmt.Sscanf(priceStr, "%f", &price); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "invalid price format")
		return
	}
	if _, err := fmt.Sscanf(salePriceStr, "%f", &salePrice); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "invalid sale price format")
		return
	}

	// Handle file upload
	var imagePath string
	file, header, err := r.FormFile("image")
	if err == nil {
		defer file.Close()
		imagePath, err = h.saveProductImage(file, header)
		if err != nil {
			utils.WriteError(w, http.StatusBadRequest, "failed to upload image: "+err.Error())
			return
		}
	}

	// Create product request
	req := &models.CreateProductRequest{
		Name:        name,
		Description: description,
		Price:       price,
		SalePrice:   salePrice,
	}

	// Create product
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

	// Get user from context
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

	var req models.UpdateProductRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	defer r.Body.Close()

	product, err := h.productService.UpdateProduct(id, &req, claims.UserID)
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

	// Get user from context
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

	err = h.productService.DeleteProduct(id, claims.UserID)
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

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, `{"message":"product deleted successfully"}`)
}

// saveProductImage saves uploaded image and returns the path
func (h *ProductHandler) saveProductImage(file multipart.File, header *multipart.FileHeader) (string, error) {
	// Validate file extension
	ext := filepath.Ext(header.Filename)
	allowedExts := map[string]bool{".jpg": true, ".jpeg": true, ".png": true, ".gif": true, ".webp": true}
	if !allowedExts[strings.ToLower(ext)] {
		return "", fmt.Errorf("invalid file type, allowed: jpg, jpeg, png, gif, webp")
	}

	// Create unique filename
	filename := fmt.Sprintf("product_%d%s", time.Now().UnixNano(), ext)
	filepath := filepath.Join(h.uploadsDir, filename)

	// Create file
	dst, err := os.Create(filepath)
	if err != nil {
		return "", fmt.Errorf("failed to create file: %w", err)
	}
	defer dst.Close()

	// Copy file content
	if _, err := io.Copy(dst, file); err != nil {
		return "", fmt.Errorf("failed to save file: %w", err)
	}

	// Return relative path for API
	return "/uploads/" + filename, nil
}

// ServeImage serves product images
func ServeImage(uploadsDir string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			w.WriteHeader(http.StatusMethodNotAllowed)
			return
		}

		filename := strings.TrimPrefix(r.URL.Path, "/uploads/")
		filepath := filepath.Join(uploadsDir, filename)

		// Prevent directory traversal
		if !strings.HasPrefix(filepath, uploadsDir) {
			w.WriteHeader(http.StatusForbidden)
			return
		}

		http.ServeFile(w, r, filepath)
	}
}
