package control

import (
	"encoding/json"
	"fmt"
	"myproject/backend/auth"
)

// ControlService quản lý và xử lý các lệnh điều khiển
type ControlService struct {
	authService *auth.AuthService
}

// NewControlService khởi tạo ControlService
func NewControlService(authService *auth.AuthService) *ControlService {
	return &ControlService{authService: authService}
}

func (c *ControlService) GetNetworkInfo() error {
	return c.authService.Send(`{"type":"network"}`)
}

func (c *ControlService) SettingNetwork(data map[string]interface{}) error {
	data["type"] = "network_setting"

	// Chuyển thành JSON
	finalData, err := json.Marshal(data)
	if err != nil {
		return fmt.Errorf("lỗi khi convert JSON: %w", err)
	}

	return c.authService.Send(string(finalData))
}

func (c *ControlService) ReadAnalog() error {
	return c.authService.Send(`{"type":"read_analog"}`)
}

func (c *ControlService) ReadMemoryView() error {
	return c.authService.Send(`{"type":"read_memory_view"}`)
}

func (c *ControlService) ReadTagView() error {
	return c.authService.Send(`{"type":"read_tag_view"}`)
}

func (c *ControlService) Calib4ma() error {
	return c.authService.Send(`{"type":"calib_4ma"}`)
}

func (c *ControlService) Calib16ma() error {
	return c.authService.Send(`{"type":"calib_16ma"}`)
}

func (c *ControlService) SetTime(timeArray []int) error {
	message := map[string]interface{}{
		"type": "set_time",
		"data": timeArray,
	}

	finalData, err := json.Marshal(message)
	if err != nil {
		return fmt.Errorf("marshal lỗi: %w", err)
	}

	return c.authService.Send(string(finalData))
}
