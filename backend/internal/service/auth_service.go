package service

import (
	"errors"
	"fmt"
	"time"

	"github.com/Himanshu0208/vedic-puja-sanskar/backend/internal/dto"
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
func (s *AuthService) Signup(req *dto.SignupRequest) (*dto.AuthResponse, error) {
	if s.userRepo.UserExists(req.Email) {
		return nil, errors.New("user with this email already exists")
	}

	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	user := &models.User{
		Email:     req.Email,
		Password:  hashedPassword,
		Role:      models.RoleUser,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	savedUser, err := s.userRepo.SaveUser(user)
	if err != nil {
		return nil, fmt.Errorf("failed to save user: %w", err)
	}

	token, err := s.tokenManager.GenerateToken(savedUser.ID, savedUser.Email, s.tokenExpiry)
	if err != nil {
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}

	return &dto.AuthResponse{
		ID:          savedUser.ID,
		Email:       savedUser.Email,
		Role:        string(savedUser.Role),
		AccessToken: token,
		TokenType:   "Bearer",
		ExpiresIn:   s.tokenExpiry * 3600, // Convert hours to seconds
	}, nil
}

// Login authenticates a user
func (s *AuthService) Login(req *dto.LoginRequest) (*dto.AuthResponse, error) {
	// Get user by email
	user, err := s.userRepo.GetUserByEmail(req.Email)
	if err != nil {
		return nil, errors.New("invalid credentials")
	}

	// Verify password
	if err := utils.VerifyPassword(user.Password, req.Password); err != nil {
		return nil, errors.New("invalid credentials")
	}

	token, err := s.tokenManager.GenerateToken(user.ID, user.Email, s.tokenExpiry)
	if err != nil {
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}

	return &dto.AuthResponse{
		ID:          user.ID,
		Email:       user.Email,
		Role:        string(user.Role),
		AccessToken: token,
		TokenType:   "Bearer",
		ExpiresIn:   s.tokenExpiry * 3600, // Convert hours to seconds
	}, nil
}

func (s *AuthService) VerifyToken(tokenString string) (*jwt.Claims, error) {
	return s.tokenManager.ValidateToken(tokenString)
}
