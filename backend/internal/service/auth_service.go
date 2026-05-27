package service

import (
	"errors"
	"fmt"
	"time"

	"github.com/Himanshu0208/vedic-puja-sanskar/backend/internal/models"
	"github.com/Himanshu0208/vedic-puja-sanskar/backend/internal/repository"
	"github.com/Himanshu0208/vedic-puja-sanskar/backend/pkg/jwt"
	"github.com/Himanshu0208/vedic-puja-sanskar/backend/pkg/utils"
)

// AuthService handles authentication business logic
type AuthService struct {
	userRepo     *repository.UserRepository
	tokenManager *jwt.TokenManager
	tokenExpiry  int
}

// NewAuthService creates a new authentication service
func NewAuthService(userRepo *repository.UserRepository, tokenManager *jwt.TokenManager, tokenExpiryHours int) *AuthService {
	return &AuthService{
		userRepo:     userRepo,
		tokenManager: tokenManager,
		tokenExpiry:  tokenExpiryHours,
	}
}

// Signup registers a new user
func (s *AuthService) Signup(req *models.SignupRequest) (*models.AuthResponse, error) {
	// Validate input
	if err := utils.ValidateEmail(req.Email); err != nil {
		return nil, fmt.Errorf("email validation failed: %w", err)
	}

	if err := utils.ValidatePassword(req.Password); err != nil {
		return nil, fmt.Errorf("password validation failed: %w", err)
	}

	// Check if user already exists
	if s.userRepo.UserExists(req.Email) {
		return nil, errors.New("user with this email already exists")
	}

	// Hash password
	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	// Create user
	user := &models.User{
		Email:     req.Email,
		Password:  hashedPassword,
		Role:      models.RoleUser, // Default role
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	// Save user
	savedUser, err := s.userRepo.SaveUser(user)
	if err != nil {
		return nil, fmt.Errorf("failed to save user: %w", err)
	}

	// Generate token
	token, err := s.tokenManager.GenerateToken(savedUser.ID, savedUser.Email, s.tokenExpiry)
	if err != nil {
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}

	return &models.AuthResponse{
		ID:          savedUser.ID,
		Email:       savedUser.Email,
		Role:        savedUser.Role,
		AccessToken: token,
		TokenType:   "Bearer",
		ExpiresIn:   s.tokenExpiry * 3600, // Convert hours to seconds
	}, nil
}

// Login authenticates a user
func (s *AuthService) Login(req *models.LoginRequest) (*models.AuthResponse, error) {
	// Validate input
	if err := utils.ValidateEmail(req.Email); err != nil {
		return nil, fmt.Errorf("email validation failed: %w", err)
	}

	if req.Password == "" {
		return nil, errors.New("password is required")
	}

	// Get user by email
	user, err := s.userRepo.GetUserByEmail(req.Email)
	if err != nil {
		return nil, errors.New("invalid credentials")
	}

	// Verify password
	if err := utils.VerifyPassword(user.Password, req.Password); err != nil {
		return nil, errors.New("invalid credentials")
	}

	// Generate token
	token, err := s.tokenManager.GenerateToken(user.ID, user.Email, s.tokenExpiry)
	if err != nil {
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}

	return &models.AuthResponse{
		ID:          user.ID,
		Email:       user.Email,
		Role:        user.Role,
		AccessToken: token,
		TokenType:   "Bearer",
		ExpiresIn:   s.tokenExpiry * 3600, // Convert hours to seconds
	}, nil
}

// VerifyToken verifies a JWT token and returns the claims
func (s *AuthService) VerifyToken(tokenString string) (*jwt.Claims, error) {
	return s.tokenManager.ValidateToken(tokenString)
}
