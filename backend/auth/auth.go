package auth

import (
	"errors"
	"fmt"
	"sync"
	"time"

	serial "go.bug.st/serial.v1"
)

type AuthService struct {
	currentPort serial.Port
	portName    string
	mu          sync.Mutex
}

func NewAuthService() *AuthService {
	return &AuthService{}
}

// ListPorts trả về danh sách cổng COM có trên hệ thống
func (a *AuthService) ListPorts() ([]string, error) {
	ports, err := serial.GetPortsList()
	if err != nil {
		return nil, err
	}
	if len(ports) == 0 {
		return nil, errors.New("không tìm thấy cổng COM nào")
	}
	fmt.Println("Các cổng COM tìm thấy:", ports)
	return ports, nil
}

// ConnectToPort mở kết nối với cổng COM chỉ định
func (a *AuthService) ConnectToPort(portName string) error {
	a.mu.Lock()
	defer a.mu.Unlock()

	if a.currentPort != nil {
		a.currentPort.Close()
		a.currentPort = nil
		a.portName = ""
	}

	mode := &serial.Mode{
		BaudRate: 115200,
		DataBits: 8,
		Parity:   serial.NoParity,
		StopBits: serial.OneStopBit,
	}

	port, err := serial.Open(portName, mode)
	if err != nil {
		return fmt.Errorf("kết nối %s thất bại: %w", portName, err)
	}

	a.currentPort = port
	a.portName = portName

	fmt.Printf("Đã kết nối tới %s\n", portName)
	return nil
}

// Send gửi dữ liệu tới cổng COM đang kết nối
func (a *AuthService) Send(data string) error {
	a.mu.Lock()
	defer a.mu.Unlock()

	if a.currentPort == nil {
		return errors.New("chưa kết nối cổng COM")
	}

	_, err := a.currentPort.Write([]byte(data + "\n"))
	if err != nil {
		return fmt.Errorf("gửi dữ liệu thất bại: %w", err)
	}

	fmt.Printf("Đã gửi: %s\n", data)
	return nil
}

func (a *AuthService) Read() (string, error) {
	a.mu.Lock()
	defer a.mu.Unlock()

	if a.currentPort == nil {
		return "", errors.New("chưa kết nối cổng COM")
	}

	var result []byte
	buf := make([]byte, 1) // đọc từng byte để kiểm tra kết thúc bằng \n

	timeout := time.After(3 * time.Second)
	for {
		select {
		case <-timeout:
			return "", errors.New("đọc dữ liệu timeout sau 3 giây")
		default:
			n, err := a.currentPort.Read(buf)
			if err != nil {
				return "", fmt.Errorf("đọc dữ liệu thất bại: %w", err)
			}
			if n > 0 {
				result = append(result, buf[0])
				if buf[0] == '\n' {
					return string(result), nil
				}
			}
		}
	}
}

// Disconnect đóng kết nối hiện tại
func (a *AuthService) Disconnect() error {
	a.mu.Lock()
	defer a.mu.Unlock()

	if a.currentPort != nil {
		err := a.currentPort.Close()
		a.currentPort = nil
		a.portName = ""
		if err != nil {
			return fmt.Errorf("ngắt kết nối lỗi: %w", err)
		}
		fmt.Println("Đã ngắt kết nối")
	}
	return nil
}
