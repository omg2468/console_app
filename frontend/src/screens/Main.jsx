import FileTree from "../components/FileTree";
import { useState, useEffect, useContext } from "react";
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
import MemoryView from "../components/MemoryView";
import TagView from "../components/TagView";

import {
  SelectFileToImport,
  SelectFileToExport,
  ShowErrorDialog,
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

  const [showModal, setShowModal] = useState(false);
  const [input, setInput] = useState("");

  function normalizeWorkspacePath(path) {
    return path.replace(/^workspace\//, "");
  }

  const [fileLoaded, setFileLoaded] = useState("");

  const context = useContext(ContextMenuContext);
  useEffect(() => {
    if (!parameter.key) return;
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
  }, [dataFile]);

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
      ShowErrorDialog(error);
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
    if (!dataFile) return;

    try {
      const jsonObject = { ...dataFile };
      const jsonString = JSON.stringify(jsonObject);
      const cleanPath = normalizeWorkspacePath(fileLoaded);
      await SaveJsonFile(cleanPath, jsonString);
    } catch (error) {
      ShowErrorDialog(error);
    }
  };

  const handleSaveAsProject = async () => {
    if (!dataFile) return;
    const jsonData = JSON.stringify({ ...dataFile });

    SelectFileToExport("api-json.json").then(async (filePath) => {
      if (!filePath) {
        return;
      }
      try {
        await SaveJsonToPath(jsonData, filePath);
      } catch (error) {
        ShowErrorDialog(error);
      }
    });
  };

  const handleAction = async (name) => {
    if (!name || !name.trim()) {
      ShowErrorDialog("Tên không hợp lệ");
      return;
    }
    if (!name.toLowerCase().endsWith(".json")) {
      ShowErrorDialog("Chỉ cho phép tạo file với phần mở rộng .json");
      return;
    }
    await NewProject(name);
    setInput("");
    setShowModal({ show: false, action: null });
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
          onClick={() => {
            setInput("default.json");
            setShowModal(true);
          }}
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
            color: fileLoaded ? "black" : "gray",
          }}
          onClick={handleSaveProject}
          disabled={!fileLoaded}
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
                className={`cursor-pointer px-2 user-none text-xs ${
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
                  setRightTab("Parameter");
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
              setDataFile={setDataFile}
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
            {rightTab === "Memory view" && <MemoryView />}
            {rightTab === "Tag view" && <TagView />}
          </div>
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
              className="custom w-full px-3 py-2 border border-gray-300 rounded-md mb-4 focus:outline-none focus:border-blue-500"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <div className="flex flex-row justify-around">
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={() => handleAction(input)}
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
    </div>
  );
}
