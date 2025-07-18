import FileTree from "../components/FileTree";
import { useState, useEffect, useContext } from "react";
import {
  ImportFileToWorkspace,
  ListFiles,
  NewProject,
  SaveJsonFile,
  SaveJsonToPath,
  GetDefaultData,
} from "../../wailsjs/go/workspace/WorkspaceService";
import ReadData from "../components/ReadData";
import ReadParameter from "../components/ReadParameter";
import Control from "../components/Control";
import MemoryView from "../components/MemoryView";
import TagView from "../components/TagView";

import {
  SelectFileToImport,
  SelectFileToExport,
  ShowErrorDialog,
  ShowInfoDialog,
} from "../../wailsjs/go/main/App";

import ConnectComponent from "../components/Connect";

import { ContextMenuContext } from "../store";

export default function Main({ onLoginOut }) {
  const [leftTab, setLeftTab] = useState("Device");
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

  const context = useContext(ContextMenuContext);

  function normalizeWorkspacePath(path) {
    return path.replace(/^workspace\//, "");
  }

  const [fileLoaded, setFileLoaded] = useState("");

  useEffect(() => {
    if (dataFile) return;
    GetDefaultData()
      .then((data) => {
        setDataFile(JSON.parse(data));
        // setFileLoaded("default.json");
      })
      .catch((err) => {
        ShowErrorDialog("Failed to load default data: " + err.message);
      });
  }, []);

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
      ShowInfoDialog(`${fileName} Import file thành công!`, "Import");
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
      ShowInfoDialog("Lưu project thành công!", "Save Project");
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
        z;
        ShowInfoDialog("Lưu file thành công!", "Save As Project");
      } catch (error) {
        ShowErrorDialog(error);
      }
    });
  };

  const handleAction = async (name) => {
    if (!name || !name.trim() || !name.toLowerCase().endsWith(".json")) {
      setInput("");
      setShowModal(false);
      ShowErrorDialog("Tên không hợp lệ");
      return;
    }

    try {
      await NewProject(name);
      setInput("");
      setShowModal(false);
      ShowInfoDialog(`Tạo project ${name} thành công!`, "New Project");
      refreshFileList()
    } catch (err) {
      setInput("");
      setShowModal(false);
      ShowErrorDialog(`Không thể tạo project: ${err.message || err}`);
    }
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
          className='rounded-md bg-white border border-gray-300 px-2 py-0.5 text-[10px] font-medium shadow-sm hover:bg-blue-50 hover:border-blue-400 active:bg-blue-100 active:border-blue-400 transition-colors'
        >
          Import Project
        </button>
      </div>
      <div className='flex-1 mt-2 w-full overflow-hidden flex flex-row'>
        <div className='w-1/4 flex flex-col'>
          <div className='flex'>
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

          <div className='flex-1 w-auto h-0 bg-white flex flex-col'>
            <div className='p-2 flex-1 flex flex-col'>
              <div className={leftTab === "Workspace" ? "visible" : "hidden"}>
                <FileTree
                  treeData={treeData}
                  refreshFileList={refreshFileList}
                  setDataFile={setDataFile}
                  fileLoaded={fileLoaded}
                  setFileLoaded={setFileLoaded}
                />
              </div>

              <div className={leftTab === "Device" ? "visible" : "hidden"}>
                <ConnectComponent
                  dataFile={dataFile}
                  setDataFile={setDataFile}
                  fileLoaded={fileLoaded}
                  setFileLoaded={setFileLoaded}
                />
              </div>
              {/* <textarea
                className='mt-2 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:border-blue-500 w-full resize-none h-[50px]'
                placeholder='Data từ thiết bị'
                value={context.dataTest}
                rows={30}
              /> */}
            </div>
          </div>
        </div>
        <div className='w-1/5 flex flex-row bg-blue pl-2'>
          <div className='flex flex-col justify-start items-center h-full'>
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
          <div className='flex-1 w-1/4 h-full border-t border-b border-r border-gray-300 bg-white'>
            <ReadData
              keyType={middleTab}
              dataFile={dataFile}
              setDataFile={setDataFile}
              parameter={parameter}
              setParameter={setParameter}
              setRightTab={setRightTab}
            />
          </div>
        </div>
        <div className='flex flex-1 flex-col border border-gray-300'>
          <div className='flex flex-row justify-start items-center '>
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
          <div className='flex flex-1 bg-white'>
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
          className='fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50'
          // onClick={() => setShowModal(false)}
        >
          <div
            className='bg-white p-6 rounded-xl shadow-2xl w-full max-w-xs flex flex-col gap-4'
            onClick={(e) => e.stopPropagation()}
          >
            <div className='text-lg font-bold text-center mb-2 text-blue-700'>
              New Project
            </div>
            <input
              type='text'
              className='w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 text-sm'
              placeholder='Nhập tên file .json'
              value={input}
              onChange={(e) => setInput(e.target.value)}
              autoFocus
            />
            <div className='flex flex-row gap-3 justify-center'>
              <button
                className='flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition'
                onClick={() => handleAction(input)}
              >
                Save
              </button>
              <button
                className='flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition'
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
