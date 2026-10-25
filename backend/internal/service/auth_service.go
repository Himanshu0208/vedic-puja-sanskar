package service

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"math/big"
	"strings"
	"time"

	"github.com/Himanshu0208/vedic-puja-sanskar/backend/internal/config"
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
	emailConfig        config.EmailConfig
}

// NewAuthService creates a new authentication service
func NewAuthService(userRepo *repository.UserRepository, tokenManager *jwt.TokenManager, accessTokenExpiry string, refreshTokenExpiry string, emailConfig config.EmailConfig) *AuthService {
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
		emailConfig:        emailConfig,
	}
}

// Signup registers a new user
func (s *AuthService) Signup(req *dto.SignupRequest) error {
	req.Email = strings.ToLower(strings.TrimSpace(req.Email))
	if s.userRepo.UserExists(req.Email) {
		return repository.ErrEmailAlreadyRegistered
	}
	req.Phone = strings.TrimSpace(req.Phone)
	if s.userRepo.PhoneExists(req.Phone, 0) {
		return repository.ErrPhoneAlreadyRegistered
	}

	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
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

	codeNumber, err := rand.Int(rand.Reader, big.NewInt(1000000))
	if err != nil {
		return fmt.Errorf("failed to generate verification code: %w", err)
	}
	code := fmt.Sprintf("%06d", codeNumber.Int64())
	codeDigest := sha256.Sum256([]byte(code))
	if err := s.userRepo.SavePendingSignup(user, hex.EncodeToString(codeDigest[:]), time.Now().Add(10*time.Minute)); err != nil {
		return fmt.Errorf("failed to start signup: %w", err)
	}
	if err := sendSignupCode(s.emailConfig, user.Email, code); err != nil {
		return fmt.Errorf("could not send verification email: %w", err)
	}
	return nil
}

func (s *AuthService) VerifySignup(req *dto.VerifySignupRequest) (*dto.AuthResponse, error) {
	req.Email = strings.ToLower(strings.TrimSpace(req.Email))
	codeDigest := sha256.Sum256([]byte(req.Code))
	savedUser, err := s.userRepo.VerifyPendingSignup(req.Email, hex.EncodeToString(codeDigest[:]), time.Now())
	if err != nil {
		return nil, err
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

func (s *AuthService) ForgotPassword(email string) error {
	email = strings.ToLower(strings.TrimSpace(email))
	user, err := s.userRepo.GetUserByEmail(email)
	if err != nil {
		return nil
	}
	n, err := rand.Int(rand.Reader, big.NewInt(1000000))
	if err != nil {
		return err
	}
	code := fmt.Sprintf("%06d", n.Int64())
	digest := sha256.Sum256([]byte(code))
	if err := s.userRepo.SavePasswordReset(email, hex.EncodeToString(digest[:]), time.Now().Add(10*time.Minute)); err != nil {
		return err
	}
	if err := sendPasswordResetCode(s.emailConfig, user.Email, code); err != nil {
		return fmt.Errorf("could not send password reset email: %w", err)
	}
	return nil
}

func (s *AuthService) ResetPassword(req *dto.ResetPasswordRequest) error {
	req.Email = strings.ToLower(strings.TrimSpace(req.Email))
	digest := sha256.Sum256([]byte(req.Code))
	hash, err := utils.HashPassword(req.Password)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}
	return s.userRepo.ResetPassword(req.Email, hex.EncodeToString(digest[:]), hash, time.Now())
}

func (s *AuthService) GetProfile(userID int) (*dto.ProfileResponse, error) {
	user, err := s.userRepo.GetUserByID(userID)
	if err != nil {
		return nil, err
	}
	return &dto.ProfileResponse{ID: user.ID, FullName: user.FullName, Phone: user.Phone, Gender: user.Gender, Email: user.Email, Role: string(user.Role)}, nil
}

func (s *AuthService) UpdateProfile(userID int, req dto.UpdateProfileRequest) (*dto.ProfileResponse, error) {
	phone := strings.TrimSpace(req.Phone)
	if s.userRepo.PhoneExists(phone, userID) {
		return nil, repository.ErrPhoneAlreadyRegistered
	}
	if err := s.userRepo.UpdateProfile(userID, strings.TrimSpace(req.FullName), phone, req.Gender); err != nil {
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
