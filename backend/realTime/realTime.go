package realTime

import "myproject/backend/auth"

// RealtimeDataService quản lý và phân phối bản tin thời gian thực
type RealtimeService struct {
	authService *auth.AuthService
}

// NewRealtimeDataService khởi tạo service
func NewRealtimeDataService(authService *auth.AuthService) *RealtimeService {
	return &RealtimeService{authService: authService}
}
