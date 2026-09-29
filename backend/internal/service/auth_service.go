package service

import (
	"errors"
	"fmt"
	"strings"
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
func NewAuthService(userRepo *repository.UserRepository, tokenManager *jwt.TokenManager, accessTokenExpiry string, refreshTokenExpiry string) *AuthService {
	accessTokenExpiryDuration, err := time.ParseDuration(accessTokenExpiry)
	if err != nil {
		panic(fmt.Sprintf("Invalid access token expiry duration: %v", err))
	}

	refreshTokenExpiryDuration, err := time.ParseDuration(refreshTokenExpiry)
	if err != nil {
		panic(fmt.Sprintf("Invalid refresh token expiry duration: %v", err))
	}

	return &AuthService{
		userRepo:           userRepo,
		tokenManager:       tokenManager,
		acessTokenExpiry:   int(accessTokenExpiryDuration.Seconds()),
		refreshTokenExpiry: int(refreshTokenExpiryDuration.Seconds()),
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
		FullName:  strings.TrimSpace(req.FullName),
		Phone:     strings.TrimSpace(req.Phone),
		Gender:    req.Gender,
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

	accessToken, err := s.tokenManager.GenerateToken(savedUser.ID, savedUser.Email, string(savedUser.Role), s.acessTokenExpiry)
	if err != nil {
		return nil, fmt.Errorf("failed to generate access token: %w", err)
	}

	refreshToken, err := s.tokenManager.GenerateToken(savedUser.ID, savedUser.Email, string(savedUser.Role), s.refreshTokenExpiry)
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
		AccessTokenExpiresIn:  s.acessTokenExpiry,
		RefreshTokenExpiresIn: s.refreshTokenExpiry,
	}, nil
}

func (s *AuthService) GetProfile(userID int) (*dto.ProfileResponse, error) {
	user, err := s.userRepo.GetUserByID(userID)
	if err != nil {
		return nil, err
	}
	return &dto.ProfileResponse{ID: user.ID, FullName: user.FullName, Phone: user.Phone, Gender: user.Gender, Email: user.Email, Role: string(user.Role)}, nil
}

func (s *AuthService) UpdateProfile(userID int, req dto.UpdateProfileRequest) (*dto.ProfileResponse, error) {
	if err := s.userRepo.UpdateProfile(userID, strings.TrimSpace(req.FullName), strings.TrimSpace(req.Phone), req.Gender); err != nil {
		return nil, err
	}
	return s.GetProfile(userID)
}

func (s *AuthService) GetWishlist(userID int) ([]int, error) {
	return s.userRepo.GetWishlist(userID)
}

func (s *AuthService) AddWishlist(userID, productID int) error {
	return s.userRepo.AddWishlist(userID, productID)
}

func (s *AuthService) RemoveWishlist(userID, productID int) error {
	return s.userRepo.RemoveWishlist(userID, productID)
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

	accessToken, err := s.tokenManager.GenerateToken(user.ID, user.Email, string(user.Role), s.acessTokenExpiry)
	if err != nil {
		return nil, fmt.Errorf("failed to generate access token: %w", err)
	}

	refreshToken, err := s.tokenManager.GenerateToken(user.ID, user.Email, string(user.Role), s.refreshTokenExpiry)
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
		AccessTokenExpiresIn:  s.acessTokenExpiry,
		RefreshTokenExpiresIn: s.refreshTokenExpiry,
	}, nil
}

func (s *AuthService) RefreshToken(refreshToken string, claims *jwt.Claims) (*dto.AuthResponse, error) {
	userId, err := s.userRepo.GetUserIdFromRefreshToken(refreshToken)
	if err != nil {
		return nil, fmt.Errorf("failed to get userID, login again")
	}

	if userId != claims.UserID {
		return nil, fmt.Errorf("unauthorized token owner")
	}

	accessToken, err := s.tokenManager.GenerateToken(claims.UserID, claims.Email, string(claims.Role), s.acessTokenExpiry)
	if err != nil {
		return nil, fmt.Errorf("failed to generate access token: %w", err)
	}

	newRefreshToken, err := s.tokenManager.GenerateToken(claims.UserID, claims.Email, string(claims.Role), s.refreshTokenExpiry)
	if err != nil {
		return nil, fmt.Errorf("failed to generate refresh token: %w", err)
	}

	if err := s.userRepo.DeleteRefreshTokenByToken(refreshToken); err != nil {
		return nil, fmt.Errorf("Unable to delete previous token: %w", err)
	}

	if err := s.SaveRefreshToken(newRefreshToken, claims.UserID); err != nil {
		return nil, fmt.Errorf("Unable to Save auth token: %w", err)
	}

	return &dto.AuthResponse{
		ID:                    claims.UserID,
		Email:                 claims.Email,
		Role:                  string(claims.Role),
		AccessToken:           accessToken,
		RefreshToken:          newRefreshToken,
		AccessTokenExpiresIn:  s.acessTokenExpiry,
		RefreshTokenExpiresIn: s.refreshTokenExpiry,
	}, nil
}

func (s *AuthService) VerifyToken(tokenString string) (*jwt.Claims, error) {
	return s.tokenManager.ValidateToken(tokenString)
}

func (s *AuthService) SaveRefreshToken(token string, userId int) error {
	expiredAt := time.Now().Add(time.Duration(s.refreshTokenExpiry) * 24 * time.Hour)

	return s.userRepo.SaveRefreshToken(userId, token, expiredAt)
}

func (s *AuthService) GetAdminUsers(page, pageSize int, search string) (*dto.AdminUserList, error) {
	return s.userRepo.GetAdminUsers(page, pageSize, search)
}
