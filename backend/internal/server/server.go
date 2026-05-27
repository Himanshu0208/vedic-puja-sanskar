package server

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/Himanshu0208/vedic-puja-sanskar/backend/db"
	"github.com/Himanshu0208/vedic-puja-sanskar/backend/internal/config"
	"github.com/Himanshu0208/vedic-puja-sanskar/backend/internal/handler"
	"github.com/Himanshu0208/vedic-puja-sanskar/backend/internal/middleware"
	"github.com/Himanshu0208/vedic-puja-sanskar/backend/internal/models"
	"github.com/Himanshu0208/vedic-puja-sanskar/backend/internal/repository"
	"github.com/Himanshu0208/vedic-puja-sanskar/backend/internal/service"
	"github.com/Himanshu0208/vedic-puja-sanskar/backend/pkg/jwt"
	"github.com/Himanshu0208/vedic-puja-sanskar/backend/pkg/utils"
)

// Server represents the HTTP server
type Server struct {
	config         config.Config
	httpServer     *http.Server
	authService    *service.AuthService
	productService *service.ProductService
	dbConn         *db.Connection
}

// New creates a new server instance
func New(cfg config.Config) (*Server, error) {
	// Initialize PostgreSQL database connection
	dbConn, err := db.NewConnection(cfg.Database.URL)
	if err != nil {
		return nil, fmt.Errorf("failed to initialize database: %w", err)
	}

	// Initialize repositories
	userRepo := repository.NewUserRepository(dbConn.DB)
	productRepo := repository.NewProductRepository(dbConn.DB)

	// Initialize JWT token manager
	tokenManager := jwt.NewTokenManager(cfg.JWT.Secret)

	// Initialize services
	authService := service.NewAuthService(userRepo, tokenManager, cfg.JWT.ExpirationHours)
	productService := service.NewProductService(productRepo)

	// Create default admin user if it doesn't exist
	if err := createDefaultAdmin(userRepo, authService); err != nil {
		log.Printf("Warning: Failed to create default admin: %v", err)
	}

	// Create server
	server := &Server{
		config:         cfg,
		authService:    authService,
		productService: productService,
		dbConn:         dbConn,
	}

	// Setup routes
	mux := server.setupRoutes()

	server.httpServer = &http.Server{
		Addr:         fmt.Sprintf("%s:%s", cfg.Server.Host, cfg.Server.Port),
		Handler:      mux,
		ReadTimeout:  cfg.Server.ReadTimeout,
		WriteTimeout: cfg.Server.WriteTimeout,
	}

	return server, nil
}

// setupRoutes configures all HTTP routes
func (s *Server) setupRoutes() http.Handler {
	mux := http.NewServeMux()

	// Create handlers
	authHandler := handler.NewAuthHandler(s.authService)
	uploadsDir := s.config.Database.StoragePath + "/uploads"
	productHandler := handler.NewProductHandler(s.productService, uploadsDir)

	// Public routes
	mux.HandleFunc("/api/v1/auth/signup", authHandler.Signup)
	mux.HandleFunc("/api/v1/auth/login", authHandler.Login)

	// Product routes (public - readable)
	mux.HandleFunc("/api/v1/products", productHandler.GetAllProducts)
	mux.HandleFunc("/api/v1/products/get", productHandler.GetProductByID)

	// Serve uploaded images
	mux.HandleFunc("/uploads/", handler.ServeImage(uploadsDir))

	// Health check
	mux.HandleFunc("/api/v1/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		fmt.Fprintf(w, `{"status":"ok"}`)
	})

	// Protected routes
	protectedMux := http.NewServeMux()
	protectedMux.HandleFunc("/api/v1/auth/profile", authHandler.GetProfile)

	// Product creation/update/delete (requires auth)
	protectedMux.HandleFunc("/api/v1/products/create", productHandler.CreateProduct)
	protectedMux.HandleFunc("/api/v1/products/update", productHandler.UpdateProduct)
	protectedMux.HandleFunc("/api/v1/products/delete", productHandler.DeleteProduct)

	// Wrap protected routes with auth middleware
	protectedHandler := middleware.AuthMiddleware(s.authService)(protectedMux)
	mux.Handle("/api/v1/", protectedHandler)

	// Apply CORS middleware to all routes
	handler := middleware.CORSMiddleware(mux)

	return handler
}

// Start starts the HTTP server
func (s *Server) Start() error {
	log.Printf("Starting server on %s:%s", s.config.Server.Host, s.config.Server.Port)
	return s.httpServer.ListenAndServe()
}

// Stop gracefully stops the server
func (s *Server) Stop() error {
	log.Println("Stopping server...")
	return s.httpServer.Close()
}

// Wait blocks until the server is ready
func (s *Server) Wait() <-chan error {
	errChan := make(chan error, 1)
	go func() {
		errChan <- s.Start()
	}()
	time.Sleep(100 * time.Millisecond) // Give server time to start
	return errChan
}

// createDefaultAdmin creates a default admin user if it doesn't exist
func createDefaultAdmin(userRepo *repository.UserRepository, authService *service.AuthService) error {
	// Check if admin already exists
	if userRepo.UserExists("admin@vedic-puja.com") {
		return nil
	}

	// Create default admin manually with admin role
	hashedPassword, err := utils.HashPassword("Admin@123")
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	adminUser := &models.User{
		Email:     "admin@vedic-puja.com",
		Password:  hashedPassword,
		Role:      models.RoleAdmin,
		IsAdmin:   true,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	_, err = userRepo.SaveUser(adminUser)
	if err != nil {
		return fmt.Errorf("failed to save admin user: %w", err)
	}

	log.Println("================================================")
	log.Println("Default Admin User Created Successfully!")
	log.Println("================================================")
	log.Println("Email: admin@vedic-puja.com")
	log.Println("⚠️  Please change this password after first login!")
	log.Println("================================================")

	return nil
}
