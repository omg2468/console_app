package auth

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	serial "go.bug.st/serial.v1"
)

type AuthService struct {
	currentPort serial.Port
	portName    string
	mu          sync.Mutex
	readChan    chan AuthEvent
	stopRead    chan struct{}
	isReading   atomic.Bool
}

type AuthEvent struct {
	Data string
	Err  error
}

func NewAuthService() *AuthService {
	return &AuthService{}
}

func (a *AuthService) ListPorts() ([]string, error) {
	ports, err := serial.GetPortsList()
	if err != nil {
		return nil, err
	}
	if len(ports) == 0 {
		return nil, errors.New("không tìm thấy cổng COM nào")
	}
	// fmt.Println("Các cổng COM tìm thấy:", ports)
	return ports, nil
}

func (a *AuthService) ConnectToPort(portName string) error {
	a.mu.Lock()
	defer a.mu.Unlock()

	if a.currentPort != nil {
		return errors.New("đã kết nối, vui lòng ngắt trước")
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
	a.readChan = make(chan AuthEvent, 100)
	a.stopRead = make(chan struct{})

	if !a.isReading.Load() {
		go a.readLoop()
		a.isReading.Store(true)
	}

	fmt.Printf("Đã kết nối COM: %s\n", portName)
	return nil
}

func (a *AuthService) readLoop() {
	log.Printf("Bắt đầu đọc COM: %s\n", a.portName)
	defer log.Printf("Dừng đọc COM: %s\n", a.portName)

	buf := make([]byte, 128)
	var buffer []byte

	for {
		select {
		case <-a.stopRead:
			return
		default:
			var port serial.Port

			a.mu.Lock()
			if a.currentPort == nil {
				a.mu.Unlock()
				time.Sleep(100 * time.Millisecond)
				continue
			}
			port = a.currentPort
			a.mu.Unlock()

			n, err := port.Read(buf)

			if err != nil {
				// Kiểm tra các lỗi dự kiến khi ngắt kết nối
				// Đặc biệt là lỗi "aborted" từ thư viện serial khi cổng đóng
				if errors.Is(err, io.EOF) ||
					strings.Contains(err.Error(), "aborted") ||
					strings.Contains(err.Error(), "disconnected") ||
					strings.Contains(err.Error(), "The handle is invalid") { // Thêm lỗi "handle is invalid" cho Windows
					log.Printf("Lỗi đọc COM %s (ngắt kết nối hoặc cổng không hợp lệ): %v", a.portName, err)
					// Đây là lỗi mong đợi khi ngắt kết nối, không gửi vào kênh lỗi
					return // Thoát khỏi readLoop
				}
				// Các lỗi khác không mong muốn thì gửi vào kênh lỗi và thoát
				log.Printf("Lỗi đọc COM %s không mong muốn: %v", a.portName, err)
				a.readChan <- AuthEvent{Err: err} // <--- CHỈ GỬI LỖI NẾU KHÔNG PHẢI LỖI DO NGẮT KẾT NỐI
				return
			}

			if n > 0 {
				buffer = append(buffer, buf[:n]...)
				for {
					newlineIndex := -1
					for i, b := range buffer {
						if b == '\n' {
							newlineIndex = i
							break
						}
					}
					if newlineIndex == -1 {
						break
					}
					a.readChan <- AuthEvent{Data: string(buffer[:newlineIndex+1])}
					buffer = buffer[newlineIndex+1:]
				}
			} else {
				time.Sleep(100 * time.Millisecond)
			}
		}
	}
}

func (a *AuthService) GetCurrentPort() string {
	a.mu.Lock()
	defer a.mu.Unlock()

	return a.portName
}

func (a *AuthService) GetResponse(timeout time.Duration) (string, error) {
	select {
	case msg := <-a.readChan:
		if msg.Err != nil {
			return "", msg.Err
		}
		return strings.TrimRight(msg.Data, "\n"), nil
	case <-time.After(timeout):
		return "", errors.New("timeout khi chờ phản hồi")
	}
}

func (a *AuthService) Send(data string) error {
	a.mu.Lock()
	defer a.mu.Unlock()

	if a.currentPort == nil {
		return errors.New("chưa kết nối cổng COM")
	}
	_, err := a.currentPort.Write([]byte(data + "\n"))
	if err != nil {
		return fmt.Errorf("lỗi khi gửi: %w", err)
	}

	return nil
}

func (a *AuthService) Disconnect() error {
	a.Send(`{"type":"logout"}`)
	a.mu.Lock()
	defer a.mu.Unlock()

	if a.currentPort != nil {
		if a.isReading.Load() {
			close(a.stopRead)
			a.isReading.Store(false)
		}
		a.currentPort.Close()
		a.currentPort = nil
		a.portName = ""
		fmt.Println("Đã ngắt kết nối")
	}
	return nil
}

func (a *AuthService) Login(username, password string) error {
	// Tạo JSON login request
	loginData := map[string]string{
		"type":     "login",
		"username": username,
		"password": password,
	}
	jsonBytes, err := json.Marshal(loginData)
	if err != nil {
		return fmt.Errorf("lỗi khi tạo JSON đăng nhập: %w", err)
	}

	return a.Send(string(jsonBytes))
}

func (a *AuthService) ChangePassword(oldPassword, newPassword string) error {
	changeData := map[string]string{
		"type":         "change_password",
		"old_password": oldPassword,
		"new_password": newPassword,
	}

	jsonBytes, err := json.Marshal(changeData)
	if err != nil {
		return fmt.Errorf("lỗi khi mã hóa JSON: %w", err)
	}

	return a.Send(string(jsonBytes))
}

func (a *AuthService) AddUser(username, password string) error {
	data := map[string]string{
		"type":     "add_user",
		"username": username,
		"password": password,
	}

	jsonBytes, err := json.Marshal(data)
	if err != nil {
		return fmt.Errorf("lỗi khi tạo JSON: %w", err)
	}

	return a.Send(string(jsonBytes))
}

func (a *AuthService) RemoveUser(username string) error {
	data := map[string]string{
		"type":     "remove_user",
		"username": username,
	}

	jsonBytes, err := json.Marshal(data)
	if err != nil {
		return fmt.Errorf("lỗi khi tạo JSON: %w", err)
	}

	return a.Send(string(jsonBytes))
}
