import FileTree from "../components/FileTree";
import { useState, useEffect, useCallback, useContext } from "react";
import {
  ImportFileToWorkspace,
  ListFiles,
  NewProject,
  SaveJsonFile,
  SaveJsonToPath,
} from "../../wailsjs/go/workspace/WorkspaceService";
import { ContextMenuContext } from "../store";
import ReadData from "../components/ReadData";
import ReadParameter from "../components/ReadParameter";
import Control from "../components/Control";

import {
  SelectFileToImport,
  SelectFileToExport,
} from "../../wailsjs/go/main/App";

import ConnectComponent from "../components/Connect";

export default function Main({ onLoginOut }) {
  const [leftTab, setLeftTab] = useState("Workspace");
  const [middleTab, setMiddleTab] = useState("system");
  const [rightTab, setRightTab] = useState("Parameter");
  const tabsLeft = ["Workspace", "Device"];
  const [dataFile, setDataFile] = useState(null);
  const [parameter, setParameter] = useState({
    key: "",
    idx: "",
    value: null,
  });

  function normalizeWorkspacePath(path) {
    return path.replace(/^workspace\//, "");
  }

  const [fileLoaded, setFileLoaded] = useState("");
  

  const context = useContext(ContextMenuContext);
  console.log("dataFile", dataFile);
  useEffect(() => {
    if (!parameter.key) return;
    if (!context.isLoadFile) return;
    let newValue = null;
    if (parameter.key && dataFile) {
      if (Array.isArray(dataFile[parameter.key])) {
        newValue = dataFile[parameter.key][parameter.idx];
      } else {
        newValue = dataFile[parameter.key];
      }
      setParameter((prev) => ({
        ...prev,
        value: newValue,
      }));
    }
  }, [dataFile, context.isLoadFile]);


  const [treeData, setTreeData] = useState([]);

  const handleImport = async () => {
    try {
      const filePath = await SelectFileToImport();

      if (!filePath) {
        return;
      }
      const fileName = filePath.split(/[/\\]/).pop();

      await ImportFileToWorkspace(filePath, fileName);
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

  const handleSaveProject = async () => {
    const jsonObject = {
      name: "Example",
      value: 42,
      items: [1, 2, 3],
    };
    const jsonString = JSON.stringify(jsonObject);
    const cleanPath = normalizeWorkspacePath(fileLoaded);
    await SaveJsonFile(cleanPath, jsonString);
  };

  const handleSaveAsProject = async () => {
    const jsonData = `{
  "name": "My Project",
  "type": "folder",
  "modified": "2025-06-14 21:00:00",
  "children": [
    {
      "name": "main.json",
      "type": "file",
      "modified": "2025-06-14 20:59:00"
    },
    {
      "name": "config",
      "type": "folder",
      "modified": "2025-06-14 20:58:00",
      "children": [
        {
          "name": "settings.json",
          "type": "file",
          "modified": "2025-06-14 20:57:00"
        }
      ]
    }
  ]
}`;

    SelectFileToExport("api-json.json").then(async (filePath) => {
      if (!filePath) {
        return;
      }
      try {
        await SaveJsonToPath(jsonData, filePath);
      } catch (error) {
        console.error("Error exporting file:", error);
      }
    });
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
          onClick={handleSaveProject}
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
          onClick={handleSaveAsProject}
        >
          Save As Project
        </button>
        <button
          onClick={handleImport}
          className="rounded-md bg-white border border-gray-300 px-2 py-0.5 text-[10px] font-medium shadow-sm hover:bg-blue-50 hover:border-blue-400 active:bg-blue-100 active:border-blue-400 transition-colors"
        >
          Import Project
        </button>
        <button className="rounded-md bg-white border border-gray-300 px-2 py-0.5 text-[10px] font-medium shadow-sm hover:bg-blue-50 hover:border-blue-400 active:bg-blue-100 active:border-blue-400 transition-colors">
          Log Out
        </button>
      </div>
      <div className="flex-1 mt-2 w-full overflow-hidden flex flex-row">
        <div className="w-1/4 flex flex-col">
          <div className="flex">
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
          <div
            className="flex-1 w-auto h-0 bg-white flex flex-col"
          >
            {leftTab === "Workspace" ? (
              <div className="p-2 flex-1 flex flex-col">
                <FileTree
                  treeData={treeData}
                  refreshFileList={refreshFileList}
                  setDataFile={setDataFile}
                  fileLoaded={fileLoaded}
                  setFileLoaded={setFileLoaded}
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
        <div className="w-1/4 flex flex-row bg-blue pl-2">
          <div className="flex flex-col justify-start items-center h-full">
            {centerList.map((item, index) => (
              <span
                onClick={() => {
                  setParameter(() => ({
                    key: "",
                    idx: "",
                    value: null,
                  }));
                  setMiddleTab(item.value);
                }}
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
          <div className="flex-1 w-1/4 h-full border-t border-b border-r border-gray-300 bg-white">
            <ReadData
              keyType={middleTab}
              dataFile={dataFile}
              parameter={parameter}
              setParameter={setParameter}
            />
          </div>
        </div>
        <div className="flex flex-1 flex-col border border-gray-300">
          <div className="flex flex-row justify-start items-center ">
            {rightTabs.map((label, idx) => (
              <button
                onClick={() => setRightTab(label)}
                className={`py-0.5 px-3 text-xs ${
                  rightTab === label
                    ? "bg-white border-0"
                    : "border border-gray-300 hover:bg-blue-50"
                } text-gray-700 text-center cursor-pointer transition-colors`}
                key={idx}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex flex-1 bg-white">
            {rightTab === "Parameter" && parameter.key && (
              <ReadParameter
                parameter={parameter}
                setParameter={setParameter}
                dataFile={dataFile}
                setDataFile={setDataFile}
              />
            )}
            {rightTab === "Control" && <Control />}
          </div>
        </div>
      </div>
    </div>
  );
}
