package workspace

import (
	"context"
	_ "embed" // để nhúng file JSON mẫu
	"errors"
	"fmt"
	"io"
	"myproject/backend/auth"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
)

//go:embed test.json
var testTemplate []byte

type WorkspaceService struct {
	basePath    string
	ctx         context.Context
	clipboard   *Clipboard
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
		basePath:    "./workspace",
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

func (ws *WorkspaceService) ReadFile(relPath string) (string, error) {
    absPath := filepath.Join(ws.basePath, relPath)
    data, err := os.ReadFile(absPath)
    if err != nil {
        return "", err
    }
    if len(data) == 0 {
        return "", fmt.Errorf("File rỗng")
    }
    return string(data), nil
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





// CreateFolder tạo một thư mục mới.
func (ws *WorkspaceService) CreateFolder(name string) (string, error) {
	// Lấy đường dẫn workspace
	absPath, err := ws.GetWorkspacePath()
	if err != nil {
		return "", fmt.Errorf("không thể lấy đường dẫn workspace: %w", err)
	}

	newFolderPath := filepath.Join(absPath, name)

	// Kiểm tra nếu thư mục đã tồn tại
	if _, err := os.Stat(newFolderPath); err == nil {
		return "", fmt.Errorf("thư mục '%s' đã tồn tại", name)
	} else if !os.IsNotExist(err) {
		return "", fmt.Errorf("lỗi khi kiểm tra thư mục: %w", err)
	}

	// Tạo thư mục
	err = os.MkdirAll(newFolderPath, 0755)
	if err != nil {
		return "", fmt.Errorf("không thể tạo thư mục '%s': %w", name, err)
	}

	fmt.Printf("✅ Đã tạo thư mục: %s\n", newFolderPath)
	return name, nil
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

	targetPath := filepath.Join(absPath, filename)

	// Check if the file already exists
	if _, err := os.Stat(targetPath); err == nil {
		return fmt.Errorf("File '%s' đã tồn tại trong workspace", filename)
	} else if !os.IsNotExist(err) {
		// Another error occurred when checking file existence
		return fmt.Errorf("Không thể kiểm tra sự tồn tại của file: %w", err)
	}

	fmt.Printf("Đang nhập file từ: %s\n", sourcePath) // Changed this line to reflect the source path

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

func OverwriteFile(destinationPath string, source io.Reader) (int64, error) {
	// Mở hoặc tạo file đích.
	// os.Create sẽ tạo file nếu chưa tồn tại, hoặc ghi đè (truncate) file nếu đã tồn tại.
	dst, err := os.Create(destinationPath)
	if err != nil {
		return 0, fmt.Errorf("không thể tạo hoặc ghi đè file '%s': %w", destinationPath, err)
	}
	defer dst.Close() // Đảm bảo đóng file đích khi hàm kết thúc

	// Sao chép nội dung từ nguồn sang đích
	written, err := io.Copy(dst, source)
	if err != nil {
		return 0, fmt.Errorf("lỗi khi sao chép nội dung vào file '%s': %w", destinationPath, err)
	}

	return written, nil
}

func (ws *WorkspaceService) RenameItem(sourceName string, newName string) error {
	// Lấy đường dẫn workspace
	absPath, err := ws.GetWorkspacePath()
	if err != nil {
		return fmt.Errorf("không thể lấy đường dẫn workspace: %w", err)
	}

	// Xây dựng đường dẫn đầy đủ cho nguồn và đích
	sourcePath := filepath.Join(absPath, sourceName)
	newPath := filepath.Join(absPath, newName)

	// Kiểm tra xem nguồn có tồn tại không
	if _, err := os.Stat(sourcePath); os.IsNotExist(err) {
		return fmt.Errorf("nguồn '%s' không tồn tại để đổi tên", sourceName)
	} else if err != nil {
		return fmt.Errorf("lỗi khi kiểm tra nguồn '%s': %w", sourceName, err)
	}

	// Kiểm tra xem đích đã tồn tại chưa để tránh ghi đè ngầm định
	// Tùy thuộc vào yêu cầu, bạn có thể bỏ qua kiểm tra này nếu muốn ghi đè
	if _, err := os.Stat(newPath); err == nil {
		return fmt.Errorf("đích '%s' đã tồn tại. Vui lòng chọn tên khác hoặc xóa đích trước.", newName)
	} else if !os.IsNotExist(err) {
		return fmt.Errorf("lỗi khi kiểm tra đích '%s': %w", newName, err)
	}

	// Thực hiện đổi tên/di chuyển
	err = os.Rename(sourcePath, newPath)
	if err != nil {
		return fmt.Errorf("không thể đổi tên '%s' thành '%s': %w", sourceName, newName, err)
	}

	fmt.Printf("✅ Đã đổi tên thành công: '%s' -> '%s'\n", sourceName, newName)
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

	targetPath := filepath.Join(workspacePath, name)

	// Kiểm tra nếu file đã tồn tại
	if _, err := os.Stat(targetPath); err == nil {
		return fmt.Errorf("File '%s' đã tồn tại trong workspace", name)
	} else if !os.IsNotExist(err) {
		return fmt.Errorf("Lỗi khi kiểm tra tồn tại file: %w", err)
	}

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
func (ws *WorkspaceService) DowloadConfig() error {
	return ws.authService.Send(`{"type":"download_config"}`)
}


func copyFile(src, dst string) (int64, error) {
	sourceFile, err := os.Open(src)
	if err != nil {
		return 0, fmt.Errorf("không thể mở file nguồn '%s': %w", src, err)
	}
	defer sourceFile.Close()

	destFile, err := os.Create(dst)
	if err != nil {
		return 0, fmt.Errorf("không thể tạo file đích '%s': %w", dst, err)
	}
	defer destFile.Close()

	nBytes, err := io.Copy(destFile, sourceFile)
	if err != nil {
		return 0, fmt.Errorf("lỗi khi sao chép nội dung từ '%s' sang '%s': %w", src, dst, err)
	}
	return nBytes, nil
}

// ExportJSONFile xuất một file JSON từ workspace ra một đường dẫn đích.
// jsonFileName là tên của file JSON (ví dụ: "config.json") trong workspace.
// destinationFolder là đường dẫn tuyệt đối đến thư mục đích bên ngoài workspace.
func (ws *WorkspaceService) ExportJSONFile(jsonFileName string, destinationFolder string) error {
	// Lấy đường dẫn tuyệt đối của workspace
	absWorkspacePath, err := ws.GetWorkspacePath()
	if err != nil {
		return fmt.Errorf("không thể lấy đường dẫn workspace: %w", err)
	}

	// Xây dựng đường dẫn đầy đủ của file JSON nguồn trong workspace
	sourceFullPath := filepath.Join(absWorkspacePath, jsonFileName)

	// Kiểm tra xem file nguồn có tồn tại không
	info, err := os.Stat(sourceFullPath)
	if os.IsNotExist(err) {
		return fmt.Errorf("file JSON '%s' không tồn tại trong workspace", jsonFileName)
	} else if err != nil {
		return fmt.Errorf("lỗi khi kiểm tra file nguồn '%s': %w", jsonFileName, err)
	}

	// Đảm bảo đây là một file, không phải thư mục
	if info.IsDir() {
		return fmt.Errorf("mục '%s' là một thư mục, không phải file JSON", jsonFileName)
	}

	// Kiểm tra phần mở rộng file để đảm bảo là .json
	if !strings.HasSuffix(strings.ToLower(jsonFileName), ".json") {
		return fmt.Errorf("file '%s' không phải là file JSON (không có phần mở rộng .json)", jsonFileName)
	}

	// Xây dựng đường dẫn đích đầy đủ cho file JSON
	destinationFullPath := filepath.Join(destinationFolder, jsonFileName)

	// Kiểm tra xem thư mục đích có tồn tại không
	if _, err := os.Stat(destinationFolder); os.IsNotExist(err) {
		return fmt.Errorf("thư mục đích '%s' không tồn tại", destinationFolder)
	} else if err != nil {
		return fmt.Errorf("lỗi khi kiểm tra thư mục đích '%s': %w", destinationFolder, err)
	}

	fmt.Printf("Đang xuất file JSON '%s' từ '%s' sang '%s'...\n", jsonFileName, absWorkspacePath, destinationFolder)

	// Sao chép file
	_, err = copyFile(sourceFullPath, destinationFullPath)
	if err != nil {
		return fmt.Errorf("lỗi khi xuất file JSON '%s': %w", jsonFileName, err)
	}

	fmt.Printf("✅ Đã xuất thành công file JSON '%s' sang '%s'.\n", jsonFileName, destinationFullPath)
	return nil
}

func (ws *WorkspaceService) DeleteItem(itemName string) error {
	// Lấy đường dẫn tuyệt đối của workspace
	absPath, err := ws.GetWorkspacePath()
	if err != nil {
		return fmt.Errorf("không thể lấy đường dẫn workspace: %w", err)
	}

	// Xây dựng đường dẫn đầy đủ của mục cần xóa
	itemFullPath := filepath.Join(absPath, itemName)

	// Kiểm tra xem mục có tồn tại không
	info, err := os.Stat(itemFullPath)
	if os.IsNotExist(err) {
		return fmt.Errorf("mục '%s' không tồn tại trong workspace để xóa", itemName)
	} else if err != nil {
		return fmt.Errorf("lỗi khi kiểm tra mục '%s': %w", itemName, err)
	}

	// Thực hiện xóa
	err = os.RemoveAll(itemFullPath)
	if err != nil {
		// Kiểm tra lại lỗi nếu có vấn đề về quyền truy cập
		if os.IsPermission(err) {
			return fmt.Errorf("không có quyền xóa '%s': %w", itemName, err)
		}
		return fmt.Errorf("không thể xóa '%s': %w", itemName, err)
	}

	if info.IsDir() {
		fmt.Printf("✅ Đã xóa thư mục và tất cả nội dung bên trong: '%s'\n", itemName)
	} else {
		fmt.Printf("✅ Đã xóa file: '%s'\n", itemName)
	}

	return nil
}

