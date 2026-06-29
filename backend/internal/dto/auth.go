package dto

type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,strong_password"`
}

type SignupRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,strong_password"`
}

type AuthResponse struct {
	ID                    int    `json:"id"`
	Email                 string `json:"email"`
	Role                  string `json:"role"`
	AccessToken           string `json:"-"`
	RefreshToken          string `json:"-"`
	RefreshTokenExpiresIn int    `json:"-"`
	AccessTokenExpiresIn  int    `json:"-"`
}
