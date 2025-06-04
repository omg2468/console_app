package workspace

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
)

type WorkspaceService struct {
    basePath string
}

type FileNode struct {
    Name     string      `json:"name"`
    Type     string      `json:"type"` // "file" or "folder"
    Modified string      `json:"modified,omitempty"`
    Children []FileNode  `json:"children,omitempty"`
}

func NewWorkspaceService() *WorkspaceService {
    return &WorkspaceService{
        basePath: "./workspace",
    }
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


