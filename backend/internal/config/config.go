package config

import (
	"os"
	"strconv"
	"time"
)

// Config holds all configuration for the application
type Config struct {
	Server   ServerConfig
	JWT      JWTConfig
	Database DatabaseConfig
	Auth     AuthConfig
}

// AuthConfig holds authentication-related configuration
type AuthConfig struct {
	DefaultAdminEmail       string
	DefaultAdminPassword    string
	DefaultDevUserEmail     string
	DefaultDevUserPassword  string
	DefaultDevAdminEmail    string
	DefaultDevAdminPassword string
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
	Secret                   string
	AccessTokenExpiryMinutes int
	RefreshTokenExpiryDays   int
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
			Port:         getEnvString("PORT", "8080"),
			Host:         getEnvString("HOST", "localhost"),
			ReadTimeout:  15 * time.Second,
			WriteTimeout: 15 * time.Second,
		},
		JWT: JWTConfig{
			Secret:                   getEnvString("JWT_SECRET", "your-secret-key-change-in-production"),
			AccessTokenExpiryMinutes: getEnvInt("ACCESS_TOKEN_EXPIRY", 15),
			RefreshTokenExpiryDays:   getEnvInt("REFRESH_TOKEN_EXPIRY", 7),
		},
		Database: DatabaseConfig{
			URL:              getEnvString("POSTGRES_DATABASE_URL", ""),
			ImageStoragePath: getEnvString("IMAGE_STORAGE_PATH", "./uploads"),
		},
		Auth: AuthConfig{
			DefaultAdminEmail:       getEnvString("DEFAULT_ADMIN_EMAIL", "admin@vedic-puja.com"),
			DefaultAdminPassword:    getEnvString("DEFAULT_ADMIN_PASSWORD", "Admin@123"),
			DefaultDevAdminEmail:    getEnvString("DEFAULT_DEV_ADMIN_EMAIL", "dev-admin@vedic-puja.com"),
			DefaultDevAdminPassword: getEnvString("DEFAULT_DEV_ADMIN_PASSWORD", "Dev@123"),
			DefaultDevUserEmail:     getEnvString("DEFAULT_DEV_USER_EMAIL", "dev-user@vedic-puja.com"),
			DefaultDevUserPassword:  getEnvString("DEFAULT_DEV_USER_PASSWORD", "Dev@123"),
		},
	}
}

func getEnvString(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvInt(key string, defaultValue int) int {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}

	num, err := strconv.Atoi(value)
	if err != nil {
		return defaultValue
	}
	return num
}
