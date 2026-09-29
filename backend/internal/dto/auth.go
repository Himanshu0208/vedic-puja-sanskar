package dto

type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,strong_password"`
}

type SignupRequest struct {
	FullName string `json:"fullName" validate:"required,max=120"`
	Phone    string `json:"phone" validate:"required,min=8,max=20"`
	Gender   string `json:"gender" validate:"required,oneof=male female other prefer_not_to_say"`
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,strong_password"`
}

type ProfileResponse struct {
	ID       int    `json:"id"`
	FullName string `json:"fullName"`
	Phone    string `json:"phone"`
	Gender   string `json:"gender"`
	Email    string `json:"email"`
	Role     string `json:"role"`
}

type UpdateProfileRequest struct {
	FullName string `json:"fullName" validate:"required,max=120"`
	Phone    string `json:"phone" validate:"required,min=8,max=20"`
	Gender   string `json:"gender" validate:"omitempty,oneof=male female other prefer_not_to_say"`
}

type WishlistRequest struct {
	ProductID int `json:"productId" validate:"required,gt=0"`
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
