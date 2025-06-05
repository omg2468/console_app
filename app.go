package main

import (
	"context"
	"errors"
	"fmt"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx context.Context
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	a.ShowInfoDialog()
	fmt.Println("Greet called with name:", name)
	return fmt.Sprintf("Hello %s, It's show time!", name)
}

func (a *App) GetContext() string {
	return "Context is active"
}

func (a *App) ShowInfoDialog() {
	fmt.Println("Showing info dialog")
	runtime.MessageDialog(a.ctx, runtime.MessageDialogOptions{
		Title:   "Thông báo",
		Message: "Đây là một thông báo thông tin từ Wails!",
		Type:    runtime.InfoDialog,
	})
}


func (a *App) SelectFileToImport() (string, error) {
	options := runtime.OpenDialogOptions{
		Title: "Chọn file để nhập",
		Filters: []runtime.FileFilter{
			{DisplayName: "All Files (*.*)", Pattern: "*.*"},
			{DisplayName: "JSON Files (*.json)", Pattern: "*.json"},
			{DisplayName: "Text Files (*.txt)", Pattern: "*.txt"},
		},
	}

	selectedFile, err := runtime.OpenFileDialog(a.ctx, options)
	if err != nil {
		// runtime.OpenFileDialog có thể trả về lỗi nếu người dùng hủy bỏ (cancel)
		// hoặc có lỗi hệ thống.
		if errors.Is(err, context.Canceled) { // Kiểm tra nếu người dùng hủy bỏ
			return "", nil // Trả về rỗng và nil error nếu bị hủy
		}
		return "", fmt.Errorf("Lỗi khi mở hộp thoại chọn file: %w", err)
	}

	if selectedFile == "" {
		return "", nil // Người dùng không chọn file nào
	}

	return selectedFile, nil
}