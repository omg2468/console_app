import FileTree from "../components/FileTree";
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  ImportFile,
  ListFiles,
  NewProject,
  ReadFile,
} from "../../wailsjs/go/workspace/WorkspaceService";

import { SelectFileToImport } from "../../wailsjs/go/main/App";

import ConnectComponent from "../components/Connect";

export default function Main({ onLoginOut }) {
  const [leftTab, setLeftTab] = useState("Workspace");
  const [middleTab, setMiddleTab] = useState("system");
  const [rightTab, setRightTab] = useState("Parameter");
  const tabsLeft = ["Workspace", "Device"];
  const [dataFIle, setDataFile] = useState(null);
  const [parameter, setParameter] = useState({
    key: "",
    idx: "",
    value: null,
  });

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

  useEffect(() => {
    const readFile = async () => {
      if (!treeData?.length) return;
      try {
        const content = await ReadFile("test.json");
        const data = JSON.parse(content);
        if (data) setDataFile(data);
        console.log("File content:", data);
      } catch (error) {
        console.error("Error reading file:", error);
      }
    };

    readFile();
  }, [treeData]);

  const readData = useCallback(
    (key) => {
      switch (key) {
        case "system":
          return (
            <pre className='text-xs p-2'>
              {JSON.stringify(dataFIle?.system || {}, null, 2)}
            </pre>
          );
        case "ftp":
          return (
            <pre className='text-xs p-2'>
              {JSON.stringify(dataFIle?.ftp || {}, null, 2)}
            </pre>
          );
        case "control":
          return (
            <pre className='text-xs p-2'>
              {JSON.stringify(dataFIle?.control || {}, null, 2)}
            </pre>
          );
        case "di":
          return (
            <div>
              <p className='text-sm pl-2 border-b border-gray-100 bg-gray-200'>
                DI SETTINGS
              </p>
              {dataFIle?.dis
                ? dataFIle.dis.map((item, index) => (
                    <div
                      key={index}
                      onClick={() =>
                        setParameter({
                          key: "di",
                          idx: index,
                          value: item,
                        })
                      }
                      className={`p-2 pl-6 cursor-pointer border-b border-gray-100 hover:bg-blue-100 ${
                        parameter.key === "di" && parameter.idx === index
                          ? "bg-blue-200"
                          : "white"
                      }`}
                    >
                      <p className='text-sm'>DI.{index}</p>
                    </div>
                  ))
                : null}
            </div>
          );
        case "do":
          return (
            <div>
              <p className='text-sm pl-2 border-b border-gray-100 bg-gray-200'>
                DO SETTINGS
              </p>
              {dataFIle?.dos
                ? dataFIle.dos.map((item, index) => (
                    <div
                      key={index}
                      onClick={() =>
                        setParameter({
                          key: "do",
                          idx: index,
                          value: item,
                        })
                      }
                      className={`p-2 pl-6 cursor-pointer border-b border-gray-100 hover:bg-blue-100 ${
                        parameter.key === "do" && parameter.idx === index
                          ? "bg-blue-200"
                          : "white"
                      }`}
                    >
                      <p className='text-sm'>DO.{index}</p>
                    </div>
                  ))
                : null}
            </div>
          );
        case "tag":
          return (
            <pre className='text-xs p-2'>
              {JSON.stringify(dataFIle?.tag || {}, null, 2)}
            </pre>
          );
        case "program":
          return (
            <pre className='text-xs p-2'>
              {JSON.stringify(dataFIle?.program || {}, null, 2)}
            </pre>
          );
        case "timer":
          return (
            <pre className='text-xs p-2'>
              {JSON.stringify(dataFIle?.timer || {}, null, 2)}
            </pre>
          );
        case "modbus":
          return (
            <pre className='text-xs p-2'>
              {JSON.stringify(dataFIle?.modbus || {}, null, 2)}
            </pre>
          );
        default:
          return null;
      }
    },
    [dataFIle, parameter.key, parameter.idx],
  );

  const readParameter = useCallback(
    (item) => {
      switch (item.key) {
        case "system":
          return dataFIle?.system || {};
        case "ftp":
          return dataFIle?.ftp || {};
        case "control":
          return dataFIle?.control || {};
        case "di":
          return (
            <div className='h-full flex-1'>
              <table className='w-full'>
                <thead>
                  <tr className=''>
                    <th className='px-2 py-1 text-sm text-center min-w-[150px] border-b'>
                      Parameter
                    </th>
                    <th className='px-2 py-1 text-sm text-center w-full border-b border-l border-r'>
                      Value
                    </th>
                  </tr>
                  <tr className='bg-gray-200'>
                    <th className='px-2 py-1 text-sm text-right min-w-[150px] border-b '>
                      {item.key.toUpperCase()}
                    </th>
                    <th className='px-2 py-1 text-sm text-left w-full border-b font-normal'>
                      {item.idx}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {item.value && (
                    <>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Active level
                        </td>
                        <td className='px-2 py-1 text-sm font-normat'>
                          {parameter.value.act_lev === 0
                            ? "High"
                            : parameter.value.act_lev === 1
                            ? "Low"
                            : ""}
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Function
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          {parameter.value.act_type === 0
                            ? "Pulse"
                            : parameter.value.act_type === 1
                            ? "Level"
                            : ""}
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Value per pulse
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          {parameter.value.increment}
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          );
        case "do":
          return (
            <div className='h-full flex-1'>
              <table className='w-full'>
                <thead>
                  <tr className=''>
                    <th className='px-2 py-1 text-sm text-center min-w-[150px] border-b'>
                      Parameter
                    </th>
                    <th className='px-2 py-1 text-sm text-center w-full border-b border-l border-r'>
                      Value
                    </th>
                  </tr>
                  <tr className='bg-gray-200'>
                    <th className='px-2 py-1 text-sm text-right min-w-[150px] border-b '>
                      {item.key.toUpperCase()}
                    </th>
                    <th className='px-2 py-1 text-sm text-left w-full border-b font-normal'>
                      {item.idx}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {item.value && (
                    <>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Active type
                        </td>
                        <td className='px-2 py-1 text-sm font-normat'>
                          {parameter.value.act_lev === 0
                            ? "High"
                            : parameter.value.act_lev === 1
                            ? "Low"
                            : ""}
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Control type
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          {parameter.value.act_type === 0
                            ? "Pulse"
                            : parameter.value.act_type === 1
                            ? "Level"
                            : ""}
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Duty (s)
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          {parameter.value.duty}
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Period
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          {parameter.value.period}
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          );
        case "tag":
          return (
            <pre className='text-xs p-2'>
              {JSON.stringify(dataFIle?.tag || {}, null, 2)}
            </pre>
          );
        case "program":
          return (
            <pre className='text-xs p-2'>
              {JSON.stringify(dataFIle?.program || {}, null, 2)}
            </pre>
          );
        case "timer":
          return (
            <pre className='text-xs p-2'>
              {JSON.stringify(dataFIle?.timer || {}, null, 2)}
            </pre>
          );
        case "modbus":
          return (
            <pre className='text-xs p-2'>
              {JSON.stringify(dataFIle?.modbus || {}, null, 2)}
            </pre>
          );
        default:
      }
    },
    [parameter],
  );

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
          <div className='flex-1 w-1/4 h-full border-t border-b border-r border-gray-300 bg-white'>
            {readData(middleTab)}
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
          <div className='flex flex-1 bg-white'>{readParameter(parameter)}</div>
        </div>
      </div>
    </div>
  );
}
