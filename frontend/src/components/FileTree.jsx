import React, { useEffect, useState, useContext } from "react";
import { Folder, File } from "lucide-react";
import {
  ShowInExplorer,
  GetWorkspacePath,
  CreateFolder,
  NewProject,
  ReadFile,
} from "../../wailsjs/go/workspace/WorkspaceService";

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
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showModal, setShowModal] = useState({ show: false, action: null });
  const [input, setInput] = useState("");
  const context = useContext(ContextMenuContext);

  const toggle = (e) => {
    e.stopPropagation();
    if (node.type === "folder" && hasChildren(node)) {
      setExpanded(!expanded);
    }
  };

  const handleAction = async (action, name, e) => {
    try {
      switch (action) {
        case "load":
          if (!node.path || node.type !== "file") {
            return;
          }
          const content = await ReadFile("" + node.path);
          const data = JSON.parse(content);
          console.log("Loaded data:", data);
          setDataFile(data);
          break;

        case "showInExplore":
          const workspaceFolder = await GetWorkspacePath();
          await ShowInExplorer(workspaceFolder);
          break;

        case "import":
          await handleImport();
          break;

        case "newGroup":
          await CreateFolder(name);
          setInput("");
          setShowModal({ show: false, action: null });
          break;

        case "newProject":
          await NewProject(name + ".json");
          setInput("");
          setShowModal({ show: false, action: null });
          break;

        case "paste":
          console.log("Paste action ở:", action);
          break;

        default:
          console.warn("Unknown action:", action);
          break;
      }

      refreshFileList(); // ✅ chỉ chạy khi không lỗi
    } catch (error) {
      console.error("Lỗi trong handleAction:", error);
      // Có thể hiển thị lỗi bằng Toast hoặc Alert tùy UX
    }
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    context?.showMenu(e.clientX, e.clientY, [
      { label: "Load", action: () => handleAction("load") },
      { label: "Unload", action: "unload" },
      { label: "Copy", action: "copy" },
      { label: "Rename", action: "rename" },
      { label: "Export", action: "export" },
      { label: "delete", action: "delete" },
    ]);
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
          className="flex justify-center items-center text-base text-blue-400 group-hover:text-blue-600 transition"
        >
          {node.type === "folder" && hasChildren(node) ? (
            expanded ? (
              <span className="transition">▾</span>
            ) : (
              <span className="transition">▸</span>
            )
          ) : showArrowPlaceholder ? (
            " "
          ) : null}
        </div>

        {/* Icon */}
        {node.type === "folder" ? (
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
            className="text-slate-400 group-hover:text-blue-400 transition"
          />
        )}

        {/* Tên file/folder */}
        <span className="truncate text-xs font-medium">{node.name}</span>

        {/* {node.modified && (
          <span className="ml-2 text-xs text-gray-400">({node.modified})</span>
        )} */}
      </div>

      {showModal.show && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
          onClick={() => setShowModal({ show: false, action: null })} // Đóng modal khi click nền đen
        >
          <div
            className="bg-white p-6 rounded-lg shadow-lg w-[300px]"
            onClick={(e) => e.stopPropagation()} // Ngăn sự kiện nổi bọt khi click vào modal
          >
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4 focus:outline-none focus:border-blue-500"
              placeholder="Enter project name"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <div className="flex flex-row justify-around">
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={() => handleAction(showModal.action, input)}
              >
                Save
              </button>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
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

const FileTree = ({ treeData, refreshFileList, handleImport, setDataFile }) => {
  const context = useContext(ContextMenuContext);
  const [showModal, setShowModal] = useState(false);

  const handleAction = async (action, name, e) => {
    try {
      switch (action) {
        case "load":
          if (!node.path || node.type !== "file") {
            return;
          }
          const content = await ReadFile("" + node.path);
          const data = JSON.parse(content);
          setDataFile(data);
          break; // ⚠️ Rất quan trọng, tránh chạy tiếp case "showInExplore"

        case "showInExplore":
          const workspaceFolder = await GetWorkspacePath();
          await ShowInExplorer(workspaceFolder);
          break;

        case "import":
          await handleImport();
          break;

        case "newGroup":
          await CreateFolder(name);
          setInput("");
          setShowModal({ show: false, action: null });
          break;

        case "newProject":
          await NewProject(name + ".json");
          setInput("");
          setShowModal({ show: false, action: null });
          break;

        case "paste":
          console.log("Paste action ở:", action);
          break;

        default:
          console.warn("Unknown action:", action);
          break;
      }

      refreshFileList(); // ✅ chỉ chạy khi không lỗi
    } catch (error) {
      console.error("Lỗi trong handleAction:", error);
      // Có thể hiển thị lỗi bằng Toast hoặc Alert tùy UX
    }
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    context?.showMenu(e.clientX, e.clientY, [
      { label: "New Project", action: () => setShowModal(true) },
      { label: "New Group ", action: "newGroup" },
      { label: "Paste", action: "paste" },
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
        className="p-4 bg-white rounded shadow-sm max-w-[400px]"
        onContextMenu={handleContextMenu}
      >
        {(!treeData || treeData.length === 0) && (
          <p className="text-black">Không có file nào.</p>
        )}

        <div className="flex flex-col gap-0.5">
          {treeData
            ? treeData?.map((node, idx) => (
                <TreeNode
                  key={idx}
                  node={node}
                  isRoot={true}
                  refreshFileList={refreshFileList}
                  setDataFile={setDataFile}
                />
              ))
            : null}
        </div>
      </div>
      {showModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
          onClick={() => setShowModal(false)} // Đóng modal khi click nền đen
        >
          <div
            className="bg-white p-6 rounded-lg shadow-lg w-[300px]"
            onClick={(e) => e.stopPropagation()} // Ngăn sự kiện nổi bọt khi click vào modal
          >
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4 focus:outline-none focus:border-blue-500"
              placeholder="Enter project name"
            />
            <div className="flex flex-row justify-around">
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={() => {}}
              >
                Save
              </button>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={() => setShowModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FileTree;
