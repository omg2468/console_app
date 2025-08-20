package main

import (
	"embed"
	"myproject/backend/auth"
	"myproject/backend/control"
	"myproject/backend/user"
	"myproject/backend/workspace"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	// Create an instance of the app structure
	app := NewApp()
	authService := auth.NewAuthService()
	controlService := control.NewControlService(authService)
	userService := user.NewUserService(authService)
	workspaceService := workspace.NewWorkspaceService(authService)

	// Create application with options
	err := wails.Run(&options.App{
		Title:         "DataLogger",
		Width:         1224,
		Height:        800,
		MinWidth:      1100,
		MinHeight:     700,
		DisableResize: false,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup:        app.startup,
		Bind: []interface{}{
			app,
			userService,
			workspaceService,
			authService,
			controlService,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
