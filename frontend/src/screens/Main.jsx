import FileTree from "../components/FileTree";
import { useState, useEffect } from "react";

import {
  ImportFile,
  ListFiles,
  NewProject,
} from "../../wailsjs/go/workspace/WorkspaceService";

import { SelectFileToImport } from "../../wailsjs/go/main/App";

export default function Main({ onLoginOut }) {
  const [leftTab, setLeftTab] = useState("Workspace");
  const tabsLeft = ["Workspace", "Device"];

  const [treeData, setTreeData] = useState([]);

  const handleImport = async () => {
    try {
      const filePath = await SelectFileToImport();

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
      await NewProject("new-project.json");
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

  const centerList = [
    { label: "System", value: "system" },
    { label: "Ftp", value: "ftp" },
    { label: "Control", value: "control" },
    { label: "Di", value: "di" },
    { label: "Do", value: "do" },
    { label: "Tag", value: "tag" },
    { label: "Program", value: "program" },
    { label: "Timer", value: "timer" },
    { label: "Modbus", value: "modbus" },
  ];

  return (
    <div
      style={{
        padding: "0.5rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: "rgb(243 244 246)",
      }}
    >
      <div style={{ display: "flex", gap: "0.25rem" }}>
        <button
          onClick={handleNewProject}
          style={{
            borderRadius: "0.375rem",
            backgroundColor: "white",
            border: "1px solid rgb(209 213 219)",
            padding: "2px 8px",
            fontSize: "10px",
            fontWeight: "500",
            boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
            cursor: "pointer",
          }}
        >
          New Project
        </button>
        <button
          style={{
            borderRadius: "0.375rem",
            backgroundColor: "white",
            border: "1px solid rgb(209 213 219)",
            padding: "2px 8px",
            fontSize: "10px",
            fontWeight: "500",
            boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
            cursor: "pointer",
          }}
        >
          Save Project
        </button>
        <button
          style={{
            borderRadius: "0.375rem",
            backgroundColor: "white",
            border: "1px solid rgb(209 213 219)",
            padding: "2px 8px",
            fontSize: "10px",
            fontWeight: "500",
            boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
            cursor: "pointer",
          }}
        >
          Save As Project
        </button>
        <button
          onClick={handleImport}
          className='rounded-md bg-white border border-gray-300 px-2 py-0.5 text-[10px] font-medium shadow-sm hover:bg-blue-50 hover:border-blue-400 active:bg-blue-100 active:border-blue-400 transition-colors'
        >
          Import Project
        </button>
        <button
          className='rounded-md bg-white border border-gray-300 px-2 py-0.5 text-[10px] font-medium shadow-sm hover:bg-blue-50 hover:border-blue-400 active:bg-blue-100 active:border-blue-400 transition-colors'
          onClick={ImportFile}
        >
          Log Out
        </button>
      </div>
      <div className='flex-1 mt-2 w-full overflow-hidden flex flex-row h-[calc(100vh-60px)]'>
        <div className='w-1/4 flex flex-col h-full'>
          <div className='flex'>
            {tabsLeft.map((tab, index) => (
              <div
                key={index}
                className={`cursor-pointer px-2 rounded-md user-none ${
                  leftTab === tab ? "bg-white" : "border"
                } hover:bg-blue-50 transition-colors`}
                onClick={() => setLeftTab(tab)}
              >
                {tab}
              </div>
            ))}
          </div>
          <div className='flex-1 w-auto h-0 bg-white flex flex-col'>
            {leftTab === "Workspace" ? (
              <div className='p-2 flex-1 flex flex-col'>
                <FileTree
                  treeData={treeData}
                  refreshFileList={refreshFileList}
                  handleImport={handleImport}
                />
              </div>
            ) : (
              <div className='p-4 flex-1 flex flex-col'>
                <h2 className='text-lg font-semibold'>Device</h2>
                <p className='text-gray-600'>
                  Device related information will be displayed here.
                </p>
              </div>
            )}
          </div>
        </div>
        <div className='w-1/4 flex flex-row h-full bg-blue pl-2'>
          <div className='flex flex-col justify-start items-center h-full border-r border-b border-gray-300'>
            {centerList.map((item, index) => (
              <span
                className='py-3 px-0.2  border border-gray-300 text-gray-700 hover:bg-blue-50  text-center'
                key={index}
                style={{
                  writingMode: "sideways-lr",
                  cursor: "pointer",
                }}
              >
                {item.label}
              </span>
            ))}
          </div>
          <div className='flex-1 h-full bg-blue'></div>
        </div>
      </div>
    </div>
  );
}
