package user

type UserService struct{}

func NewUserService() *UserService {
    return &UserService{}
}

func (u *UserService) GetUsername() string {
    return "chatgpt"
}
