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
	return c.authService.Send(`{"type":"read_analog", "data":"enable"}`)
}

func (c *ControlService) StopReadAnalog() error {
	return c.authService.Send(`{"type":"read_analog", "data":"disable"}`)
}

func (c *ControlService) ReadMemoryView() error {
	return c.authService.Send(`{"type":"read_memory_view", "data":"enable"}`)
}

func (c *ControlService) StopReadMemoryView() error {
	return c.authService.Send(`{"type":"read_memory_view", "data":"disable"}`)
}

func (c *ControlService) SetRTC(mode string, ts int64) error {
	data := map[string]interface{}{
		"type": "set_rtc",
		"mode": mode,
		"ts":   ts,
	}
	payload, err := json.Marshal(data)
	if err != nil {
		return err
	}
	return c.authService.Send(string(payload))
}

func (c *ControlService) GetRTC() error {
	return c.authService.Send(`{"type":"get_rtc"}`)
}

func (c *ControlService) GetMeasureMode() error {
	return c.authService.Send(`{"type":"get_measure_mode"}`)
}

func (c *ControlService) SetMeasureMode(mode string) error {
	data := map[string]string{
		"type": "set_measure_mode",
		"mode": mode,
	}
	payload, err := json.Marshal(data)
	if err != nil {
		return err
	}
	return c.authService.Send(string(payload))
}

func (c *ControlService) ReadTagView() error {
	return c.authService.Send(`{"type":"read_tag_view", "data":"enable"}`)
}

func (c *ControlService) StopReadTagView() error {
	return c.authService.Send(`{"type":"read_tag_view", "data":"disable"}`)
}

func (c *ControlService) Calib4ma() error {
	return c.authService.Send(`{"type":"calib_4ma"}`)
}

func (c *ControlService) Calib16ma() error {
	return c.authService.Send(`{"type":"calib_16ma"}`)
}

func (c *ControlService) ReadSystemInfo() error {
	return c.authService.Send(`{"type":"read_system_info"}`)
}

func (c *ControlService) WriteMacAddress(macAddress string) error {
	message := map[string]interface{}{
		"type": "write_mac",
		"data": macAddress,
	}
	finalData, err := json.Marshal(message)
	if err != nil {
		return fmt.Errorf("marshal lỗi: %w", err)
	}
	return c.authService.Send(string(finalData))
}	

func (c *ControlService) ResetConfiguration() error {
	return c.authService.Send(`{"type":"reset_configuration"}`)
}

func (c *ControlService) Reboot() error {
	return c.authService.Send(`{"type":"reboot"}`)
}

func (c *ControlService) ReadSimInfo() error {
	return c.authService.Send(`{"type":"read_sim_info"}`)
}

func (c *ControlService) ReadSdcardInfo() error {
	return c.authService.Send(`{"type":"read_sdcard_info"}`)
}

func (c *ControlService) Ping(ip string) error {
	message := fmt.Sprintf(`{"type":"ping","data":"%s"}`, ip)
	return c.authService.Send(message)
}

func (c *ControlService) WriteSerialNumber(serialNumber string) error {
	message := map[string]interface{}{
		"type": "write_serial_number",
		"data": serialNumber,
	}

	finalData, err := json.Marshal(message)
	if err != nil {
		return fmt.Errorf("marshal lỗi: %w", err)
	}

	return c.authService.Send(string(finalData))
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

func (c *ControlService) SetDigitalOutput(outputStates []bool) error {
	if len(outputStates) != 8 {
		return fmt.Errorf("outputStates phải có đúng 12 phần tử")
	}

	intStates := make([]int, len(outputStates))
	for i, v := range outputStates {
		if v {
			intStates[i] = 1
		} else {
			intStates[i] = 0
		}
	}

	message := map[string]interface{}{
		"type": "set_digital_output",
		"data": intStates,
	}

	finalData, err := json.Marshal(message)
	if err != nil {
		return fmt.Errorf("marshal lỗi: %w", err)
	}

	return c.authService.Send(string(finalData))
}

