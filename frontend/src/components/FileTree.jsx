import React, { useEffect, useState } from "react";
import { Folder, File } from "lucide-react";
import {
  ShowInExplorer,
  GetWorkspacePath,
  CreateFolder,
  NewProject
} from "../../wailsjs/go/workspace/WorkspaceService";

import ContextMenu from "./ContextMenu";

const TreeNode = ({ node }) => {
  const [expanded, setExpanded] = useState(false);

  const toggle = () => {
    if (node.type === "folder") {
      setExpanded(!expanded);
    }
  };

  return (
    <div className="ml-4">
      <div
        onClick={toggle}
        className={`flex items-center gap-1 select-none text-black ${
          node.type === "folder" ? "cursor-pointer" : ""
        } ${expanded ? "text-lime-500" : ""}`}
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
          <span className="ml-2 text-xs text-black">({node.modified})</span>
        )}
      </div>

      {expanded &&
        node.children?.map((child, index) => (
          <TreeNode key={index} node={child} />
        ))}
    </div>
  );
};

const FileTree = ({ treeData, refreshFileList, handleImport }) => {
  const [contextMenu, setContextMenu] = useState(null); // { x: 0, y: 0 }
  const [showMenu, setShowMenu] = useState(false);

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
        await handleImport();
        break;

      case "newGroup":
        await CreateFolder("New Folder");
        break;

      case "newProject":
        await NewProject("new-project.json");
        break;

      case "paste":
        console.log("Paste action ở:", action);
        break;

      default:
        console.warn("Action chưa được hỗ trợ:", action);
    }
    refreshFileList();
  };

  useEffect(() => {
    window.addEventListener("click", handleClickOutside);
    return () => {
      window.removeEventListener("click", handleClickOutside);
    };
  }, [showMenu]);

  return (
    <div
      className="p-4 bg-white rounded shadow-sm max-w-[400px]"
      onContextMenu={handleContextMenu}
    >

      {treeData.length === 0 && (
        <p className="text-black">Không có file nào.</p>
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
