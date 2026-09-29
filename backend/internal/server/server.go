package server

import (
	"errors"
	"fmt"
	"io"
	"log"
	"log/slog"
	"net/http"
	"os"
	"path/filepath"
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

	"github.com/go-playground/validator/v10"
)

type Server struct {
	config          config.Config
	httpServer      *http.Server
	authService     *service.AuthService
	productService  *service.ProductService
	categoryService *service.CategoryService
	cartService     *service.CartService
	orderService    *service.OrderService
	dbConn          *db.Connection
	validate        *validator.Validate // ✅ central validator
	requestLogger   *slog.Logger
	logFile         *os.File
}

func New(cfg config.Config) (*Server, error) {
	// DB
	dbConn, err := db.NewConnection(cfg.Database.URL)
	if err != nil {
		return nil, fmt.Errorf("failed to init db: %w", err)
	}
	requestLogger, logFile, err := openRequestLog()
	if err != nil {
		_ = dbConn.DB.Close()
		return nil, fmt.Errorf("failed to open request log: %w", err)
	}

	// Repositories
	userRepo := repository.NewUserRepository(dbConn.DB)
	productRepo := repository.NewProductRepository(dbConn.DB)
	categoryRepo := repository.NewCategoryRepository(dbConn.DB)
	cartRepo := repository.NewCartRepository(dbConn.DB)
	orderRepo := repository.NewOrderRepository(dbConn.DB)

	// JWT
	tokenManager := jwt.NewTokenManager(cfg.JWT.Secret)

	// Services
	authService := service.NewAuthService(userRepo, tokenManager, cfg.JWT.AccessTokenExpiry, cfg.JWT.RefreshTokenExpiry)
	productService := service.NewProductService(productRepo, categoryRepo)
	categoryService := service.NewCategoryService(categoryRepo)
	cartService := service.NewCartService(cartRepo, productRepo)
	orderService := service.NewOrderService(orderRepo, cfg.Razorpay.KeyID, cfg.Razorpay.Secret)

	// ✅ Validator (single instance)
	validate := validator.New()
	validate.RegisterValidation("strong_password", utils.ValidateStrongPassword)

	// Default users
	createDefaultAccount(userRepo, cfg.Auth.DefaultAdminEmail, cfg.Auth.DefaultAdminPassword, models.RoleAdmin)
	createDefaultAccount(userRepo, cfg.Auth.DefaultDevAdminEmail, cfg.Auth.DefaultDevAdminPassword, models.RoleAdmin)
	createDefaultAccount(userRepo, cfg.Auth.DefaultDevUserEmail, cfg.Auth.DefaultDevUserPassword, models.RoleUser)

	server := &Server{
		config:          cfg,
		authService:     authService,
		productService:  productService,
		categoryService: categoryService,
		cartService:     cartService,
		orderService:    orderService,
		dbConn:          dbConn,
		validate:        validate,
		requestLogger:   requestLogger,
		logFile:         logFile,
	}

	server.httpServer = &http.Server{
		Addr:         fmt.Sprintf("%s:%s", cfg.Server.Host, cfg.Server.Port),
		Handler:      server.setupRoutes(),
		ReadTimeout:  cfg.Server.ReadTimeout,
		WriteTimeout: cfg.Server.WriteTimeout,
	}

	return server, nil
}

func (s *Server) setupRoutes() http.Handler {

	mux := http.NewServeMux()

	authHandler := handler.NewAuthHandler(s.authService, s.validate)
	uploadsDir := s.config.Database.ImageStoragePath
	productHandler := handler.NewProductHandler(s.productService, uploadsDir, s.validate)
	categoryHandler := handler.NewCategoryHandler(s.categoryService, s.validate)
	cartHandler := handler.NewCartHandler(s.cartService, s.validate)
	orderHandler := handler.NewOrderHandler(s.orderService, s.validate)
	adminHandler := handler.NewAdminHandler(s.authService, s.orderService)

	// ---------------- PUBLIC ROUTES ----------------

	mux.HandleFunc("/api/v1/auth/signup", authHandler.Signup)
	mux.HandleFunc("/api/v1/auth/login", authHandler.Login)
	mux.HandleFunc("/api/v1/auth/refresh", authHandler.RefreshAuthToken)

	mux.HandleFunc("/api/v1/categories", categoryHandler.GetAllCategories)

	mux.HandleFunc("/uploads/", utils.ServeImage(uploadsDir))

	mux.HandleFunc("/api/v1/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		fmt.Fprint(w, `{"status":"ok"}`)
	})
	productReadHandler := http.NewServeMux()
	productReadHandler.HandleFunc("/api/v1/products", productHandler.GetAllProducts)
	productReadHandler.HandleFunc("/api/v1/products/get", productHandler.GetProductByID)
	mux.Handle("/api/v1/products", middleware.OptionalAuthMiddleware(s.authService)(productReadHandler))
	mux.Handle("/api/v1/products/get", middleware.OptionalAuthMiddleware(s.authService)(productReadHandler))

	// ---------------- PROTECTED ROUTES ----------------

	protectedMux := http.NewServeMux()

	protectedMux.HandleFunc("/api/v1/auth/profile", authHandler.GetProfile)

	// product protected actions
	protectedMux.HandleFunc("/api/v1/products/create", productHandler.CreateProduct)
	protectedMux.HandleFunc("/api/v1/products/update", productHandler.UpdateProduct)
	protectedMux.HandleFunc("/api/v1/products/delete", productHandler.DeleteProduct)

	// cart protected routes
	protectedMux.HandleFunc("/api/v1/cart", cartHandler.GetCart)
	protectedMux.HandleFunc("/api/v1/cart/item/add", cartHandler.AddToCart)
	protectedMux.HandleFunc("/api/v1/cart/item/remove", cartHandler.RemoveFromCart)
	protectedMux.HandleFunc("/api/v1/orders", orderHandler.Orders)
	protectedMux.HandleFunc("/api/v1/orders/", orderHandler.OrderAction)
	protectedMux.HandleFunc("/api/v1/addresses", orderHandler.GetAddresses)
	protectedMux.HandleFunc("/api/v1/addresses/", orderHandler.AddressAction)
	protectedMux.HandleFunc("/api/v1/auth/wishlist", authHandler.Wishlist)
	protectedMux.HandleFunc("/api/v1/admin/users", adminHandler.Users)
	protectedMux.HandleFunc("/api/v1/admin/orders", adminHandler.Orders)
	protectedMux.HandleFunc("/api/v1/admin/orders/", adminHandler.OrderAction)
	protectedMux.HandleFunc("/api/v1/admin/reports", adminHandler.Reports)
	// wrap with auth middleware
	protectedHandler := middleware.AuthMiddleware(s.authService)(protectedMux)

	mux.Handle("/api/v1/", protectedHandler)

	// CORS
	return middleware.RequestLoggingMiddleware(middleware.CORSMiddleware(mux), s.requestLogger)
}

// ---------------- SERVER CONTROL ----------------

func (s *Server) Start() error {
	log.Printf("Server running on %s:%s", s.config.Server.Host, s.config.Server.Port)
	return s.httpServer.ListenAndServe()
}

func (s *Server) Stop() error {
	log.Println("Stopping server...")
	serverErr := s.httpServer.Close()
	fileErr := s.logFile.Close()
	return errors.Join(serverErr, fileErr)
}

func openRequestLog() (*slog.Logger, *os.File, error) {
	// ponytail: append-only for local use; add rotation when retention or volume requires it.
	const logPath = "logs/backend.log"
	if err := os.MkdirAll(filepath.Dir(logPath), 0700); err != nil {
		return nil, nil, err
	}
	file, err := os.OpenFile(logPath, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0600)
	if err != nil {
		return nil, nil, err
	}
	if err := file.Chmod(0600); err != nil {
		_ = file.Close()
		return nil, nil, err
	}
	writer := io.MultiWriter(os.Stdout, file)
	logger := slog.New(slog.NewJSONHandler(writer, &slog.HandlerOptions{Level: slog.LevelInfo}))
	return logger, file, nil
}

func (s *Server) Wait() <-chan error {
	errChan := make(chan error, 1)
	go func() {
		errChan <- s.Start()
	}()
	time.Sleep(100 * time.Millisecond)
	return errChan
}

// ---------------- DEFAULT USER ----------------

func createDefaultAccount(userRepo *repository.UserRepository, email, password string, role models.UserRole) {

	if userRepo.UserExists(email) {
		return
	}

	hashedPassword, err := utils.HashPassword(password)
	if err != nil {
		log.Println("hash error:", err)
		return
	}

	user := &models.User{
		Email:     email,
		Password:  hashedPassword,
		Role:      role,
		IsAdmin:   role == models.RoleAdmin,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if _, err := userRepo.SaveUser(user); err != nil {
		log.Println("save error:", err)
		return
	}

	log.Println("Default user created:", email)
}
