import React, { useEffect, useState, useContext } from "react";
import { Folder, File } from "lucide-react";
import {
  ShowInExplorer,
  CreateFolder,
  NewProject,
  ReadFile,
  DeleteItem,
  ExportJSONFile,
  RenameItem,
  Paste,
  ImportFileToFolderInWorkspace,
} from "../../wailsjs/go/workspace/WorkspaceService";

import {
  SelectFileToExport,
  SelectFileToImport,
} from "../../wailsjs/go/main/App";

import { ContextMenuContext } from "../store";
// Helper: kiểm tra node có children không
const hasChildren = (node) =>
  Array.isArray(node.children) && node.children.length > 0;

const TreeNode = ({
  node,
  level = 0,
  isRoot = false,
  refreshFileList,
  setDataFile,
  fileLoaded,
  setFileLoaded,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showModal, setShowModal] = useState({ show: false, action: null });
  const [input, setInput] = useState("");
  const context = useContext(ContextMenuContext);
  const [isLoadFile, setIsLoadFile] = useState("");

  const toggle = (e) => {
    e.stopPropagation();
    if (node.type === "folder" && hasChildren(node)) {
      setExpanded(!expanded);
    }
  };

  const handleAction = async (action, name) => {
    console.log("handleAction:", action, name);

    const basePath =
      node.path.endsWith("/") || node.path.endsWith("\\")
        ? node.path.slice(0, -1)
        : node.path;

    const fullPath = `${basePath}/${name}`;

    try {
      switch (action) {
        case "newProject":
          if (!name || !name.trim()) {
            console.warn("Tên không hợp lệ");
            return;
          }
          if (!name.toLowerCase().endsWith(".json")) {
            console.warn("Chỉ cho phép tạo file với phần mở rộng .json");
            return;
          }
          await NewProject(fullPath);
          setInput("");
          setShowModal({ show: false, action: null });
          break;

        case "load":
          if (!node.path || node.type !== "file") {
            return;
          }
          setIsLoadFile(node.name);
          console.log("Loading file:", node);
          const content = await ReadFile(node.path);
          const data = JSON.parse(content);
          setDataFile({ ...data });
          context.setFileName(node.name)
          setFileLoaded(node.fullPath);
          break;

        case "newGroup":
          await CreateFolder(fullPath);
          setInput("");
          setShowModal({ show: false, action: null });

        case "unload":
          console.log("Unload action ở:", action);
          break;

        case "delete":
          await DeleteItem(node.path);
          break;

        case "copy":
          if (!node.path) {
            return;
          }
          context.setClipboard(node.path);
          break;

        case "export":
          SelectFileToExport(node.name).then(async (filePath) => {
            if (!filePath) {
              return;
            }
            try {
              await ExportJSONFile(node.path, filePath);
            } catch (error) {
              console.error("Error exporting file:", error);
            }
          });

          break;

        case "paste":
          if (!context.clipBoard) {
            console.warn("Clipboard is empty");
            return;
          }
          if (node.type !== "folder") {
            console.warn("Chỉ có thể dán vào thư mục");
            return;
          }
          const clipboardPath = context.clipBoard;

          await Paste(clipboardPath, node.path);
          break;

        case "showInExplore":
          if (!node.path) {
            return;
          }
          await ShowInExplorer(node.path);
          break;

        case "rename":
          if (!node.path) {
            return;
          }

          const trimmedInput = input.trim();
          if (!trimmedInput) {
            console.warn("Tên không hợp lệ");
            return;
          }

          if (
            !trimmedInput.toLowerCase().endsWith(".json") &&
            node.type === "file"
          ) {
            console.warn("Chỉ cho phép đổi tên file với phần mở rộng .json");
            return;
          }

          try {
            await RenameItem(node.path, trimmedInput);
            setInput("");
            setShowModal({ show: false, action: null });
          } catch (err) {
            console.error("Lỗi khi đổi tên:", err);
          }
          break;

        case "import":
          const filePath = await SelectFileToImport();

          await ImportFileToFolderInWorkspace(filePath, node.path);
        default:
          console.warn("Unknown action:", action);
          break;
      }
    } catch (error) {
      console.error("Lỗi trong handleAction:", error);
      setInput("");
      setShowModal({ show: false, action: null });
    } finally {
      // Refresh file list after any action that modifies the file system
      setIsLoadFile("");
      refreshFileList();
    }
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (node.type == "file") {
      // Nếu là file, chỉ hiển thị các hành động liên quan đến file
      context?.showMenu(e.clientX, e.clientY, [
        {
          label: "Load",
          action: () => handleAction("load"),
        },
        { label: "Unload", action: "unload" },
        { label: "Copy", action: () => handleAction("copy") },
        {
          label: "Rename",
          action: () => {
            setShowModal({ show: true, action: "rename" });
            setInput(node.name);
          },
        },
        { label: "Export", action: () => handleAction("export") },
        { label: "Delete", action: () => handleAction("delete") },
      ]);
    } else if (node.type == "folder") {
      // Nếu là folder, hiển thị các hành động liên quan đến folder
      context?.showMenu(e.clientX, e.clientY, [
        {
          label: "New Project",
          action: () => {
            setInput("default.json");
            setShowModal({ show: true, action: "newProject" });
          },
        },
        {
          label: "New Group",
          action: () => {
            setInput("");
            setShowModal({ show: true, action: "newGroup" });
          },
        },
        {
          label: "Paste",
          action: () => handleAction("paste"),
          disabled: !context.clipBoard,
        },
        { label: "Import", action: () => handleAction("import") },
        {
          label: "Rename",
          action: () => {
            setInput(node.name);
            setShowModal({ show: true, action: "rename" });
          },
        },
        { label: "Delete", action: () => handleAction("delete") },
        {
          label: "Show in Explore",
          action: () => handleAction("showInExplore"),
        },
      ]);
    }
  };

  // Nếu là node root (level === 0), luôn render placeholder mũi tên để căn chỉnh
  const showArrowPlaceholder = isRoot || node.type === "folder";

  return (
    <>
      <div
        className={`
          flex items-center justify-start gap-2 cursor-pointer select-none rounded-lg px-3 py-1.5 transition
          ${
            node.type === "folder"
              ? "font-semibold text-slate-800"
              : "text-slate-600"
          }
          ${
            expanded
              ? "bg-blue-100/90 shadow-inner"
              : "hover:bg-blue-50 hover:shadow"
          }
          ${fileLoaded && fileLoaded === node.fullPath ? "bg-blue-200" : ""}
          group
        `}
        style={{
          paddingLeft: `calc(${level} * 20px)`,
          minHeight: "30px",
          fontSize: "15.5px",
          letterSpacing: "0.01em",
          transition: "background 0.18s, box-shadow 0.18s",
        }}
        onClick={toggle}
        onContextMenu={(e) => handleContextMenu(e)}
      >
        <div
          style={{ width: "18px !important", height: "18px" }}
          className='flex justify-center items-center text-base text-blue-400 group-hover:text-blue-600 transition'
        >
          {node.type === "folder" && hasChildren(node) ? (
            expanded ? (
              <span className='transition'>▾</span>
            ) : (
              <span className='transition'>▸</span>
            )
          ) : showArrowPlaceholder ? (
            " "
          ) : null}
        </div>

        {/* Icon */}
        {isLoadFile && isLoadFile === node.name ? (
          <div className='w-[18px] h-[18px] flex items-center justify-center'>
            <svg
              aria-hidden='true'
              className='w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600'
              viewBox='0 0 100 101'
              fill='none'
              xmlns='http://www.w3.org/2000/svg'
            >
              <path
                d='M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z'
                fill='currentColor'
              />
              <path
                d='M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z'
                fill='currentFill'
              />
            </svg>
          </div>
        ) : node.type === "folder" ? (
          <Folder
            size={20}
            className={`transition drop-shadow-sm ${
              expanded
                ? "text-blue-600"
                : "text-blue-400 group-hover:text-blue-600"
            }`}
          />
        ) : (
          <File
            size={19}
            className='text-slate-400 group-hover:text-blue-400 transition'
          />
        )}

        {/* Tên file/folder */}
        <span className='truncate text-xs font-medium'>{node.name}</span>

        {/* {node.modified && (
          <span className="ml-2 text-xs text-gray-400">({node.modified})</span>
        )} */}
      </div>

      {showModal.show && (
        <div
          className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center'
          onClick={() => setShowModal({ show: false, action: null })} // Đóng modal khi click nền đen
        >
          <div
            className='bg-white p-6 rounded-lg shadow-lg w-[300px]'
            onClick={(e) => e.stopPropagation()} // Ngăn sự kiện nổi bọt khi click vào modal
          >
            <input
              type='text'
              className='w-full px-3 py-2 border border-gray-300 rounded-md mb-4 focus:outline-none focus:border-blue-500'
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <div className='flex flex-row justify-around'>
              <button
                className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
                onClick={() => handleAction(showModal.action, input)}
              >
                Save
              </button>
              <button
                className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
                onClick={() => setShowModal({ show: false, action: null })}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Children */}
      {expanded &&
        hasChildren(node) &&
        node.children.map((child, index) => (
          <TreeNode key={index} node={child} level={level + 1} />
        ))}
    </>
  );
};

const FileTree = ({ treeData, refreshFileList, setDataFile }) => {
  const context = useContext(ContextMenuContext);
  const [showModal, setShowModal] = useState({ show: false, action: null });
  const [input, setInput] = useState("");
  const [fileLoaded, setFileLoaded] = useState("");

  const handleAction = async (action, name) => {
    try {
      switch (action) {
        case "newProject":
          if (!name || !name.trim()) {
            console.warn("Tên không hợp lệ");
            return;
          }
          if (!name.toLowerCase().endsWith(".json")) {
            console.warn("Chỉ cho phép tạo file với phần mở rộng .json");
            return;
          }
          await NewProject(fullPath);
          setInput("");
          setShowModal({ show: false, action: null });
          break;

        case "newGroup":
          await CreateFolder(fullPath);
          setInput("");
          setShowModal({ show: false, action: null });
          break;

        case "import":
          await handleImport();
          break;

        case "showInExplore":
          await ShowInExplorer("");
          break;

        default:
          console.warn("Unknown action:", action);
          break;
      }

      refreshFileList();
    } catch (error) {
      setInput("");
      setShowModal({ show: false, action: null });
    }
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    context?.showMenu(e.clientX, e.clientY, [
      { label: "New Project", action: () => setShowModal(true) },
      { label: "New Group ", action: "newGroup" },
      { label: "Paste", action: "paste", disabled: !context.clipBoard },
      { label: "Import", action: "import" },
      {
        label: "Show in Explore",
        action: () => handleAction("showInExplore", e),
      },
    ]);
  };

  return (
    <>
      <div
        className='p-4 h-[100%] bg-white rounded shadow-sm max-w-[400px]'
        onContextMenu={handleContextMenu}
      >
        {(!treeData || treeData.length === 0) && (
          <p className='text-black'>Không có file nào.</p>
        )}

        <div className='flex flex-col gap-0.5'>
          {treeData
            ? treeData?.map((node, idx) => (
                <TreeNode
                  key={idx}
                  node={node}
                  isRoot={true}
                  refreshFileList={refreshFileList}
                  setDataFile={setDataFile}
                  fileLoaded={fileLoaded}
                  setFileLoaded={setFileLoaded}
                />
              ))
            : null}
        </div>
      </div>
      {showModal.show && (
        <div
          className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-auto'
          onClick={() => setShowModal({ show: false, action: null })}
          style={{ zIndex: 1000 }}
        >
          <div
            className='bg-white p-6 rounded-lg shadow-lg w-[300px] max-h-[90vh] overflow-auto'
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type='text'
              className='w-full px-3 py-2 border border-gray-300 rounded-md mb-4 focus:outline-none focus:border-blue-500'
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <div className='flex flex-row justify-around'>
              <button
                className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
                onClick={() => handleAction(showModal.action, input)}
              >
                Save
              </button>
              <button
                className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
                onClick={() => setShowModal({ show: false, action: null })}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {!!fileLoaded && (
        <div className='fixed bottom-0 left-0 z-20 p-2 bg-stone-100 shadow-md text-sm text-gray-600'>
          {window.__dirname}/{fileLoaded}
        </div>
      )}
    </>
  );
};

export default FileTree;
