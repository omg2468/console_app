package main

import (
	"embed"
	"myproject/backend/user"
	"myproject/backend/workspace"
	"myproject/backend/auth"
	"myproject/backend/realTime"

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
	userService := user.NewUserService(authService)
	workspaceService := workspace.NewWorkspaceService(authService)
	realtimeService := realTime.NewRealtimeDataService(authService)

	// Create application with options
	err := wails.Run(&options.App{
		Title:  "myproject",
		Width:  1024,
		Height: 768,
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
			realtimeService,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
