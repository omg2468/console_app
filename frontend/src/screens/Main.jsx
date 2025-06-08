import FileTree from "../components/FileTree";
import { useState, useEffect } from "react";

import {
  ImportFile,
  ListFiles,
  NewProject,
} from "../../wailsjs/go/workspace/WorkspaceService";

import { SelectFileToImport } from "../../wailsjs/go/main/App";

import ConnectComponent from "../components/Connect";

export default function Main({ onLoginOut }) {
  const [leftTab, setLeftTab] = useState("Workspace");
  const [middleTab, setMiddleTab] = useState("system");
  const [rightTab, setRightTab] = useState("Parameter");
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

  const rightTabs = ["Parameter", "Control", "Memory view", "Tag view"];

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
      <div className='flex-1 mt-2 w-full overflow-hidden flex flex-row'>
        <div className='w-1/4 flex flex-col'>
          <div className='flex'>
            {tabsLeft.map((tab, index) => (
              <div
                key={index}
                className={`cursor-pointer px-2 rounded-md user-none text-xs ${
                  leftTab === tab ? "bg-white" : "border"
                } hover:bg-blue-50 transition-colors`}
                onClick={() => setLeftTab(tab)}
              >
                {tab}
              </div>
            ))}
          </div>
          <div className="flex-1 w-auto h-0 bg-white flex flex-col">
            {leftTab === "Workspace" ? (
              <div className="p-2 flex-1 flex flex-col">
                <FileTree
                  treeData={treeData}
                  refreshFileList={refreshFileList}
                  handleImport={handleImport}
                />
              </div>
            ) : (
              <div className="p-4 flex-1 flex flex-col">
                <h2 className="text-lg font-semibold">Device</h2>
                <p className="text-gray-600">
                  <ConnectComponent />
                </p>
              </div>
            )}
          </div>
        </div>
        <div className='w-1/4 flex flex-row bg-blue pl-2'>
          <div className='flex flex-col justify-start items-center h-full'>
            {centerList.map((item, index) => (
              <span
                onClick={() => setMiddleTab(item.value)}
                className={`py-3 px-0.2 text-xs  text-gray-700 hover:bg-blue-50  text-center ${
                  middleTab === item.value
                    ? "bg-white border-0"
                    : "border border-gray-300"
                }`}
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
          <div className='flex-1 w-1/4 h-full border-t border-b border-r border-gray-300 bg-white'></div>
        </div>
        <div className='flex flex-1 flex-col border border-gray-300'>
          <div className='flex flex-row justify-start items-center '>
            {rightTabs.map((label, idx) => (
              <span
                onClick={() => setRightTab(label)}
                className={`py-0.5 px-3 text-xs ${
                  rightTab === label
                    ? "bg-white border-0"
                    : "border border-gray-300 hover:bg-blue-50"
                } text-gray-700 hover:text-blue-600 text-center cursor-pointer transition-colors`}
                key={idx}
              >
                {label}
              </span>
            ))}
          </div>
          <div className='flex flex-1 bg-white'></div>
        </div>
      </div>
    </div>
  );
}
