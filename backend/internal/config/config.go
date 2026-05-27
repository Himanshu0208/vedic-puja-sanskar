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
	Secret            string
	ExpirationHours   int
	RefreshExpiryDays int
}

// DatabaseConfig holds database configuration
type DatabaseConfig struct {
	URL         string
	StoragePath string // kept for backward compatibility
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
			Secret:            getEnv("JWT_SECRET", "your-secret-key-change-in-production"),
			ExpirationHours:   24,
			RefreshExpiryDays: 7,
		},
		Database: DatabaseConfig{
			URL:         getEnv("POSTGRES_DATABASE_URL", ""),
			StoragePath: getEnv("STORAGE_PATH", "./data"),
		},
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
