package workspace

import (
	"context"
	_ "embed" // để nhúng file JSON mẫu
	"encoding/json"
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
	FullPath string     `json:"fullPath,omitempty"` // Đường dẫn đầy đủ đến file hoặc thư mục, không trả về cho frontend
	Path     string     `json:"path,omitempty"` // Đường dẫn đầy đủ đến file hoặc thư mục
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
			FullPath: fullPath,
			Path:     strings.TrimPrefix(fullPath, "workspace"+string(os.PathSeparator)),
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

	fmt.Println("Đang đọc file:", absPath)

	data, err := os.ReadFile(absPath)
	if err != nil {
		return "", err
	}
	if len(data) == 0 {
		return "", fmt.Errorf("File rỗng")
	}
	return string(data), nil
}

func (ws *WorkspaceService) GetDefaultData() (string, error) {
	if len(testTemplate) == 0 {
		return "", fmt.Errorf("Template mặc định trống hoặc không được embed")
	}

	return string(testTemplate), nil
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

func (ws *WorkspaceService) sanitizePathFromFrontend(p string) string {
	// 1. Chuẩn hóa dấu gạch chéo: thay thế '\' bằng '/'
	p = strings.ReplaceAll(p, `\`, "/")

	// 2. Loại bỏ tiền tố "/workspace" nếu có
	const workspacePrefix = "/workspace"
	if strings.HasPrefix(p, workspacePrefix) {
		p = p[len(workspacePrefix):]
	}

	// 3. Loại bỏ dấu '/' ở đầu nếu có (ví dụ: "/myfolder/file.json" -> "myfolder/file.json")
	if strings.HasPrefix(p, "/") {
		p = p[1:]
	}
	return p
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

func (ws *WorkspaceService) ShowInExplorer(relativePath string) error {
	// Lấy workspace path
	workspacePath, err := ws.GetWorkspacePath()
	if err != nil {
		return fmt.Errorf("không thể lấy đường dẫn workspace: %w", err)
	}

	// Ghép đường dẫn đầy đủ
	fullPath := filepath.Join(workspacePath, relativePath)

	fmt.Println("Đang mở trong Explorer:", fullPath)

	// Mở trong trình quản lý file hệ điều hành
	switch runtime.GOOS {
	case "windows":
		fmt.Println("📂 Đang mở trong Explorer:", fullPath)
		return exec.Command("explorer", fullPath).Start()
	case "darwin":
		return exec.Command("open", fullPath).Start()
	case "linux":
		return exec.Command("xdg-open", fullPath).Start()
	default:
		return fmt.Errorf("hệ điều hành không được hỗ trợ: %s", runtime.GOOS)
	}
}

func (ws *WorkspaceService) ImportFileToWorkspace(sourcePath string, filename string) error {

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

func (ws *WorkspaceService) ImportFileToFolderInWorkspace(sourcePath string, relativeDestinationDir string) error {
	// Mở file nguồn
	src, err := os.Open(sourcePath)
	if err != nil {
		return fmt.Errorf("Không thể mở file nguồn '%s': %w", sourcePath, err)
	}
	defer src.Close()

	// Lấy đường dẫn tuyệt đối đến workspace
	workspacePath, err := ws.GetWorkspacePath()
	if err != nil {
		return fmt.Errorf("Không thể lấy đường dẫn workspace: %w", err)
	}

	// Tên file gốc
	filename := filepath.Base(sourcePath)

	// Tạo đường dẫn tuyệt đối đến thư mục đích
	destinationDir := filepath.Join(workspacePath, relativeDestinationDir)

	// Tạo thư mục đích nếu chưa tồn tại
	err = os.MkdirAll(destinationDir, os.ModePerm)
	if err != nil {
		return fmt.Errorf("Không thể tạo thư mục đích '%s': %w", destinationDir, err)
	}

	// Tạo đường dẫn đầy đủ đến file đích
	targetPath := filepath.Join(destinationDir, filename)

	// Kiểm tra nếu file đích đã tồn tại
	if _, err := os.Stat(targetPath); err == nil {
		return fmt.Errorf("File '%s' đã tồn tại trong workspace tại '%s'", filename, relativeDestinationDir)
	} else if !os.IsNotExist(err) {
		return fmt.Errorf("Không thể kiểm tra sự tồn tại của file đích: %w", err)
	}

	// Tạo file đích
	dst, err := os.Create(targetPath)
	if err != nil {
		return fmt.Errorf("Không thể tạo file đích '%s': %w", targetPath, err)
	}
	defer dst.Close()

	// Thực hiện copy
	written, err := io.Copy(dst, src)
	if err != nil {
		return fmt.Errorf("Lỗi khi copy nội dung từ '%s' vào '%s': %w", sourcePath, targetPath, err)
	}

	if written == 0 {
		return fmt.Errorf("File đã tạo nhưng nội dung không được copy (0 byte)")
	}

	fmt.Printf("✅ Đã import %d bytes từ %s vào %s\n", written, sourcePath, targetPath)
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

func (ws *WorkspaceService) SaveJsonFile(destinationPath string, jsonContent string) error {
	if !strings.HasSuffix(destinationPath, ".json") {
		return fmt.Errorf("chỉ chấp nhận lưu file .json")
	}

	var js interface{}
	if err := json.Unmarshal([]byte(jsonContent), &js); err != nil {
		return fmt.Errorf("nội dung JSON không hợp lệ: %w", err)
	}

	// Ghi đè nội dung
	_, err := OverwriteFile(destinationPath, strings.NewReader(jsonContent))
	if err != nil {
		return fmt.Errorf("không thể lưu file JSON: %w", err)
	}

	return nil
}

func (ws *WorkspaceService) RenameItem(sourceName string, newName string) error {
	// Lấy đường dẫn tuyệt đối của workspace
	absWorkspacePath, err := ws.GetWorkspacePath()
	if err != nil {
		return fmt.Errorf("không thể lấy đường dẫn workspace: %w", err)
	}

	// **Bước quan trọng**: Chuẩn hóa sourceName và newName nhận từ frontend
	// để chúng trở thành đường dẫn tương đối sạch từ gốc của workspace.
	cleanSourceName := ws.sanitizePathFromFrontend(sourceName)
    // newName ở đây là tên mới của file/folder, không phải đường dẫn đầy đủ từ gốc workspace
    // Chúng ta cần xác định thư mục cha của cleanSourceName và áp dụng newName vào đó
    dir := filepath.Dir(cleanSourceName) // "documents/subfolder" từ "documents/subfolder/file.json"
    if dir == "." { // Nếu là file/folder ở gốc workspace, Dir trả về "."
        dir = ""
    }

    baseNewName := filepath.Base(newName) // Lấy phần tên file/folder từ newName

    // Xây dựng đường dẫn tuyệt đối cho mục nguồn và mục đích
	sourceFullPath := filepath.Join(absWorkspacePath, cleanSourceName)
	newFullPath := filepath.Join(absWorkspacePath, dir, baseNewName) // dir là thư mục cha của sourceFullPath

	// Kiểm tra xem mục nguồn có tồn tại không
	if _, err := os.Stat(sourceFullPath); os.IsNotExist(err) {
		return fmt.Errorf("nguồn '%s' không tồn tại trong workspace để đổi tên", sourceName)
	} else if err != nil {
		return fmt.Errorf("lỗi khi kiểm tra nguồn '%s': %w", sourceName, err)
	}

	// Kiểm tra xem đích đã tồn tại chưa để tránh ghi đè ngầm định
	if _, err := os.Stat(newFullPath); err == nil {
		return fmt.Errorf("đích '%s' đã tồn tại trong workspace. Vui lòng chọn tên khác hoặc xóa đích trước.", newName)
	} else if !os.IsNotExist(err) {
		return fmt.Errorf("lỗi khi kiểm tra đích '%s': %w", newName, err)
	}

	// Thực hiện đổi tên/di chuyển
	err = os.Rename(sourceFullPath, newFullPath)
	if err != nil {
		return fmt.Errorf("không thể đổi tên '%s' thành '%s': %w", sourceName, newName, err)
	}

	fmt.Printf("✅ Đã đổi tên thành công: '%s' -> '%s'\n", sourceName, newName)
	return nil
}

func (ws *WorkspaceService) Paste(relativeSourcePath, relativeDestinationDir string) error {

	// Lấy đường dẫn tuyệt đối đến workspace
	workspacePath, err := ws.GetWorkspacePath()
	if err != nil {
		return fmt.Errorf("Không thể lấy đường dẫn workspace: %w", err)
	}

	// Xây dựng đường dẫn tuyệt đối đến file nguồn và thư mục đích
	sourcePath := filepath.Join(workspacePath, relativeSourcePath)
	destinationDir := filepath.Join(workspacePath, relativeDestinationDir)

	// Lấy tên file từ đường dẫn nguồn
	filename := filepath.Base(sourcePath)

	// Đảm bảo thư mục đích tồn tại
	err = os.MkdirAll(destinationDir, os.ModePerm)
	if err != nil {
		return fmt.Errorf("Không thể tạo thư mục đích '%s': %w", destinationDir, err)
	}

	// Tạo tên file đích duy nhất
	uniqueFilename, err := generateUniqueFilename(destinationDir, filename)
	if err != nil {
		return fmt.Errorf("Không thể tạo tên file mới: %w", err)
	}
	destinationPath := filepath.Join(destinationDir, uniqueFilename)

	// Mở file nguồn
	src, err := os.Open(sourcePath)
	if err != nil {
		return fmt.Errorf("Không thể mở file nguồn '%s': %w", sourcePath, err)
	}
	defer src.Close()

	// Tạo file đích
	dst, err := os.Create(destinationPath)
	if err != nil {
		return fmt.Errorf("Không thể tạo file đích '%s': %w", destinationPath, err)
	}
	defer dst.Close()

	// Copy nội dung
	written, err := io.Copy(dst, src)
	if err != nil {
		return fmt.Errorf("Lỗi khi copy từ '%s' đến '%s': %w", sourcePath, destinationPath, err)
	}

	if written == 0 {
		return fmt.Errorf("File đã tạo nhưng nội dung không được copy (0 byte)")
	}

	fmt.Printf("✅ Đã copy %d bytes từ %s vào %s\n", written, sourcePath, destinationPath)
	return nil
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
func (ws *WorkspaceService) ExportJSONFile(jsonFileName string, destinationPath string) error {
	// Lấy đường dẫn tuyệt đối của workspace
	absWorkspacePath, err := ws.GetWorkspacePath()
	if err != nil {
		return fmt.Errorf("không thể lấy đường dẫn workspace: %w", err)
	}

	// Tạo đường dẫn đầy đủ tới file nguồn trong workspace
	sourceFullPath := filepath.Join(absWorkspacePath, jsonFileName)

	// Kiểm tra file nguồn có tồn tại không
	info, err := os.Stat(sourceFullPath)
	if os.IsNotExist(err) {
		return fmt.Errorf("file JSON '%s' không tồn tại trong workspace", jsonFileName)
	} else if err != nil {
		return fmt.Errorf("lỗi khi kiểm tra file nguồn: %w", err)
	}

	if info.IsDir() {
		return fmt.Errorf("'%s' là thư mục, không phải file JSON", jsonFileName)
	}

	// Kiểm tra phần mở rộng .json của file đích
	if !strings.HasSuffix(strings.ToLower(destinationPath), ".json") {
		return fmt.Errorf("đường dẫn đích '%s' không có phần mở rộng .json", destinationPath)
	}

	// Sao chép file từ sourceFullPath sang destinationPath
	fmt.Printf("Đang xuất file JSON từ '%s' đến '%s'...\n", sourceFullPath, destinationPath)
	_, err = copyFile(sourceFullPath, destinationPath)
	if err != nil {
		return fmt.Errorf("lỗi khi sao chép file: %w", err)
	}

	fmt.Println("✅ Xuất file thành công.")
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

func (ws *WorkspaceService) SaveJsonToPath(jsonData string, fullPath string) error {
	// Optional: kiểm tra đuôi .json
	if !strings.HasSuffix(fullPath, ".json") {
		fullPath += ".json"
	}

	// Optional: validate JSON
	var js map[string]interface{}
	if err := json.Unmarshal([]byte(jsonData), &js); err != nil {
		return fmt.Errorf("JSON không hợp lệ: %w", err)
	}

	// Đảm bảo thư mục cha tồn tại
	dir := filepath.Dir(fullPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return fmt.Errorf("Không thể tạo thư mục cha: %w", err)
	}

	// Ghi file
	err := os.WriteFile(fullPath, []byte(jsonData), 0644)
	if err != nil {
		return fmt.Errorf("Không thể ghi dữ liệu vào file: %w", err)
	}

	fmt.Printf("✅ Đã lưu JSON vào: %s\n", fullPath)
	return nil
}



