package auth

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
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
	fmt.Println("Các cổng COM tìm thấy:", ports)
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

			if err != nil && !errors.Is(err, io.EOF) {
				a.readChan <- AuthEvent{Err: err}
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

func (a *AuthService) GetResponse(timeout time.Duration) (string, error) {
	select {
	case msg := <-a.readChan:
		if msg.Err != nil {
			return "", msg.Err
		}
		return msg.Data, nil
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

func (a *AuthService) Login(username string, password string) (error) {
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

	// Gửi JSON qua UART
	err = a.Send(string(jsonBytes))
	
	if err != nil {
		return fmt.Errorf("lỗi khi gửi dữ liệu đăng nhập: %w", err)
	}

	return nil
}
