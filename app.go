package main

import (
	"context"
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