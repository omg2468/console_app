package user

import "myproject/backend/auth"

type UserService struct {
	authService *auth.AuthService
}

func NewUserService(authService *auth.AuthService) *UserService {
	return &UserService{authService: authService}
}

func (u *UserService) GetUsername() string {
	return "chatgpt"
}
