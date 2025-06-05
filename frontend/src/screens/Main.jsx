import React, { useState, useEffect } from "react";

import FileTree from "../components/FileTree.jsx";

import {
  ImportFile,
  ListFiles,
  NewProject
} from "../../wailsjs/go/workspace/WorkspaceService";

import { SelectFileToImport } from "../../wailsjs/go/main/App";

export default function Main({ onLoginOut }) {
  const [treeData, setTreeData] = useState([]);

  const handleImport = async () => {
    try {
      const filePath = await SelectFileToImport();

      console.log("Đã chọn file:", filePath);

      if (!filePath) {
        return;
      }

      const fileName = filePath.split(/[/\\]/).pop();

      await ImportFile(filePath, fileName);
      refreshFileList();
    } catch (error) {
      console.error("Lỗi khi import file:", error);
    }
  };

  const handleNewProject = async () => {
    try {
      await NewProject("new-project.json")
      refreshFileList();
      console.log("Tạo dự án mới");
    } catch (error) {
      console.error("Lỗi khi tạo dự án mới:", error);
    }
  };

  const refreshFileList = () => {
    ListFiles()
      .then((nodes) => {
        setTreeData(nodes);
      })
      .catch((err) => console.error("Lỗi khi load cây file:", err));
  };

  useEffect(() => {
    refreshFileList();
  }, []);

  return (
    <div className="flex flex-col items-start justify-center min-h-screen bg-gray-100">
      <div className="p-2 flex gap-1">
        <button
          onClick={handleNewProject}
          className="rounded-md bg-white border border-gray-300 px-2 py-0.5 text-[10px] font-medium shadow-sm hover:bg-blue-50 hover:border-blue-400 active:bg-blue-100 active:border-blue-400 transition-colors"
        >
          New Project
        </button>
        <button className="rounded-md bg-white border border-gray-300 px-2 py-0.5 text-[10px] font-medium shadow-sm hover:bg-blue-50 hover:border-blue-400 active:bg-blue-100 active:border-blue-400 transition-colors">
          Save Project
        </button>
        <button className="rounded-md bg-white border border-gray-300 px-2 py-0.5 text-[10px] font-medium shadow-sm hover:bg-blue-50 hover:border-blue-400 active:bg-blue-100 active:border-blue-400 transition-colors">
          Save As Project
        </button>
        <button
          onClick={handleImport}
          className="rounded-md bg-white border border-gray-300 px-2 py-0.5 text-[10px] font-medium shadow-sm hover:bg-blue-50 hover:border-blue-400 active:bg-blue-100 active:border-blue-400 transition-colors"
        >
          Import Project
        </button>
        <button
          className="rounded-md bg-white border border-gray-300 px-2 py-0.5 text-[10px] font-medium shadow-sm hover:bg-blue-50 hover:border-blue-400 active:bg-blue-100 active:border-blue-400 transition-colors"
          onClick={ImportFile}
        >
          Log Out
        </button>
      </div>
      <div className="flex-1">
        <FileTree
          treeData={treeData}
          refreshFileList={refreshFileList}
          handleImport={handleImport}
        />
      </div>
    </div>
  );
}
