package repository

import (
	"database/sql"
	"fmt"

	"github.com/Himanshu0208/vedic-puja-sanskar/backend/internal/models"
)

// UserRepository handles all user-related database operations
type UserRepository struct {
	db *sql.DB
}

// NewUserRepository creates a new user repository instance
func NewUserRepository(db *sql.DB) *UserRepository {
	return &UserRepository{db: db}
}

// GetUserByEmail retrieves a user by email
func (ur *UserRepository) GetUserByEmail(email string) (*models.User, error) {
	user := &models.User{}
	err := ur.db.QueryRow(
		"SELECT id, email, password, is_admin, created_at FROM users WHERE email = $1",
		email,
	).Scan(&user.ID, &user.Email, &user.Password, &user.IsAdmin, &user.CreatedAt)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("user not found")
	}
	if err != nil {
		return nil, err
	}

	if user.IsAdmin {
		user.Role = models.RoleAdmin
	} else {
		user.Role = models.RoleUser
	}
	return user, nil
}

// GetUserByID retrieves a user by ID
func (ur *UserRepository) GetUserByID(id int) (*models.User, error) {
	user := &models.User{}
	err := ur.db.QueryRow(
		"SELECT id, email, password, is_admin, created_at FROM users WHERE id = $1",
		id,
	).Scan(&user.ID, &user.Email, &user.Password, &user.IsAdmin, &user.CreatedAt)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("user not found")
	}
	if err != nil {
		return nil, err
	}

	return user, nil
}

// UserExists checks if a user exists by email
func (ur *UserRepository) UserExists(email string) bool {
	var exists bool
	err := ur.db.QueryRow("SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)", email).Scan(&exists)
	if err != nil {
		return false
	}
	return exists
}

// SaveUser saves or updates a user
func (ur *UserRepository) SaveUser(user *models.User) (*models.User, error) {
	if user.Email == "" {
		return nil, fmt.Errorf("user email is required")
	}

	var id int

	err := ur.db.QueryRow(
		`INSERT INTO users (email, password, is_admin)
		 VALUES ($1, $2, $3)
		 ON CONFLICT (email)
		 DO UPDATE SET password = $2, is_admin = $3, updated_at = CURRENT_TIMESTAMP
		 RETURNING id`,
		user.Email, user.Password, user.IsAdmin,
	).Scan(&id)

	if err != nil {
		return nil, err
	}

	user.ID = id // 👈 set the ID back in your struct (database generated)

	return user, nil
}

// GetAllUsers retrieves all users
func (ur *UserRepository) GetAllUsers() ([]*models.User, error) {
	rows, err := ur.db.Query("SELECT id, email, password, is_admin, created_at FROM users ORDER BY created_at DESC")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []*models.User
	for rows.Next() {
		user := &models.User{}
		err := rows.Scan(&user.ID, &user.Email, &user.Password, &user.IsAdmin, &user.CreatedAt)
		if err != nil {
			return nil, err
		}
		users = append(users, user)
	}

	return users, rows.Err()
}
