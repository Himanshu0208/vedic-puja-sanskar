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
	userRepo           *repository.UserRepository
	tokenManager       *jwt.TokenManager
	acessTokenExpiry   int
	refreshTokenExpiry int
}

// NewAuthService creates a new authentication service
func NewAuthService(userRepo *repository.UserRepository, tokenManager *jwt.TokenManager, accessTokenExpiryMinutes int, refreshTokenExpiryDays int) *AuthService {
	return &AuthService{
		userRepo:           userRepo,
		tokenManager:       tokenManager,
		acessTokenExpiry:   accessTokenExpiryMinutes,
		refreshTokenExpiry: refreshTokenExpiryDays,
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

	accessToken, err := s.tokenManager.GenerateToken(savedUser.ID, savedUser.Email, s.acessTokenExpiry)
	if err != nil {
		return nil, fmt.Errorf("failed to generate access token: %w", err)
	}

	refreshToken, err := s.tokenManager.GenerateToken(savedUser.ID, savedUser.Email, s.refreshTokenExpiry)
	if err != nil {
		return nil, fmt.Errorf("failed to generate refresh token: %w", err)
	}
	
	if err := s.SaveRefreshToken(refreshToken, savedUser.ID); err != nil {
		return nil, fmt.Errorf("Unable to Save auth token")
	}

	return &dto.AuthResponse{
		ID:                    savedUser.ID,
		Email:                 savedUser.Email,
		Role:                  string(savedUser.Role),
		AccessToken:           accessToken,
		RefreshToken:          refreshToken,
		AccessTokenExpiresIn:  s.acessTokenExpiry * 60,
		RefreshTokenExpiresIn: s.refreshTokenExpiry * 24 * 60 * 60,
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

	accessToken, err := s.tokenManager.GenerateToken(user.ID, user.Email, s.acessTokenExpiry)
	if err != nil {
		return nil, fmt.Errorf("failed to generate access token: %w", err)
	}

	refreshToken, err := s.tokenManager.GenerateToken(user.ID, user.Email, s.refreshTokenExpiry)
	if err != nil {
		return nil, fmt.Errorf("failed to generate refresh token: %w", err)
	}

	if err := s.SaveRefreshToken(refreshToken, user.ID); err != nil {
		return nil, fmt.Errorf("Unable to Save auth token: %w", err)
	}
	return &dto.AuthResponse{
		ID:                    user.ID,
		Email:                 user.Email,
		Role:                  string(user.Role),
		AccessToken:           accessToken,
		RefreshToken:          refreshToken,
		AccessTokenExpiresIn:  s.acessTokenExpiry * 60,
		RefreshTokenExpiresIn: s.refreshTokenExpiry * 24 * 60 * 60,
	}, nil
}

func (s *AuthService) RefreshToken(refreshToken string, claims *jwt.Claims) (*dto.AuthResponse, error) {
	userId, err := s.userRepo.GetUserIdFromRefreshToken(refreshToken)
	if err != nil {
		return nil, fmt.Errorf("failed to get userID, login again");
	}

	if userId != claims.UserID {
		return nil, fmt.Errorf("bsdk apne baap ko mt sikha");
	}

	user, err := s.userRepo.GetUserByID(userId);
	if err != nil {
		return nil, fmt.Errorf("user not found")
	}

	accessToken, err := s.tokenManager.GenerateToken(user.ID, user.Email, s.acessTokenExpiry)
	if err != nil {
		return nil, fmt.Errorf("failed to generate access token: %w", err)
	}

	newRefreshToken, err := s.tokenManager.GenerateToken(user.ID, user.Email, s.refreshTokenExpiry)
	if err != nil {
		return nil, fmt.Errorf("failed to generate refresh token: %w", err)
	}
	
	if err := s.userRepo.DeleteRefreshTokenByToken(refreshToken); err != nil {
		return nil, fmt.Errorf("Unable to delete previous token: %w", err)
	}

	if err := s.SaveRefreshToken(newRefreshToken, user.ID); err != nil {
		return nil, fmt.Errorf("Unable to Save auth token: %w", err)
	}

	return &dto.AuthResponse{
		ID:                    user.ID,
		Email:                 user.Email,
		Role:                  string(user.Role),
		AccessToken:           accessToken,
		RefreshToken:          newRefreshToken,
		AccessTokenExpiresIn:  s.acessTokenExpiry * 60,
		RefreshTokenExpiresIn: s.refreshTokenExpiry * 24 * 60 * 60,
	}, nil
}

func (s *AuthService) VerifyToken(tokenString string) (*jwt.Claims, error) {
	return s.tokenManager.ValidateToken(tokenString)
}

func (s *AuthService) SaveRefreshToken(token string, userId int) error {
	expiredAt := time.Now().Add(time.Duration(s.refreshTokenExpiry) * 24 * time.Hour)

	return s.userRepo.SaveRefreshToken(userId, token, expiredAt);
}
