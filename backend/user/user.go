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

func (u *UserService) SendLoginCommand() (string, error) {
	err := u.authService.Send(`{"type":"login","username":"admin","password":"123456"}\n`)
	if err != nil {
		return "", err
	}
	return u.authService.Read()
}
