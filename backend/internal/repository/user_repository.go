package repository

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/Himanshu0208/vedic-puja-sanskar/backend/internal/dto"
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
		"SELECT id, email, password, is_admin, created_at, full_name, phone, gender FROM users WHERE email = $1",
		email,
	).Scan(&user.ID, &user.Email, &user.Password, &user.IsAdmin, &user.CreatedAt, &user.FullName, &user.Phone, &user.Gender)

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
		"SELECT id, email, password, is_admin, created_at, full_name, phone, gender FROM users WHERE id = $1",
		id,
	).Scan(&user.ID, &user.Email, &user.Password, &user.IsAdmin, &user.CreatedAt, &user.FullName, &user.Phone, &user.Gender)

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
		`INSERT INTO users (email, password, is_admin, full_name, phone, gender)
		 VALUES ($1, $2, $3, $4, $5, $6)
		 ON CONFLICT (email)
		 DO UPDATE SET password = $2, is_admin = $3, updated_at = CURRENT_TIMESTAMP
		 RETURNING id`,
		user.Email, user.Password, user.IsAdmin, user.FullName, user.Phone, user.Gender,
	).Scan(&id)

	if err != nil {
		return nil, err
	}

	user.ID = id

	return user, nil
}

func (ur *UserRepository) UpdateProfile(userID int, fullName, phone, gender string) error {
	result, err := ur.db.Exec(`UPDATE users SET full_name=$1, phone=$2, gender=CASE WHEN gender='' THEN $3 ELSE gender END, updated_at=CURRENT_TIMESTAMP WHERE id=$4`, fullName, phone, gender, userID)
	if err != nil {
		return err
	}
	count, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if count == 0 {
		return fmt.Errorf("user not found")
	}
	return nil
}

func (ur *UserRepository) GetWishlist(userID int) ([]int, error) {
	rows, err := ur.db.Query(`SELECT product_id FROM user_wishlist WHERE user_id=$1 ORDER BY created_at DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	ids := make([]int, 0)
	for rows.Next() {
		var id int
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		ids = append(ids, id)
	}
	return ids, rows.Err()
}

func (ur *UserRepository) AddWishlist(userID, productID int) error {
	_, err := ur.db.Exec(`INSERT INTO user_wishlist (user_id, product_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, userID, productID)
	return err
}

func (ur *UserRepository) RemoveWishlist(userID, productID int) error {
	_, err := ur.db.Exec(`DELETE FROM user_wishlist WHERE user_id=$1 AND product_id=$2`, userID, productID)
	return err
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

func (ur *UserRepository) GetAdminUsers(page, pageSize int, search string) (*dto.AdminUserList, error) {
	filter := ` WHERE ($1='' OR u.email ILIKE '%'||$1||'%' OR COALESCE(u.full_name,'') ILIKE '%'||$1||'%')`
	result := &dto.AdminUserList{Users: make([]dto.AdminUser, 0), Page: page, PageSize: pageSize}
	if err := ur.db.QueryRow(`SELECT COUNT(*) FROM users u`+filter, search).Scan(&result.Total); err != nil {
		return nil, err
	}
	result.TotalPages = (result.Total + pageSize - 1) / pageSize
	rows, err := ur.db.Query(`SELECT u.id,u.email,u.is_admin,u.created_at,COUNT(o.id)
		FROM users u LEFT JOIN orders o ON o.user_id=u.id`+filter+`
		GROUP BY u.id, u.email, u.is_admin, u.created_at ORDER BY u.created_at DESC, u.id DESC LIMIT $2 OFFSET $3`, search, pageSize, (page-1)*pageSize)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var user dto.AdminUser
		var isAdmin bool
		if err := rows.Scan(&user.ID, &user.Email, &isAdmin, &user.CreatedAt, &user.OrderCount); err != nil {
			return nil, err
		}
		user.Role = "user"
		if isAdmin {
			user.Role = "admin"
		}
		result.Users = append(result.Users, user)
	}
	return result, rows.Err()
}

func (ur *UserRepository) GetUserIdFromRefreshToken(token string) (int, error) {
	var userId int
	err := ur.db.QueryRow("SELECT user_id FROM refresh_tokens WHERE token=$1", token).Scan(&userId)
	if err != nil {
		return -1, err
	}

	return userId, nil
}

func (ur *UserRepository) SaveRefreshToken(userID int, token string, expiresAt time.Time) error {
	_, err := ur.db.Exec(
		"INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)",
		userID, token, expiresAt,
	)
	return err
}

func (ur *UserRepository) DeleteRefreshTokenByToken(token string) error {
	_, err := ur.db.Exec(
		"DELETE FROM refresh_tokens WHERE token = $1",
		token,
	)
	return err
}

func (ur *UserRepository) DeleteRefreshTokenByUserID(userID int) error {
	_, err := ur.db.Exec(
		"DELETE FROM refresh_tokens WHERE user_id = $1",
		userID,
	)
	return err
}
