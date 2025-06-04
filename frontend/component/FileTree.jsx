import React, { useEffect, useState } from "react";
import { Folder, File } from "lucide-react";
import {
  ListFiles,
  ShowInExplorer,
  GetWorkspacePath 
} from "../wailsjs/go/workspace/WorkspaceService";

import ContextMenu from "./ContextMenu";

const TreeNode = ({ node }) => {
  const [expanded, setExpanded] = useState(false);

  const toggle = () => {
    if (node.type === "folder") {
      setExpanded(!expanded);
    }
  };

  return (
    <div className="tree-node">
      <div
        onClick={toggle}
        className={`tree-node-header ${
          node.type === "folder" ? "folder" : ""
        } ${expanded ? "expanded" : ""}`}
      >
        {node.type === "folder" ? (
          <>
            <span>{expanded ? "🔽" : "▶️"}</span>
            <Folder size={16} />
          </>
        ) : (
          <File size={16} />
        )}

        <span>{node.name}</span>

        {node.modified && (
          <span className="modified-date">({node.modified})</span>
        )}
      </div>

      {expanded &&
        node.children?.map((child, index) => (
          <TreeNode key={index} node={child} />
        ))}
    </div>
  );
};

const FileTree = () => {
  const [treeData, setTreeData] = useState([]);
  const [contextMenu, setContextMenu] = useState(null); // { x, y } or null
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    ListFiles()
      .then((nodes) => {
        console.log("Đã load cây file:", nodes);
        setTreeData(nodes);
      })
      .catch((err) => console.error("Lỗi khi load cây file:", err));
  }, []);

  const handleContextMenu = (e) => {
    e.preventDefault();

    if (e.target.closest(".tree-node-header")) {
      return;
    }

    setContextMenu({ x: e.pageX, y: e.pageY });
    setShowMenu(true);
  };

  const handleClickOutside = () => {
    if (showMenu) {
      setShowMenu(false);
      setContextMenu(null);
    }
  };

  const handleAction = async (action) => {
    setShowMenu(false);
    setContextMenu(null);
    switch (action) {
      case "showInExplore":
        const workspaceFolder = await GetWorkspacePath();
        await ShowInExplorer(workspaceFolder);
        break;

      case "import":
        // TODO: xử lý import file
        console.log("Import file:", action);
        break;

      case "create":
        // TODO: xử lý tạo folder mới
        console.log("Create new folder ở:", action);
        break;

      default:
        console.warn("Action chưa được hỗ trợ:", action);
    }
  };

  useEffect(() => {
    window.addEventListener("click", handleClickOutside);
    return () => {
      window.removeEventListener("click", handleClickOutside);
    };
  }, [showMenu]);

  return (
    <div className="file-tree-container" onContextMenu={handleContextMenu}>
      <h2 className="file-tree-title">Cây thư mục Workspace</h2>

      {treeData.length === 0 && (
        <p className="file-tree-empty">Không có file nào.</p>
      )}

      {treeData.map((node, idx) => (
        <TreeNode key={idx} node={node} />
      ))}

      {showMenu && contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          visible={showMenu}
          onSelect={handleAction}
          onClose={() => {
            setShowMenu(false);
            setContextMenu(null);
          }}
          options={[
            { label: "New Project", action: "newProject" },
            { label: "New Group ", action: "newGroup" },
            { label: "Paste", action: "paste" },
            { label: "Import", action: "import" },
            { label: "Show in Explore", action: "showInExplore" },
          ]}
        />
      )}
    </div>
  );
};

export default FileTree;
