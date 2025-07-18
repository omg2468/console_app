package workspace

import (
	"context"
	_ "embed" // để nhúng file JSON mẫu
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"myproject/backend/auth"
	"net"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"sync"
	"time"
)

//go:embed test.json
var testTemplate []byte

// SocketConnection quản lý kết nối socket
type SocketConnection struct {
	conn      net.Conn
	isActive  bool
	mutex     sync.Mutex
	dataChain chan string
	buffer    string
}

// SocketManager quản lý các kết nối socket
type SocketManager struct {
	connections map[string]*SocketConnection
	mutex       sync.RWMutex
}

// NewSocketManager tạo mới socket manager
func NewSocketManager() *SocketManager {
	return &SocketManager{
		connections: make(map[string]*SocketConnection),
	}
}

type WorkspaceService struct {
	basePath      string
	ctx           context.Context
	clipboard     *Clipboard
	authService   *auth.AuthService
	socketManager *SocketManager
}

type FileNode struct {
	Name     string     `json:"name"`
	Type     string     `json:"type"` // "file" or "folder"
	Modified string     `json:"modified,omitempty"`
	Children []FileNode `json:"children,omitempty"`
	FullPath string     `json:"fullPath,omitempty"` // Đường dẫn đầy đủ đến file hoặc thư mục, không trả về cho frontend
	Path     string     `json:"path,omitempty"`     // Đường dẫn đầy đủ đến file hoặc thư mục
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
		authService:   authService,
		basePath:      "./workspace",
		socketManager: NewSocketManager(),
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

	// Format JSON cho dễ đọc (pretty-print)
	formattedJSON, err := json.MarshalIndent(js, "", "  ")
	if err != nil {
		return fmt.Errorf("lỗi khi format JSON: %w", err)
	}

	// Ghi đè nội dung đã format
	_, err = OverwriteFile(destinationPath, strings.NewReader(string(formattedJSON)))
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
	if dir == "." {                      // Nếu là file/folder ở gốc workspace, Dir trả về "."
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

func (ws *WorkspaceService) DownloadConfig() error {
	return ws.authService.Send(`{"type":"download_config"}`)
}

func (ws *WorkspaceService) UploadConfig(data string) error {
	var configData map[string]interface{}
	if err := json.Unmarshal([]byte(data), &configData); err != nil {
		return fmt.Errorf("dữ liệu upload không phải JSON hợp lệ: %w", err)
	}

	// Thêm trường type
	configData["type"] = "upload_config"

	finalData, err := json.Marshal(configData)
	if err != nil {
		return fmt.Errorf("lỗi khi chuyển thành JSON: %w", err)
	}

	return ws.authService.Send(string(finalData))
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

// ConnectSocket kết nối tới socket server tại địa chỉ và port được chỉ định
func (ws *WorkspaceService) ConnectSocket(address string, port string) (string, error) {
	// Tạo key duy nhất cho connection
	connectionKey := fmt.Sprintf("%s:%s", address, port)

	ws.socketManager.mutex.Lock()
	defer ws.socketManager.mutex.Unlock()

	// Kiểm tra xem đã có kết nối nào tồn tại chưa
	if conn, exists := ws.socketManager.connections[connectionKey]; exists {
		if conn.isActive {
			return fmt.Sprintf("Đã có kết nối tới %s", connectionKey), nil
		}
		// Nếu connection cũ không active, xóa nó
		delete(ws.socketManager.connections, connectionKey)
	}

	// Tạo kết nối mới
	fullAddress := fmt.Sprintf("%s:%s", address, port)
	conn, err := net.DialTimeout("tcp", fullAddress, 10*time.Second)
	if err != nil {
		return "", fmt.Errorf("không thể kết nối tới %s: %w", fullAddress, err)
	}

	// Tạo socket connection object
	socketConn := &SocketConnection{
		conn:      conn,
		isActive:  true,
		dataChain: make(chan string, 100), // Buffer 100 messages
	}

	// Lưu connection
	ws.socketManager.connections[connectionKey] = socketConn

	// Bắt đầu goroutine để đọc dữ liệu
	go ws.readSocketData(connectionKey, socketConn)

	fmt.Printf("✅ Đã kết nối thành công tới socket: %s\n", fullAddress)
	return fmt.Sprintf("Kết nối thành công tới %s", fullAddress), nil
}

// readSocketData đọc dữ liệu từ socket connection
func (ws *WorkspaceService) readSocketData(connectionKey string, socketConn *SocketConnection) {
	defer func() {
		socketConn.mutex.Lock()
		socketConn.isActive = false
		socketConn.conn.Close()
		close(socketConn.dataChain)
		socketConn.mutex.Unlock()

		// Xóa connection khỏi manager
		ws.socketManager.mutex.Lock()
		delete(ws.socketManager.connections, connectionKey)
		ws.socketManager.mutex.Unlock()

		fmt.Printf("🔌 Đã đóng kết nối socket: %s\n", connectionKey)
	}()

	buffer := make([]byte, 4096)

	for {
		socketConn.mutex.Lock()
		if !socketConn.isActive {
			socketConn.mutex.Unlock()
			break
		}
		socketConn.mutex.Unlock()

		// Set timeout cho việc đọc
		socketConn.conn.SetReadDeadline(time.Now().Add(30 * time.Second))

		n, err := socketConn.conn.Read(buffer)
		if err != nil {
			if netErr, ok := err.(net.Error); ok && netErr.Timeout() {
				// Timeout - tiếp tục đọc
				continue
			}
			// Lỗi khác - dừng
			fmt.Printf("❌ Lỗi đọc dữ liệu từ socket %s: %v\n", connectionKey, err)
			break
		}

		if n > 0 {
			data := string(buffer[:n])
			fmt.Printf("📥 Nhận dữ liệu từ socket %s: %s\n", connectionKey, data)

			// Gửi dữ liệu vào channel (non-blocking)
			select {
			case socketConn.dataChain <- data:
			default:
				fmt.Printf("⚠️ Buffer đầy, bỏ qua dữ liệu từ socket %s\n", connectionKey)
			}
		}
	}
}

// GetSocketData lấy dữ liệu mới nhất từ socket
func (ws *WorkspaceService) GetSocketData(address string, port string) (string, error) {
	connectionKey := fmt.Sprintf("%s:%s", address, port)

	ws.socketManager.mutex.RLock()
	socketConn, exists := ws.socketManager.connections[connectionKey]
	ws.socketManager.mutex.RUnlock()

	if !exists {
		return "", fmt.Errorf("không có kết nối tới %s", connectionKey)
	}

	socketConn.mutex.Lock()
	if !socketConn.isActive {
		socketConn.mutex.Unlock()
		return "", fmt.Errorf("kết nối tới %s không còn hoạt động", connectionKey)
	}
	socketConn.mutex.Unlock()

	// Thử lấy dữ liệu từ channel (non-blocking)
	select {
	case data := <-socketConn.dataChain:
		return data, nil
	default:
		return "", fmt.Errorf("không có dữ liệu mới từ socket %s", connectionKey)
	}
}

// GetAllSocketData lấy tất cả dữ liệu có sẵn từ socket
func (ws *WorkspaceService) GetAllSocketData(address string, port string) ([]string, error) {
	connectionKey := fmt.Sprintf("%s:%s", address, port)

	ws.socketManager.mutex.RLock()
	socketConn, exists := ws.socketManager.connections[connectionKey]
	ws.socketManager.mutex.RUnlock()

	if !exists {
		return nil, fmt.Errorf("không có kết nối tới %s", connectionKey)
	}

	socketConn.mutex.Lock()
	if !socketConn.isActive {
		socketConn.mutex.Unlock()
		return nil, fmt.Errorf("kết nối tới %s không còn hoạt động", connectionKey)
	}
	socketConn.mutex.Unlock()

	var results []string

	socketConn.mutex.Lock()
	buffer := socketConn.buffer
	socketConn.mutex.Unlock()

	for {
		select {
		case chunk := <-socketConn.dataChain:
			buffer += chunk

			for {
				if idx := strings.Index(buffer, "\n"); idx >= 0 {
					line := buffer[:idx]
					results = append(results, line)
					buffer = buffer[idx+1:]
				} else {
					break
				}
			}
		default:
			// Không còn dữ liệu -> lưu lại phần chưa hoàn tất
			socketConn.mutex.Lock()
			socketConn.buffer = buffer
			socketConn.mutex.Unlock()
			return results, nil
		}
	}
}

// SendSocketData gửi dữ liệu tới socket
func (ws *WorkspaceService) SendSocketData(address string, port string, data string) error {

	connectionKey := fmt.Sprintf("%s:%s", address, port)

	ws.socketManager.mutex.RLock()
	socketConn, exists := ws.socketManager.connections[connectionKey]
	ws.socketManager.mutex.RUnlock()

	if !exists {
		return fmt.Errorf("không có kết nối tới %s", connectionKey)
	}

	socketConn.mutex.Lock()
	defer socketConn.mutex.Unlock()

	if !socketConn.isActive {
		return fmt.Errorf("kết nối tới %s không còn hoạt động", connectionKey)
	}

	// Set timeout cho việc ghi
	socketConn.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))

	// 1. Chuyển đổi chuỗi dữ liệu gốc thành byte array (thường là UTF-8)
	dataBytes := []byte(data)

	// 2. Thêm byte 0x0A (Line Feed) vào cuối mảng byte
	// Đây chính là "thêm 0a dưới dạng HEX" vào cuối chuỗi dữ liệu ban đầu.
	finalData := append(dataBytes, 0x0A)

	_, err := socketConn.conn.Write([]byte(finalData))
	if err != nil {
		return fmt.Errorf("không thể gửi dữ liệu tới socket %s: %w", connectionKey, err)
	}

	fmt.Printf("📤 Đã gửi dữ liệu tới socket %s: %s\n", connectionKey, data)
	return nil
}

// func (ws *WorkspaceService) SendSocketData(address string, port string, data string) error {
// 	connectionKey := fmt.Sprintf("%s:%s", address, port)

// 	ws.socketManager.mutex.RLock()
// 	socketConn, exists := ws.socketManager.connections[connectionKey]
// 	ws.socketManager.mutex.RUnlock()

// 	if !exists {
// 		return fmt.Errorf("không có kết nối tới %s", connectionKey)
// 	}

// 	socketConn.mutex.Lock()
// 	defer socketConn.mutex.Unlock()

// 	if !socketConn.isActive {
// 		return fmt.Errorf("kết nối tới %s không còn hoạt động", connectionKey)
// 	}

// 	// Set timeout cho việc ghi
// 	socketConn.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))

// 	// 1. Gửi chuỗi dữ liệu gốc
// 	dataBytes := []byte(data)
// 	_, err := socketConn.conn.Write(dataBytes)
// 	if err != nil {
// 		return fmt.Errorf("không thể gửi dữ liệu chính tới socket %s: %w", connectionKey, err)
// 	}

// 	// 2. Gửi byte 0x0A riêng lẻ
// 	_, err = socketConn.conn.Write([]byte{0x0A})
// 	if err != nil {
// 		return fmt.Errorf("không thể gửi ký tự kết thúc tới socket %s: %w", connectionKey, err)
// 	}

// 	fmt.Printf("📤 Đã gửi tới socket %s: %s\\n (chia 2 lần)\n", connectionKey, data)
// 	return nil
// }

func (ws *WorkspaceService) Login(address, port, username, password string) error {
	// Tạo message JSON đúng format thiết bị yêu cầu
	loginMessage := fmt.Sprintf(`{"type":"login","username":"%s","password":"%s"}`, username, password)

	// Gửi xuống thiết bị qua socket
	err := ws.SendSocketData(address, port, loginMessage)
	if err != nil {
		return fmt.Errorf("không thể gửi login request: %w", err)
	}

	fmt.Println("✅ Đã gửi login request tới thiết bị.")
	return nil
}

func (ws *WorkspaceService) Logout(address, port string) error {
	// Tạo message JSON cho logout
	logoutMessage := `{"type":"logout"}`

	// Gửi xuống thiết bị qua socket
	err := ws.SendSocketData(address, port, logoutMessage)
	if err != nil {
		return fmt.Errorf("không thể gửi logout request: %w", err)
	}

	fmt.Println("✅ Đã gửi logout request tới thiết bị.")
	return nil
}

func (ws *WorkspaceService) ChangePassword(address, port, oldPassword, newPassword string) error {
	// Tạo message JSON cho đổi mật khẩu
	changePasswordMessage := fmt.Sprintf(
		`{"type":"change_password","old_password":"%s","new_password":"%s"}`,
		oldPassword, newPassword,
	)

	// Gửi xuống thiết bị qua socket
	err := ws.SendSocketData(address, port, changePasswordMessage)
	if err != nil {
		return fmt.Errorf("không thể gửi yêu cầu đổi mật khẩu: %w", err)
	}

	fmt.Println("✅ Đã gửi yêu cầu đổi mật khẩu tới thiết bị.")
	return nil
}

func (ws *WorkspaceService) DownloadConfigEthernet(address, port string) error {
	// Tạo message JSON cho yêu cầu tải cấu hình
	message := `{"type":"download_config"}`

	// Gửi xuống thiết bị qua socket
	err := ws.SendSocketData(address, port, message)
	if err != nil {
		return fmt.Errorf("không thể gửi yêu cầu download config: %w", err)
	}

	fmt.Println("✅ Đã gửi yêu cầu download config tới thiết bị.")
	return nil
}

func (ws *WorkspaceService) ReadAnalog(address, port, mode string) error {
	// Đảm bảo mode chỉ nhận "enable" hoặc "disable"
	if mode != "enable" && mode != "disable" {
		return fmt.Errorf("giá trị không hợp lệ cho mode: %s (chỉ 'enable' hoặc 'disable')", mode)
	}

	// Tạo message JSON
	message := fmt.Sprintf(`{"type":"read_analog","data":"%s"}`, mode)

	// Gửi xuống thiết bị qua socket
	err := ws.SendSocketData(address, port, message)
	if err != nil {
		return fmt.Errorf("không thể gửi yêu cầu read_analog: %w", err)
	}

	fmt.Printf("✅ Đã gửi read_analog [%s] tới thiết bị.\n", mode)
	return nil
}

func (ws *WorkspaceService) ReadMemoryView(address, port, mode string) error {
	// Chỉ chấp nhận "enable" hoặc "disable"
	if mode != "enable" && mode != "disable" {
		return fmt.Errorf("giá trị không hợp lệ cho mode: %s (chỉ 'enable' hoặc 'disable')", mode)
	}

	// Tạo message JSON
	message := fmt.Sprintf(`{"type":"read_memory_view","data":"%s"}`, mode)

	// Gửi xuống thiết bị qua socket
	err := ws.SendSocketData(address, port, message)
	if err != nil {
		return fmt.Errorf("không thể gửi yêu cầu read_memory_view: %w", err)
	}

	fmt.Printf("✅ Đã gửi read_memory_view [%s] tới thiết bị.\n", mode)
	return nil
}

func (ws *WorkspaceService) ReadTagView(address, port, mode string) error {
	// Kiểm tra mode hợp lệ
	if mode != "enable" && mode != "disable" {
		return fmt.Errorf("giá trị không hợp lệ cho mode: %s (chỉ 'enable' hoặc 'disable')", mode)
	}

	// Tạo JSON message
	message := fmt.Sprintf(`{"type":"read_tag_view","data":"%s"}`, mode)

	// Gửi dữ liệu
	err := ws.SendSocketData(address, port, message)
	if err != nil {
		return fmt.Errorf("không thể gửi yêu cầu read_tag_view: %w", err)
	}

	fmt.Printf("✅ Đã gửi read_tag_view [%s] tới thiết bị.\n", mode)
	return nil
}

func (ws *WorkspaceService) SettingNetworkEthernet(address, port string, data map[string]interface{}) error {
	// Gắn type vào payload
	data["type"] = "network_setting"

	// Convert sang JSON
	finalData, err := json.Marshal(data)
	if err != nil {
		return fmt.Errorf("lỗi khi chuyển JSON: %w", err)
	}

	// Gửi xuống thiết bị qua socket
	err = ws.SendSocketData(address, port, string(finalData))
	if err != nil {
		return fmt.Errorf("không thể gửi network_setting qua ethernet: %w", err)
	}

	fmt.Println("✅ Đã gửi network_setting qua Ethernet.")
	return nil
}

func (ws *WorkspaceService) QueryNetwork(address, port string) error {
	// Tạo JSON yêu cầu thông tin mạng
	message := `{"type":"network"}`

	// Gửi xuống thiết bị qua socket
	err := ws.SendSocketData(address, port, message)
	if err != nil {
		return fmt.Errorf("không thể gửi yêu cầu network: %w", err)
	}

	fmt.Println("✅ Đã gửi yêu cầu lấy thông tin mạng tới thiết bị.")
	return nil
}

func (ws *WorkspaceService) Calibrate4mA(address, port string) error {
	message := `{"type":"calib_4ma"}`

	err := ws.SendSocketData(address, port, message)
	if err != nil {
		return fmt.Errorf("không thể gửi lệnh calib_4ma: %w", err)
	}

	return nil
}

func (ws *WorkspaceService) Calibrate16mA(address, port string) error {
	message := `{"type":"calib_16ma"}`

	err := ws.SendSocketData(address, port, message)
	if err != nil {
		return fmt.Errorf("không thể gửi lệnh calib_16ma: %w", err)
	}

	return nil
}

func (ws *WorkspaceService) SetDigitalOutputEthernet(address, port string, outputStates []bool) error {
	if len(outputStates) != 8 {
		return fmt.Errorf("outputStates phải có đúng 8 phần tử")
	}

	// Chuyển []bool thành []int
	intStates := make([]int, len(outputStates))
	for i, v := range outputStates {
		if v {
			intStates[i] = 1
		} else {
			intStates[i] = 0
		}
	}

	// Tạo JSON message
	message := map[string]interface{}{
		"type": "set_digital_output",
		"data": intStates,
	}

	finalData, err := json.Marshal(message)
	if err != nil {
		return fmt.Errorf("marshal lỗi: %w", err)
	}

	// Gửi qua socket
	err = ws.SendSocketData(address, port, string(finalData))
	if err != nil {
		return fmt.Errorf("không thể gửi set_digital_output: %w", err)
	}

	fmt.Println("✅ Đã gửi set_digital_output tới thiết bị.")
	return nil
}

func (ws *WorkspaceService) UploadConfigEthernet(address, port string, data string) error {
	var configData map[string]interface{}
	if err := json.Unmarshal([]byte(data), &configData); err != nil {
		return fmt.Errorf("dữ liệu upload không phải JSON hợp lệ: %w", err)
	}

	// Thêm trường type
	configData["type"] = "upload_config"

	finalData, err := json.Marshal(configData)
	if err != nil {
		return fmt.Errorf("lỗi khi chuyển thành JSON: %w", err)
	}

	// Gửi dữ liệu qua socket
	err = ws.SendSocketData(address, port, string(finalData))
	if err != nil {
		return fmt.Errorf("không thể gửi upload_config tới thiết bị: %w", err)
	}

	fmt.Println("✅ Đã gửi upload_config tới thiết bị.")
	return nil
}

func (ws *WorkspaceService) WriteSerialNumber(address, port, serial string) error {
	message := fmt.Sprintf(`{"type":"write_serial_number","data":"%s"}`, serial)
	return ws.SendSocketData(address, port, message)
}

func (ws *WorkspaceService) WriteMacAddress(address, port, mac string) error {
	message := fmt.Sprintf(`{"type":"write_mac","data":"%s"}`, mac)
	return ws.SendSocketData(address, port, message)
}

func (ws *WorkspaceService) ResetConfiguration(address, port string) error {
	message := `{"type":"reset_configuration"}`
	return ws.SendSocketData(address, port, message)
}

func (ws *WorkspaceService) RebootDevice(address, port string) error {
	message := `{"type":"reboot"}`
	return ws.SendSocketData(address, port, message)
}

func (ws *WorkspaceService) ReadSystemInfo(address, port string) error {
	message := `{"type":"read_system_info"}`
	return ws.SendSocketData(address, port, message)
}

func (ws *WorkspaceService) ReadSimInfo(address, port string) error {
	message := `{"type":"read_sim_info"}`
	return ws.SendSocketData(address, port, message)
}

func (ws *WorkspaceService) ReadSdCardInfo(address, port string) error {
	message := `{"type":"read_sdcard_info"}`
	return ws.SendSocketData(address, port, message)
}

func (ws *WorkspaceService) PingDevice(address, port, targetIP string) error {
	message := fmt.Sprintf(`{"type":"ping","data":"%s"}`, targetIP)
	return ws.SendSocketData(address, port, message)
}

// DisconnectSocket ngắt kết nối socket
func (ws *WorkspaceService) DisconnectSocket(address string, port string) error {
	logoutSignal := `{"type":"logout"}`
	_ = ws.SendSocketData(address, port, logoutSignal)
	connectionKey := fmt.Sprintf("%s:%s", address, port)

	ws.socketManager.mutex.Lock()
	socketConn, exists := ws.socketManager.connections[connectionKey]
	if !exists {
		ws.socketManager.mutex.Unlock()
		return fmt.Errorf("không có kết nối tới %s", connectionKey)
	}

	socketConn.mutex.Lock()
	if socketConn.isActive {
		socketConn.isActive = false
		socketConn.conn.Close()
	}
	socketConn.mutex.Unlock()

	delete(ws.socketManager.connections, connectionKey)
	ws.socketManager.mutex.Unlock()

	fmt.Printf("🔌 Đã ngắt kết nối socket: %s\n", connectionKey)
	return nil
}

// ListActiveConnections liệt kê tất cả kết nối đang hoạt động
func (ws *WorkspaceService) ListActiveConnections() []string {
	ws.socketManager.mutex.RLock()
	defer ws.socketManager.mutex.RUnlock()

	var activeConnections []string
	for key, conn := range ws.socketManager.connections {
		conn.mutex.Lock()
		if conn.isActive {
			activeConnections = append(activeConnections, key)
		}
		conn.mutex.Unlock()
	}

	return activeConnections
}

// CheckSocketConnection kiểm tra trạng thái kết nối socket
func (ws *WorkspaceService) CheckSocketConnection(address string, port string) bool {
	connectionKey := fmt.Sprintf("%s:%s", address, port)

	ws.socketManager.mutex.RLock()
	socketConn, exists := ws.socketManager.connections[connectionKey]
	ws.socketManager.mutex.RUnlock()

	if !exists {
		return false
	}

	socketConn.mutex.Lock()
	isActive := socketConn.isActive
	socketConn.mutex.Unlock()

	return isActive
}
