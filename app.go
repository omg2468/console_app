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

func (a *App) ShowInfoDialog(message string) {
	runtime.MessageDialog(a.ctx, runtime.MessageDialogOptions{
		Title:   "Thông báo",
		Message: message,
		Type:    runtime.InfoDialog,
	})
}

func (a *App) ShowErrorDialog(message string) {
	runtime.MessageDialog(a.ctx, runtime.MessageDialogOptions{
		Title:   "Error",
		Message: message,
		Type:    runtime.ErrorDialog,
	})
}

func (a *App) ShowQuestionDialog(message string) {
	runtime.MessageDialog(a.ctx, runtime.MessageDialogOptions{
		Title:   "Xác nhận",
		Message: message,
		Type:    runtime.QuestionDialog,
	})
}

func (a *App) SelectFileToImport() (string, error) {
	options := runtime.OpenDialogOptions{
		Title: "Chọn file để nhập",
		Filters: []runtime.FileFilter{
			{DisplayName: "JSON Files (*.json)", Pattern: "*.json"},
		},
	}

	selectedFile, err := runtime.OpenFileDialog(a.ctx, options)
	if err != nil {
		// runtime.OpenFileDialog có thể trả về lỗi nếu người dùng hủy bỏ (cancel)
		// hoặc có lỗi hệ thống.
		if errors.Is(err, context.Canceled) { // Kiểm tra nếu người dùng hủy bỏ
			return "", fmt.Errorf("Người dùng hủy bỏ") // Trả về rỗng và nil error nếu bị hủy
		}
		return "", fmt.Errorf("Lỗi khi mở hộp thoại chọn file")
	}

	if selectedFile == "" {
		return "", fmt.Errorf("Không chọn file")
	}

	return selectedFile, nil
}

func (a *App) SelectFileToExport(defaultName string) (string, error) {
	options := runtime.SaveDialogOptions{
		Title:           "Chọn nơi lưu file",
		DefaultFilename: defaultName, // Tên mặc định, ví dụ: "data.json"
		Filters: []runtime.FileFilter{
			{DisplayName: "JSON Files (*.json)", Pattern: "*.json"},
			{DisplayName: "All Files (*.*)", Pattern: "*.*"},
		},
	}

	selectedPath, err := runtime.SaveFileDialog(a.ctx, options)
	if err != nil {
		if errors.Is(err, context.Canceled) {
			return "", nil // Người dùng hủy
		}
		return "", fmt.Errorf("Lỗi khi chọn nơi lưu file: %w", err)
	}

	if selectedPath == "" {
		return "", nil // Không chọn file
	}

	return selectedPath, nil
}
