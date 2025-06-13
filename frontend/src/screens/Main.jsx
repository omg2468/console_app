import FileTree from "../components/FileTree";
import { useState, useEffect, useCallback, useContext } from "react";
import {
  ImportFileToWorkspace,
  ListFiles,
  NewProject,
  SaveJsonFile,
  GetDefaultData,
} from "../../wailsjs/go/workspace/WorkspaceService";
import { ContextMenuContext } from "../store";

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

  const context = useContext(ContextMenuContext);

  const handleContextMenu = (e) => {
    e.stopPropagation();
    e.preventDefault();
    context?.showMenu(e.clientX, e.clientY, [
      { label: "New Project", action: "newProject" },
      { label: "New Group ", action: "newGroup" },
    ]);
  };

  const [treeData, setTreeData] = useState([]);

  const handleImport = async () => {
    try {
      const filePath = await SelectFileToImport();

      if (!filePath) {
        return;
      }
      const fileName = filePath.split(/[/\\]/).pop();


      await ImportFileToWorkspace(filePath,fileName);
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
    SaveJsonFile("api-json.json", jsonString);
  };

  useEffect(() => {
    refreshFileList();
  }, []);

  // useEffect(() => {
  //   const getDefaultData = async () => {
  //     if (!treeData?.length) return;
  //     try {
  //       const content = await GetDefaultData();
  //       const data = JSON.parse(content);
  //       if (data) setDataFile(data);
  //     } catch (error) {
  //       console.error("Error reading file:", error);
  //     }
  //   };

  //   getDefaultData();
  // }, [treeData]);

  const systemCenterData = [
    { label: "MODBUS RTU MASTER", key: "rtu_master" },
    { label: "MODBUS RTU SLAVE", key: "rtu_slave" },
    { label: "MODBUS TCP MASTER", key: "tcp_master" },
    { label: "MODBUS TCP SLAVE", key: "tcp_slave" },
    { label: "COMMON", key: "common" },
  ];

  const readData = useCallback(
    (key) => {
      switch (key) {
        case "system":
          return (
            <div>
              <p className="text-sm pl-2 border-b border-gray-100 bg-gray-200">
                SYSTEM SETTINGS
              </p>
              {systemCenterData
                ? systemCenterData.map((item, index) => (
                    <div
                      key={index}
                      onClick={() =>
                        setParameter({
                          key: item.key,
                          idx: index,
                          value: dataFIle[item.key],
                        })
                      }
                      className={`p-2 pl-6 cursor-pointer border-b border-gray-100 hover:bg-blue-100 ${
                        parameter.key === item.key && parameter.idx === index
                          ? "bg-blue-200"
                          : "white"
                      }`}
                    >
                      <p className="text-sm">{item.label}</p>
                    </div>
                  ))
                : null}
            </div>
          );
        case "ftp":
          return (
            <div>
              <p className="text-sm pl-2 border-b border-gray-100 bg-gray-200">
                FTP SETTINGS
              </p>
              {dataFIle?.ftp
                ? dataFIle.ftp.map((item, index) => (
                    <div
                      key={index}
                      onClick={() =>
                        setParameter({
                          key: "ftp",
                          idx: index,
                          value: item,
                        })
                      }
                      className={`p-2 pl-6 cursor-pointer border-b border-gray-100 hover:bg-blue-100 ${
                        parameter.key === "ftp" && parameter.idx === index
                          ? "bg-blue-200"
                          : "white"
                      }`}
                    >
                      <p className="text-sm">FTP.{index}</p>
                    </div>
                  ))
                : null}
            </div>
          );
        case "control":
          return (
            <div>
              <p className="text-sm pl-2 border-b border-gray-100 bg-gray-200">
                CONTROL SETTINGS
              </p>
              {dataFIle?.control ? (
                Array.isArray(dataFIle.control) ? (
                  dataFIle.control.map((item, index) => (
                    <div
                      key={index}
                      onClick={() =>
                        setParameter({
                          key: "control",
                          idx: index,
                          value: item,
                        })
                      }
                      className={`p-2 pl-6 cursor-pointer border-b border-gray-100 hover:bg-blue-100 ${
                        parameter.key === "control" && parameter.idx === index
                          ? "bg-blue-200"
                          : "white"
                      }`}
                    >
                      <p className="text-sm">Control.{index}</p>
                    </div>
                  ))
                ) : (
                  <div
                    onClick={() =>
                      setParameter({
                        key: "control",
                        idx: 0,
                        value: dataFIle.control,
                      })
                    }
                    className={`p-2 pl-6 cursor-pointer border-b border-gray-100 hover:bg-blue-100 ${
                      parameter.key === "control" ? "bg-blue-200" : "white"
                    }`}
                  >
                    <p className="text-sm">CONTROL 0</p>
                  </div>
                )
              ) : null}
            </div>
          );
        case "di":
          return (
            <div>
              <p className="text-sm pl-2 border-b border-gray-100 bg-gray-200">
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
                      <p className="text-sm">DI.{index}</p>
                    </div>
                  ))
                : null}
            </div>
          );
        case "do":
          return (
            <div>
              <p className="text-sm pl-2 border-b border-gray-100 bg-gray-200">
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
                      <p className="text-sm">DO.{index}</p>
                    </div>
                  ))
                : null}
            </div>
          );
        case "tag":
          return (
            <div>
              <p className="text-sm pl-2 border-b border-gray-100 bg-gray-200">
                TAG SETTINGS
              </p>
              {dataFIle?.prog
                ? dataFIle.prog.map((item, index) => (
                    <div
                      key={index}
                      onClick={() =>
                        setParameter({
                          key: "tag",
                          idx: index,
                          value: item,
                        })
                      }
                      className={`p-2 pl-6 cursor-pointer border-b border-gray-100 hover:bg-blue-100 ${
                        parameter.key === "tag" && parameter.idx === index
                          ? "bg-blue-200"
                          : "white"
                      }`}
                    >
                      <p className="text-sm">TAG.{index}</p>
                    </div>
                  ))
                : null}
            </div>
          );
        case "program":
          return (
            <div>
              <p className="text-sm pl-2 border-b border-gray-100 bg-gray-200">
                PROGRAM SETTINGS
              </p>
              {dataFIle?.prog
                ? dataFIle.prog.map((item, index) => (
                    <div
                      key={index}
                      onClick={() =>
                        setParameter({
                          key: "program",
                          idx: index,
                          value: item,
                        })
                      }
                      className={`p-2 pl-6 cursor-pointer border-b border-gray-100 hover:bg-blue-100 ${
                        parameter.key === "program" && parameter.idx === index
                          ? "bg-blue-200"
                          : "white"
                      }`}
                    >
                      <p className="text-sm">PROG.{index}</p>
                    </div>
                  ))
                : null}
            </div>
          );
        case "timer":
          return (
            <div>
              <p className="text-sm pl-2 border-b border-gray-100 bg-gray-200">
                TIMER SETTINGS
              </p>
              {dataFIle?.timers
                ? dataFIle.timers.map((item, index) => (
                    <div
                      key={index}
                      onClick={() =>
                        setParameter({
                          key: "timer",
                          idx: index,
                          value: item,
                        })
                      }
                      className={`p-2 pl-6 cursor-pointer border-b border-gray-100 hover:bg-blue-100 ${
                        parameter.key === "timer" && parameter.idx === index
                          ? "bg-blue-200"
                          : "white"
                      }`}
                    >
                      <p className="text-sm">TIMER.{index}</p>
                    </div>
                  ))
                : null}
            </div>
          );
        case "modbus":
          return (
            <div>
              <p className="text-sm pl-2 border-b border-gray-100 bg-gray-200">
                MODBUS SETTINGS
              </p>
              {dataFIle?.modbus_reader
                ? dataFIle.modbus_reader.map((item, index) => (
                    <div
                      key={index}
                      onClick={() =>
                        setParameter({
                          key: "modbus",
                          idx: index,
                          value: item,
                        })
                      }
                      className={`p-2 pl-6 cursor-pointer border-b border-gray-100 hover:bg-blue-100 ${
                        parameter.key === "modbus" && parameter.idx === index
                          ? "bg-blue-200"
                          : "white"
                      }`}
                    >
                      <p className="text-sm">MODBUS.{index}</p>
                    </div>
                  ))
                : null}
            </div>
          );
        default:
          return null;
      }
    },
    [dataFIle, parameter.key, parameter.idx, systemCenterData]
  );

  const readParameter = useCallback(
    (item) => {
      switch (item.key) {
        case "rtu_master":
          return (
            <div className="h-full flex-1">
              <table className="w-full">
                <thead>
                  <tr className="">
                    <th className="px-2 py-1 text-sm text-center min-w-[150px] border-b">
                      Parameter
                    </th>
                    <th className="px-2 py-1 text-sm text-center w-full border-b border-l border-r">
                      Value
                    </th>
                  </tr>
                  <tr className="bg-gray-200">
                    <th className="px-2 py-1 text-sm text-right min-w-[150px] border-b">
                      Modbus RTU master
                    </th>
                    <th className="px-2 py-1 text-sm text-left w-full border-b font-normal"></th>
                  </tr>
                </thead>
                <tbody>
                  {item.value && (
                    <>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Enable
                        </td>
                        <td className="px-2 py-1 text-sm">
                          <input
                            type="checkbox"
                            checked={!!parameter.value.en}
                            className="w-4 h-4 accent-blue-500 cursor-pointer"
                          />
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Baudrate
                        </td>
                        <td className="px-2 py-1 text-sm">
                          {parameter.value.baudrate}
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Parity
                        </td>
                        <td className="px-2 py-1 text-sm">
                          <select
                            value={parameter.value.parity}
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg max-w-[150px]"
                          >
                            <option value={"N"}>Even</option>
                          </select>
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Stop bits
                        </td>
                        <td className="px-2 py-1 text-sm">
                          <select
                            value={parameter.value.stopbits}
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg max-w-[150px]"
                          >
                            <option value={1}>1</option>
                          </select>
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Round delay(ms)
                        </td>
                        <td className="px-2 py-1 text-sm">
                          {parameter.value.rddelay}
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Read delay(ms)
                        </td>
                        <td className="px-2 py-1 text-sm">
                          {parameter.value.delay}
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Wait max(ms)
                        </td>
                        <td className="px-2 py-1 text-sm">
                          {parameter.value.wait}
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Retry
                        </td>
                        <td className="px-2 py-1 text-sm">
                          {parameter.value.retry}
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          );
        case "rtu_slave":
          return (
            <div className="h-full flex-1">
              <table className="w-full">
                <thead>
                  <tr className="">
                    <th className="px-2 py-1 text-sm text-center min-w-[150px] border-b">
                      Parameter
                    </th>
                    <th className="px-2 py-1 text-sm text-center w-full border-b border-l border-r">
                      Value
                    </th>
                  </tr>
                  <tr className="bg-gray-200">
                    <th className="px-2 py-1 text-sm text-right min-w-[150px] border-b">
                      Modbus RTU slave
                    </th>
                    <th className="px-2 py-1 text-sm text-left w-full border-b font-normal"></th>
                  </tr>
                </thead>
                <tbody>
                  {item.value && (
                    <>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Enable
                        </td>
                        <td className="px-2 py-1 text-sm">
                          <input
                            type="checkbox"
                            checked={!!parameter.value.en}
                            className="w-4 h-4 accent-blue-500 cursor-pointer"
                          />
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          ID
                        </td>
                        <td className="px-2 py-1 text-sm">
                          {parameter.value.id}
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Baudrate
                        </td>
                        <td className="px-2 py-1 text-sm">
                          {parameter.value.baudrate}
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Parity
                        </td>
                        <td className="px-2 py-1 text-sm">
                          <select
                            value={parameter.value.parity}
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg max-w-[150px]"
                          >
                            <option value={"N"}>None</option>
                          </select>
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Stop bits
                        </td>
                        <td className="px-2 py-1 text-sm">
                          <select
                            value={parameter.value.stopbits}
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg max-w-[150px]"
                          >
                            <option value={1}>1</option>
                          </select>
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Data order
                        </td>
                        <td className="px-2 py-1 text-sm">
                          <select
                            value={parameter.value.order}
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg max-w-[150px]"
                          >
                            <option value={1}>CD AB</option>
                          </select>
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Address offset
                        </td>
                        <td className="px-2 py-1 text-sm">
                          {parameter.value.offset}
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          );
        case "tcp_master":
          return <div className="h-full flex-1"></div>;
        case "tcp_slave":
          return (
            <div className="h-full flex-1">
              <table className="w-full">
                <thead>
                  <tr className="">
                    <th className="px-2 py-1 text-sm text-center min-w-[150px] border-b">
                      Parameter
                    </th>
                    <th className="px-2 py-1 text-sm text-center w-full border-b border-l border-r">
                      Value
                    </th>
                  </tr>
                  <tr className="bg-gray-200">
                    <th className="px-2 py-1 text-sm text-right min-w-[150px] border-b">
                      Modbus TCP slave
                    </th>
                    <th className="px-2 py-1 text-sm text-left w-full border-b font-normal"></th>
                  </tr>
                </thead>
                <tbody>
                  {item.value && (
                    <>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Enable
                        </td>
                        <td className="px-2 py-1 text-sm">
                          <input
                            type="checkbox"
                            checked={!!parameter.value.en}
                            className="w-4 h-4 accent-blue-500 cursor-pointer"
                          />
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Port
                        </td>
                        <td className="px-2 py-1 text-sm">
                          {parameter.value.port}
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          UnitID
                        </td>
                        <td className="px-2 py-1 text-sm">
                          {parameter.value.id}
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Data order
                        </td>
                        <td className="px-2 py-1 text-sm">
                          <select
                            value={parameter.value.parity}
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg max-w-[150px]"
                          >
                            <option value={0}>AB CD</option>
                          </select>
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Address offset
                        </td>
                        <td className="px-2 py-1 text-sm">
                          {parameter.value.offset}
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          );
        case "common":
          return (
            <div className="h-full flex-1">
              <table className="w-full">
                <thead>
                  <tr className="">
                    <th className="px-2 py-1 text-sm text-center min-w-[150px] border-b">
                      Parameter
                    </th>
                    <th className="px-2 py-1 text-sm text-center w-full border-b border-l border-r">
                      Value
                    </th>
                  </tr>
                  <tr className="bg-gray-200">
                    <th className="px-2 py-1 text-sm text-right min-w-[150px] border-b">
                      System common
                    </th>
                    <th className="px-2 py-1 text-sm text-left w-full border-b font-normal"></th>
                  </tr>
                </thead>
                <tbody>
                  {item.value && (
                    <>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          LCD page time
                        </td>
                        <td className="px-2 py-1 text-sm">
                          {parameter.value.page_dur}
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Sync time from
                        </td>
                        <td className="px-2 py-1 text-sm">
                          <select
                            value={parameter.value.time_sync}
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg max-w-[150px]"
                          >
                            <option value={1}>Internet</option>
                          </select>
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Null context
                        </td>
                        <td className="px-2 py-1 text-sm">
                          <input
                            type="checkbox"
                            checked={!!parameter.value.null_ctx}
                            className="w-4 h-4 accent-blue-500 cursor-pointer"
                          />
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Config port
                        </td>
                        <td className="px-2 py-1 text-sm">
                          {parameter.value.conf_port}
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Report precision
                        </td>
                        <td className="px-2 py-1 text-sm">
                          {parameter.value.precision}
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          AI location
                        </td>
                        <td className="px-2 py-1 text-sm">
                          {parameter.value.ai_loc}
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          DI location
                        </td>
                        <td className="px-2 py-1 text-sm">
                          {parameter.value.di_loc}
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          DO location
                        </td>
                        <td className="px-2 py-1 text-sm">
                          {parameter.value.do_loc}
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Memory persistent
                        </td>
                        <td className="px-2 py-1 text-sm">
                          <input
                            type="checkbox"
                            checked={!!parameter.value.persist}
                            className="w-4 h-4 accent-blue-500 cursor-pointer"
                          />
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          );
        case "ftp":
          return (
            <div className="h-full flex-1">
              <table className="w-full">
                <thead>
                  <tr className="">
                    <th className="px-2 py-1 text-sm text-center min-w-[150px] border-b">
                      Parameter
                    </th>
                    <th className="px-2 py-1 text-sm text-center w-full border-b border-l border-r">
                      Value
                    </th>
                  </tr>
                  <tr className="bg-gray-200">
                    <th className="px-2 py-1 text-sm text-right min-w-[150px] border-b">
                      Ftp Server
                    </th>
                    <th className="px-2 py-1 text-sm text-left w-full border-b font-normal">
                      {item.idx}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {item.value && (
                    <>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Enable
                        </td>
                        <td className="px-2 py-1 text-sm">
                          <input
                            type="checkbox"
                            checked={!!parameter.value.en}
                            className="w-4 h-4 accent-blue-500 cursor-pointer"
                          />
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Global
                        </td>
                        <td className="px-2 py-1 text-sm">
                          <input
                            type="checkbox"
                            checked={!!parameter.value.client.global}
                            className="w-4 h-4 accent-blue-500 cursor-pointer"
                          />
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Make directory
                        </td>
                        <td className="px-2 py-1 text-sm">
                          <select
                            value={parameter.value.client.make_dir_type}
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg max-w-[150px]"
                          >
                            <option value={0}>Day only</option>
                          </select>
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Ip/hostname
                        </td>
                        <td className="px-2 py-1 text-sm">
                          <input
                            type="text"
                            value={parameter.value.client.ip}
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg px-2 py-1 w-full"
                          />
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Port
                        </td>
                        <td className="px-2 py-1 text-sm">
                          {parameter.value.client.port}
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Username
                        </td>
                        <td className="px-2 py-1 text-sm">
                          {parameter.value.client.user}
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Password
                        </td>
                        <td className="px-2 py-1 text-sm">
                          {parameter.value.passwd}
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Log folder
                        </td>
                        <td className="px-2 py-1 text-sm">
                          {parameter.value.remote_prefix}
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Assert
                        </td>
                        <td className="px-2 py-1 text-sm">
                          <input
                            type="checkbox"
                            checked={!!parameter.value.client.assert}
                            className="w-4 h-4 accent-blue-500 cursor-pointer"
                          />
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Disable EPASV
                        </td>
                        <td className="px-2 py-1 text-sm">
                          <input
                            type="checkbox"
                            checked={!!parameter.value.client.dep}
                            className="w-4 h-4 accent-blue-500 cursor-pointer"
                          />
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Provin
                        </td>
                        <td className="px-2 py-1 text-sm">
                          {parameter.value.creator.provin}
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          District
                        </td>
                        <td className="px-2 py-1 text-sm">
                          {parameter.value.creator.district}
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Station
                        </td>
                        <td className="px-2 py-1 text-sm">
                          {parameter.value.creator.station}
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          File type
                        </td>
                        <td className="px-2 py-1 text-sm">
                          <select
                            value={parameter.value.creator.file_type}
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg max-w-[150px]"
                          >
                            <option value={0}>CSV</option>
                          </select>
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Backup months
                        </td>
                        <td className="px-2 py-1 text-sm">
                          <select
                            value={parameter.value.creator.keep_month}
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg max-w-[150px]"
                          >
                            <option value={0}>0</option>
                          </select>
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Log duration
                        </td>
                        <td className="px-2 py-1 text-sm">
                          {parameter.value.duration}
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Log at second
                        </td>
                        <td className="px-2 py-1 text-sm">
                          {parameter.value.second}
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Copy to Sdcard
                        </td>
                        <td className="px-2 py-1 text-sm">
                          <input
                            type="checkbox"
                            checked={!!parameter.value.client.clone}
                            className="w-4 h-4 accent-blue-500 cursor-pointer"
                          />
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          );
        case "control":
          return (
            <div className="h-full flex-1">
              <table className="w-full">
                <thead>
                  <tr className="">
                    <th className="px-2 py-1 text-sm text-center min-w-[150px] border-b">
                      Parameter
                    </th>
                    <th className="px-2 py-1 text-sm text-center w-full border-b border-l border-r">
                      Value
                    </th>
                  </tr>
                  <tr className="bg-gray-200">
                    <th className="px-2 py-1 text-sm text-right min-w-[150px] border-b">
                      Control Server
                    </th>
                    <th className="px-2 py-1 text-sm text-left w-full border-b font-normal">
                      {item.idx}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {item.value && (
                    <>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Enable
                        </td>
                        <td className="px-2 py-1 text-sm">
                          <input
                            type="checkbox"
                            checked={!!parameter.value.en}
                            className="w-4 h-4 accent-blue-500 cursor-pointer"
                          />
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Type
                        </td>
                        <td className="px-2 py-1 text-sm">
                          <select
                            value={parameter.value.act_type}
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg max-w-[150px]"
                          >
                            <option value="RAW">RAW</option>
                            <option value="MQTT">MQTT</option>
                            <option value="UDP">UDP</option>
                          </select>
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Ip/hostname
                        </td>
                        <td className="px-2 py-1 text-sm">
                          {parameter.value.ip}
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Port
                        </td>
                        <td className="px-2 py-1 text-sm">
                          {parameter.value.port}
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Username
                        </td>
                        <td className="px-2 py-1 text-sm">
                          {parameter.value.user}
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Password
                        </td>
                        <td className="px-2 py-1 text-sm">
                          {parameter.value.password}
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Identify
                        </td>
                        <td className="px-2 py-1 text-sm">
                          {parameter.value.uuid}
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Identify2
                        </td>
                        <td className="px-2 py-1 text-sm">
                          {parameter.value.uuid2}
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Pin index
                        </td>
                        <td className="px-2 py-1 text-sm">
                          {parameter.value.index}
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Pulse Duty(s)
                        </td>
                        <td className="px-2 py-1 text-sm">
                          {parameter.value.duty}
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Port 2
                        </td>
                        <td className="px-2 py-1 text-sm">
                          {parameter.value.port2}
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Username 2
                        </td>
                        <td className="px-2 py-1 text-sm">
                          {parameter.value.user2}
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Password 2
                        </td>
                        <td className="px-2 py-1 text-sm">
                          {parameter.value.password2}
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          );
        case "di":
          return (
            <div className="h-full flex-1">
              <table className="w-full">
                <thead>
                  <tr className="">
                    <th className="px-2 py-1 text-sm text-center min-w-[150px] border-b">
                      Parameter
                    </th>
                    <th className="px-2 py-1 text-sm text-center w-full border-b border-l border-r">
                      Value
                    </th>
                  </tr>
                  <tr className="bg-gray-200">
                    <th className="px-2 py-1 text-sm text-right min-w-[150px] border-b ">
                      {item.key.toUpperCase()}
                    </th>
                    <th className="px-2 py-1 text-sm text-left w-full border-b font-normal">
                      {item.idx}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {item.value && (
                    <>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Active level
                        </td>
                        <td className="px-2 py-1 text-sm font-normat">
                          {parameter.value.act_lev === 0
                            ? "High"
                            : parameter.value.act_lev === 1
                            ? "Low"
                            : ""}
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Function
                        </td>
                        <td className="px-2 py-1 text-sm">
                          {parameter.value.act_type === 0
                            ? "Pulse"
                            : parameter.value.act_type === 1
                            ? "Level"
                            : ""}
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Value per pulse
                        </td>
                        <td className="px-2 py-1 text-sm">
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
            <div className="h-full flex-1">
              <table className="w-full">
                <thead>
                  <tr className="">
                    <th className="px-2 py-1 text-sm text-center min-w-[150px] border-b">
                      Parameter
                    </th>
                    <th className="px-2 py-1 text-sm text-center w-full border-b border-l border-r">
                      Value
                    </th>
                  </tr>
                  <tr className="bg-gray-200">
                    <th className="px-2 py-1 text-sm text-right min-w-[150px] border-b ">
                      {item.key.toUpperCase()}
                    </th>
                    <th className="px-2 py-1 text-sm text-left w-full border-b font-normal">
                      {item.idx}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {item.value && (
                    <>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Active type
                        </td>
                        <td className="px-2 py-1 text-sm font-normat">
                          {parameter.value.act_lev === 0
                            ? "High"
                            : parameter.value.act_lev === 1
                            ? "Low"
                            : ""}
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Control type
                        </td>
                        <td className="px-2 py-1 text-sm">
                          {parameter.value.act_type === 0
                            ? "Pulse"
                            : parameter.value.act_type === 1
                            ? "Level"
                            : ""}
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Duty (s)
                        </td>
                        <td className="px-2 py-1 text-sm">
                          {parameter.value.duty}
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Period
                        </td>
                        <td className="px-2 py-1 text-sm">
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
            <div className="h-full flex-1">
              <table className="w-full">
                <thead>
                  <tr className="">
                    <th className="px-2 py-1 text-sm text-center min-w-[150px] border-b">
                      Parameter
                    </th>
                    <th className="px-2 py-1 text-sm text-center w-full border-b border-l border-r">
                      Value
                    </th>
                  </tr>
                  <tr className="bg-gray-200">
                    <th className="px-2 py-1 text-sm text-right min-w-[150px] border-b ">
                      TAG
                    </th>
                    <th className="px-2 py-1 text-sm text-left w-full border-b font-normal">
                      {item.idx}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {item.value && (
                    <>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Enabled
                        </td>
                        <td className="px-2 py-1 text-sm">
                          <input
                            type="checkbox"
                            checked={!!parameter.value.en}
                            className="w-4 h-4 accent-blue-500 cursor-pointer"
                          />
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Description
                        </td>
                        <td className="px-2 py-1 text-sm font-normat">
                          {parameter.value.desc}
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Name
                        </td>
                        <td className="px-2 py-1 text-sm font-normat">
                          {parameter.value.name}
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Unit
                        </td>
                        <td className="px-2 py-1 text-sm font-normat">
                          {parameter.value.unit}
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Value index
                        </td>
                        <td className="px-2 py-1 text-sm font-normat">
                          {parameter.value.val_idx}
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Use 64bits
                        </td>
                        <td className="px-2 py-1 text-sm">
                          <input
                            type="checkbox"
                            checked={!!parameter.value.en}
                            className="w-4 h-4 accent-blue-500 cursor-pointer"
                          />
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Status index
                        </td>
                        <td className="px-2 py-1 text-sm font-normat">
                          {parameter.value.stat_idx}
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Report ftp servers
                        </td>
                        <td className="px-2 py-1 text-sm font-normat">
                          {parameter.value.unit}
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Average
                        </td>
                        <td className="px-2 py-1 text-sm font-normat">
                          {parameter.value.avg}
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          );
        case "program":
          return (
            <div className="h-full flex-1">
              <table className="w-full">
                <thead>
                  <tr className="">
                    <th className="px-2 py-1 text-sm text-center min-w-[150px] border-b">
                      Parameter
                    </th>
                    <th className="px-2 py-1 text-sm text-center w-full border-b border-l border-r">
                      Value
                    </th>
                  </tr>
                  <tr className="bg-gray-200">
                    <th className="px-2 py-1 text-sm text-right min-w-[150px] border-b ">
                      Program
                    </th>
                    <th className="px-2 py-1 text-sm text-left w-full border-b font-normal">
                      {item.idx}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {item.value && (
                    <>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Enabled
                        </td>
                        <td className="px-2 py-1 text-sm">
                          <input
                            type="checkbox"
                            checked={!!parameter.value.en}
                            className="w-4 h-4 accent-blue-500 cursor-pointer"
                          />
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Description
                        </td>
                        <td className="px-2 py-1 text-sm font-normat">
                          {parameter.value.desc}
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Code
                        </td>
                        <td className="px-2 py-1 text-sm font-normat">
                          <textarea
                            value={parameter.value.code}
                            onChange={(e) =>
                              setParameter((prev) => ({
                                ...prev,
                                value: { ...prev.value, code: e.target.value },
                              }))
                            }
                            rows={25}
                            className="bg-gray-50 border max-w-[550px] border-gray-300 text-gray-900 text-sm rounded-lg px-2 py-1 w-full resize-y font-mono"
                            placeholder="Enter code here..."
                          />
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          );
        case "timer":
          return (
            <div className="h-full flex-1">
              <table className="w-full">
                <thead>
                  <tr className="">
                    <th className="px-2 py-1 text-sm text-center min-w-[150px] border-b">
                      Parameter
                    </th>
                    <th className="px-2 py-1 text-sm text-center w-full border-b border-l border-r">
                      Value
                    </th>
                  </tr>
                  <tr className="bg-gray-200">
                    <th className="px-2 py-1 text-sm text-right min-w-[150px] border-b ">
                      Timer
                    </th>
                    <th className="px-2 py-1 text-sm text-left w-full border-b font-normal">
                      {item.idx}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {item.value && (
                    <>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Enabled
                        </td>
                        <td className="px-2 py-1 text-sm">
                          <input
                            type="checkbox"
                            checked={!!parameter.value.en}
                            className="w-4 h-4 accent-blue-500 cursor-pointer"
                          />
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Oneshot
                        </td>
                        <td className="px-2 py-1 text-sm">
                          <input
                            type="checkbox"
                            checked={!!parameter.value.one}
                            className="w-4 h-4 accent-blue-500 cursor-pointer"
                          />
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Interval
                        </td>
                        <td className="px-2 py-1 text-sm font-normat">
                          {parameter.value.int}
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Descripton
                        </td>
                        <td className="px-2 py-1 text-sm font-normat">
                          {parameter.value.desc}
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Code
                        </td>
                        <td className="px-2 py-1 text-sm font-normat">
                          <textarea
                            value={parameter.value.code}
                            onChange={(e) =>
                              setParameter((prev) => ({
                                ...prev,
                                value: { ...prev.value, code: e.target.value },
                              }))
                            }
                            rows={25}
                            className="bg-gray-50 border max-w-[550px] border-gray-300 text-gray-900 text-sm rounded-lg px-2 py-1 w-full resize-y font-mono"
                            placeholder="Enter code here..."
                          />
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          );
        case "modbus":
          return (
            <div className="h-full flex-1">
              <table className="w-full">
                <thead>
                  <tr className="">
                    <th className="px-2 py-1 text-sm text-center min-w-[150px] border-b">
                      Parameter
                    </th>
                    <th className="px-2 py-1 text-sm text-center w-full border-b border-l border-r">
                      Value
                    </th>
                  </tr>
                  <tr className="bg-gray-200">
                    <th className="px-2 py-1 text-sm text-right min-w-[150px] border-b ">
                      Modbus reader
                    </th>
                    <th className="px-2 py-1 text-sm text-left w-full border-b font-normal">
                      {item.idx}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {item.value && (
                    <>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Description
                        </td>
                        <td className="px-2 py-1 text-sm font-normat">
                          {parameter.value.desc}
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Enabled
                        </td>
                        <td className="px-2 py-1 text-sm">
                          <input
                            type="checkbox"
                            checked={!!parameter.value.en}
                            className="w-4 h-4 accent-blue-500 cursor-pointer"
                          />
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Type
                        </td>
                        <td className="px-2 py-1 text-sm">
                          <select
                            value={parameter.value.type}
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg max-w-[150px]"
                          >
                            <option value={2}>TCP</option>
                          </select>
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Address
                        </td>
                        <td className="px-2 py-1 text-sm">
                          {parameter.value.dev_a}
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          ID
                        </td>
                        <td className="px-2 py-1 text-sm">
                          {parameter.value.id}
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Register address
                        </td>
                        <td className="px-2 py-1 text-sm">
                          {parameter.value.reg_a}
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Data Type
                        </td>
                        <td className="px-2 py-1 text-sm">
                          <select
                            value={parameter.value.d_t}
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg max-w-[150px]"
                          >
                            <option value={4}>Input register</option>
                          </select>
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Data order
                        </td>
                        <td className="px-2 py-1 text-sm">
                          <select
                            value={parameter.value.d_o}
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg max-w-[150px]"
                          >
                            <option value={0}>AB CD</option>
                          </select>
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Data format
                        </td>
                        <td className="px-2 py-1 text-sm">
                          <select
                            value={parameter.value.d_f}
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg max-w-[150px]"
                          >
                            <option value={3}>32bit floating</option>
                          </select>
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Number object
                        </td>
                        <td className="px-2 py-1 text-sm">
                          {parameter.value.n_obj}
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Values location
                        </td>
                        <td className="px-2 py-1 text-sm">
                          {parameter.value.loc_val}
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Status location
                        </td>
                        <td className="px-2 py-1 text-sm">
                          {parameter.value.loc_stat}
                        </td>
                      </tr>
                      <tr className="">
                        <td className="px-2 py-1 text-sm text-right font-semibold">
                          Hold when read fail
                        </td>
                        <td className="px-2 py-1 text-sm">
                          <input
                            type="checkbox"
                            checked={!!parameter.value.kf}
                            className="w-4 h-4 accent-blue-500 cursor-pointer"
                          />
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          );
        default:
      }
    },
    [parameter]
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
        >
          Save As Project
        </button>
        <button
          onClick={() => handleImport()}
          className="rounded-md bg-white border border-gray-300 px-2 py-0.5 text-[10px] font-medium shadow-sm hover:bg-blue-50 hover:border-blue-400 active:bg-blue-100 active:border-blue-400 transition-colors"
        >
          Import Project
        </button>
        <button
          className="rounded-md bg-white border border-gray-300 px-2 py-0.5 text-[10px] font-medium shadow-sm hover:bg-blue-50 hover:border-blue-400 active:bg-blue-100 active:border-blue-400 transition-colors"
        >
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
            onContextMenu={handleContextMenu}
            className="flex-1 w-auto h-0 bg-white flex flex-col"
          >
            {leftTab === "Workspace" ? (
              <div className="p-2 flex-1 flex flex-col">
                <FileTree
                  treeData={treeData}
                  refreshFileList={refreshFileList}
                  setDataFile={setDataFile}
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
          <div className="flex-1 w-1/4 h-full border-t border-b border-r border-gray-300 bg-white">
            {readData(middleTab)}
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
          <div className="flex flex-1 bg-white">{readParameter(parameter)}</div>
        </div>
      </div>
    </div>
  );
}
