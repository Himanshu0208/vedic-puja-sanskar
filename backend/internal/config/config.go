package config

import (
	"os"
	"time"
)

// Config holds all configuration for the application
type Config struct {
	Server   ServerConfig
	JWT      JWTConfig
	Database DatabaseConfig
	Razorpay RazorpayConfig
	Email    EmailConfig
}

type EmailConfig struct{ SMTPHost, SMTPPort, SMTPUsername, SMTPPassword, From string }

type RazorpayConfig struct {
	KeyID  string
	Secret string
}

// ServerConfig holds server-related configuration
type ServerConfig struct {
	Port         string
	Host         string
	ReadTimeout  time.Duration
	WriteTimeout time.Duration
}

// JWTConfig holds JWT configuration
type JWTConfig struct {
	Secret             string
	AccessTokenExpiry  string
	RefreshTokenExpiry string
}

// DatabaseConfig holds database configuration
type DatabaseConfig struct {
	URL              string
	ImageStoragePath string // kept for backward compatibility
}

// Load loads configuration from environment variables and defaults
func Load() Config {
	return Config{
		Server: ServerConfig{
			Port:         getEnv("PORT", "8080"),
			Host:         getEnv("HOST", "localhost"),
			ReadTimeout:  15 * time.Second,
			WriteTimeout: 15 * time.Second,
		},
		JWT: JWTConfig{
			Secret:             getEnv("JWT_SECRET", "your-secret-key-change-in-production"),
			AccessTokenExpiry:  getEnv("ACCESS_TOKEN_EXPIRY", "10m"),
			RefreshTokenExpiry: getEnv("REFRESH_TOKEN_EXPIRY", "1d"),
		},
		Database: DatabaseConfig{
			URL:              getEnv("POSTGRES_DATABASE_URL", ""),
			ImageStoragePath: getEnv("IMAGE_STORAGE_PATH", "./uploads"),
		},
		Razorpay: RazorpayConfig{
			KeyID:  getEnv("RAZORPAY_KEY_ID", ""),
			Secret: getEnv("RAZORPAY_KEY_SECRET", ""),
		},
		Email: EmailConfig{
			SMTPHost: getEnv("SMTP_HOST", ""), SMTPPort: getEnv("SMTP_PORT", "587"),
			SMTPUsername: getEnv("SMTP_USERNAME", ""), SMTPPassword: getEnv("SMTP_PASSWORD", ""),
			From: getEnv("EMAIL_FROM", ""),
		},
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
