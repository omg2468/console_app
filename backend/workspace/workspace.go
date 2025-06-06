package workspace

import (
    _ "embed" // để nhúng file JSON mẫu
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"myproject/backend/auth"
)

//go:embed test.json
var testTemplate []byte

type WorkspaceService struct {
	basePath  string
	ctx       context.Context
	clipboard *Clipboard
	authService *auth.AuthService
}

type FileNode struct {
	Name     string     `json:"name"`
	Type     string     `json:"type"` // "file" or "folder"
	Modified string     `json:"modified,omitempty"`
	Children []FileNode `json:"children,omitempty"`
}

type ClipboardAction string

const (
	ActionCopy ClipboardAction = "copy"
)

type Clipboard struct {
	SourcePath string
	Action     ClipboardAction
}

func NewWorkspaceService(authService *auth.AuthService) *WorkspaceService {
	return &WorkspaceService{
		authService: authService,
		basePath: "./workspace",
	}
}

func (ws *WorkspaceService) SetContext(ctx context.Context) {
	ws.ctx = ctx
}

func buildFileTree(path string) ([]FileNode, error) {
	entries, err := os.ReadDir(path)
	if err != nil {
		return nil, err
	}

	var nodes []FileNode

	for _, entry := range entries {
		fullPath := filepath.Join(path, entry.Name())
		info, err := entry.Info()
		if err != nil {
			return nil, err
		}

		node := FileNode{
			Name:     entry.Name(),
			Type:     "file",
			Modified: info.ModTime().Format("2006-01-02 15:04:05"),
		}

		if entry.IsDir() {
			node.Type = "folder"
			children, err := buildFileTree(fullPath)
			if err != nil {
				return nil, err
			}
			node.Children = children
		} else if filepath.Ext(entry.Name()) != ".json" {
			continue // bỏ qua các file không phải json
		}

		nodes = append(nodes, node)
	}

	return nodes, nil
}

func generateUniqueFilename(dir, filename string) (string, error) {
	ext := filepath.Ext(filename)
	name := strings.TrimSuffix(filename, ext)

	candidate := filename
	i := 1

	for {
		fullPath := filepath.Join(dir, candidate)
		if _, err := os.Stat(fullPath); os.IsNotExist(err) {
			return candidate, nil // chưa tồn tại → dùng được
		}
		// Tăng số
		candidate = fmt.Sprintf("%s (%d)%s", name, i, ext)
		i++
		if i > 1000 {
			return "", fmt.Errorf("quá nhiều file trùng tên")
		}
	}
}

func (ws *WorkspaceService) ListFiles() ([]FileNode, error) {
	return buildFileTree(ws.basePath)
}

func (ws *WorkspaceService) ReadFile(relPath string, v interface{}) error {
	absPath := filepath.Join(ws.basePath, relPath)

	data, err := os.ReadFile(absPath)
	if err != nil {
		return err
	}

	return json.Unmarshal(data, v)
}

func (ws *WorkspaceService) DeleteFile(relPath string) error {
	absPath := filepath.Join(ws.basePath, relPath)

	if _, err := os.Stat(absPath); errors.Is(err, os.ErrNotExist) {
		return errors.New("file không tồn tại")
	}

	return os.Remove(absPath)
}

func (ws *WorkspaceService) GetWorkspacePath() (string, error) {
	absPath, err := filepath.Abs(ws.basePath)
	if err != nil {
		return "", err
	}
	return absPath, nil
}

func (ws *WorkspaceService) CreateFolder(name string) (string, error) {
	// Lấy đường dẫn workspace
	absPath, err := ws.GetWorkspacePath()
	if err != nil {
		return "", fmt.Errorf("Không thể lấy đường dẫn workspace: %w", err)
	}

	// Sinh tên thư mục không trùng
	uniqueName, err := generateUniqueFilename(absPath, name)
	if err != nil {
		return "", fmt.Errorf("Không thể tạo tên thư mục không trùng: %w", err)
	}

	newFolderPath := filepath.Join(absPath, uniqueName)

	// Tạo thư mục
	err = os.MkdirAll(newFolderPath, 0755)
	if err != nil {
		return "", fmt.Errorf("Không thể tạo thư mục '%s': %w", uniqueName, err)
	}

	fmt.Printf("✅ Đã tạo thư mục: %s\n", newFolderPath)
	return uniqueName, nil // trả về tên thư mục vừa tạo
}

func (ws *WorkspaceService) ShowInExplorer(path string) error {
	switch runtime.GOOS {
	case "windows":
		fmt.Println("Opening in Windows Explorer:", path)
		return exec.Command("explorer", path).Start()
	case "darwin": // macOS
		return exec.Command("open", path).Start()
	case "linux":
		return exec.Command("xdg-open", path).Start()
	default:
		return nil // hoặc trả lỗi unsupported OS
	}
}

func (ws *WorkspaceService) ImportFile(sourcePath string, filename string) error {
	src, err := os.Open(sourcePath)
	if err != nil {
		return err
	}
	defer src.Close()

	absPath, err := ws.GetWorkspacePath()
	if err != nil {
		return fmt.Errorf("Không thể lấy đường dẫn workspace: %w", err)
	}

	// Tạo tên file không trùng
	uniqueName, err := generateUniqueFilename(absPath, filename)
	if err != nil {
		return fmt.Errorf("Không thể tạo tên file mới: %w", err)
	}

	fmt.Printf("Đang nhập file từ: %s\n", uniqueName)

	targetPath := filepath.Join(absPath, uniqueName)

	dst, err := os.Create(targetPath)
	if err != nil {
		return err
	}
	defer dst.Close()

	written, err := io.Copy(dst, src)
	if err != nil {
		return fmt.Errorf("Lỗi khi copy nội dung: %w", err)
	}

	if written == 0 {
		return fmt.Errorf("File đã tạo nhưng nội dung không được copy (0 byte)")
	}

	return nil
}

func (ws *WorkspaceService) SetClipboard(sourcePath string) {
	ws.clipboard = &Clipboard{
		SourcePath: sourcePath,
		Action:     ActionCopy,
	}
}

func (ws *WorkspaceService) Paste() (string, error) {
	if ws.clipboard == nil {
		return "", fmt.Errorf("Clipboard rỗng, chưa có file để paste")
	}

	sourcePath := ws.clipboard.SourcePath

	absPath, err := ws.GetWorkspacePath()
	if err != nil {
		return "", fmt.Errorf("Không thể lấy đường dẫn workspace: %w", err)
	}

	filename := filepath.Base(sourcePath)

	uniqueName, err := generateUniqueFilename(absPath, filename)
	if err != nil {
		return "", err
	}

	targetPath := filepath.Join(absPath, uniqueName)

	src, err := os.Open(sourcePath)
	if err != nil {
		return "", fmt.Errorf("Không thể mở file nguồn: %w", err)
	}
	defer src.Close()

	dst, err := os.Create(targetPath)
	if err != nil {
		return "", fmt.Errorf("Không thể tạo file đích: %w", err)
	}
	defer dst.Close()

	_, err = io.Copy(dst, src)
	if err != nil {
		return "", fmt.Errorf("Lỗi khi copy nội dung: %w", err)
	}

	ws.clipboard = nil

	return targetPath, nil
}

func (ws *WorkspaceService) NewProject(name string) error {
	// Lấy đường dẫn workspace
	workspacePath, err := ws.GetWorkspacePath()
	if err != nil {
		return fmt.Errorf("Không thể lấy đường dẫn workspace: %w", err)
	}

	// Sinh tên file không trùng
	uniqueName, err := generateUniqueFilename(workspacePath, name)
	if err != nil {
		return fmt.Errorf("Không thể tạo tên dự án không trùng: %w", err)
	}

	targetPath := filepath.Join(workspacePath, uniqueName)

	// Tạo file mới và ghi nội dung đã nhúng từ testTemplate
	dst, err := os.Create(targetPath)
	if err != nil {
		return fmt.Errorf("Không thể tạo file mới: %w", err)
	}
	defer dst.Close()

	written, err := dst.Write(testTemplate)
	if err != nil {
		return fmt.Errorf("Lỗi khi ghi nội dung: %w", err)
	}
	if written == 0 {
		return fmt.Errorf("File đã tạo nhưng không có nội dung (0 byte)")
	}

	fmt.Printf("✅ Dự án mới đã được tạo: %s (%d bytes)\n", targetPath, written)
	return nil
}
