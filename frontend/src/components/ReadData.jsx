import { useCallback } from "react";

const systemCenterData = [
  { label: "MODBUS RTU MASTER", key: "rtu_master" },
  { label: "MODBUS RTU SLAVE", key: "rtu_slave" },
  { label: "MODBUS TCP MASTER", key: "tcp_master" },
  { label: "MODBUS TCP SLAVE", key: "tcp_slave" },
  { label: "COMMON", key: "common" },
];

const ReadData = ({
  dataFile,
  parameter,
  setDataFile,
  setParameter,
  keyType,
  setRightTab,
}) => {
  const readData = useCallback(
    (key) => {
      switch (key) {
        case "system":
          return (
            <div>
              <p className='text-xs pl-2 border-b border-gray-100 bg-gray-200'>
                SYSTEM SETTINGS
              </p>
              {dataFile && systemCenterData
                ? systemCenterData.map((item, index) => (
                    <div
                      key={index}
                      onClick={() => {
                        setParameter({
                          key: item.key,
                          idx: index,
                          value: dataFile[item.key],
                        });
                        setRightTab("Parameter");
                      }}
                      className={`p-2 pl-6 cursor-pointer border-b border-gray-100 hover:bg-blue-100 ${
                        parameter.key === item.key && parameter.idx === index
                          ? "bg-blue-200"
                          : "white"
                      }`}
                    >
                      <p className='text-xs'>{item.label}</p>
                    </div>
                  ))
                : null}
            </div>
          );
        case "ftp":
          return (
            <div>
              <p className='text-xs pl-2 border-b border-gray-100 bg-gray-200'>
                FTP SETTINGS
              </p>
              {dataFile?.ftp
                ? dataFile.ftp.map((item, index) => (
                    <div
                      key={index}
                      onClick={() => {
                        setRightTab("Parameter");
                        setParameter({
                          key: "ftp",
                          idx: index,
                          value: item,
                        });
                      }}
                      className={`p-2 pl-6 cursor-pointer border-b border-gray-100 hover:bg-blue-100 ${
                        parameter.key === "ftp" && parameter.idx === index
                          ? "bg-blue-200"
                          : "white"
                      }`}
                    >
                      <p className='text-xs'>FTP.{index}</p>
                    </div>
                  ))
                : null}
            </div>
          );
        case "control":
          return (
            <div>
              <p className='text-xs pl-2 border-b border-gray-100 bg-gray-200'>
                CONTROL SETTINGS
              </p>
              {dataFile?.control ? (
                Array.isArray(dataFile.control) ? (
                  dataFile.control.map((item, index) => (
                    <div
                      key={index}
                      onClick={() => {
                        setRightTab("Parameter");
                        setParameter({
                          key: "control",
                          idx: index,
                          value: item,
                        });
                      }}
                      className={`p-2 pl-6 cursor-pointer border-b border-gray-100 hover:bg-blue-100 ${
                        parameter.key === "control" && parameter.idx === index
                          ? "bg-blue-200"
                          : "white"
                      }`}
                    >
                      <p className='text-xs'>Control.{index}</p>
                    </div>
                  ))
                ) : (
                  <div
                    onClick={() => {
                      setRightTab("Parameter");
                      setParameter({
                        key: "control",
                        idx: 0,
                        value: dataFile.control,
                      });
                    }}
                    className={`p-2 pl-6 cursor-pointer border-b border-gray-100 hover:bg-blue-100 ${
                      parameter.key === "control" ? "bg-blue-200" : "white"
                    }`}
                  >
                    <p className='text-xs'>CONTROL 0</p>
                  </div>
                )
              ) : null}
            </div>
          );
        case "di":
          return (
            <div>
              <p className='text-xs pl-2 border-b border-gray-100 bg-gray-200'>
                DI SETTINGS
              </p>
              {dataFile?.dis
                ? dataFile.dis.map((item, index) => (
                    <div
                      key={index}
                      onClick={() => {
                        setRightTab("Parameter");
                        setParameter({
                          key: "dis",
                          idx: index,
                          value: item,
                        });
                      }}
                      className={`p-2 pl-6 cursor-pointer border-b border-gray-100 hover:bg-blue-100 ${
                        parameter.key === "dis" && parameter.idx === index
                          ? "bg-blue-200"
                          : "white"
                      }`}
                    >
                      <p className='text-xs'>DI.{index}</p>
                    </div>
                  ))
                : null}
            </div>
          );
        case "do":
          return (
            <div>
              <p className='text-xs pl-2 border-b border-gray-100 bg-gray-200'>
                DO SETTINGS
              </p>
              {dataFile?.dos
                ? dataFile.dos.map((item, index) => (
                    <div
                      key={index}
                      onClick={() => {
                        setRightTab("Parameter");
                        setParameter({
                          key: "dos",
                          idx: index,
                          value: item,
                        });
                      }}
                      className={`p-2 pl-6 cursor-pointer border-b border-gray-100 hover:bg-blue-100 ${
                        parameter.key === "dos" && parameter.idx === index
                          ? "bg-blue-200"
                          : "white"
                      }`}
                    >
                      <p className='text-xs'>DO.{index}</p>
                    </div>
                  ))
                : null}
            </div>
          );
        case "tag":
          return (
            <div>
              <div className='flex flex-row w-full justify-around items-center py-1 px-3 gap-2'>
                <div
                  onClick={() => {
                    setDataFile((prev) => {
                      const tags = prev.tags || [];
                      let newTag;
                      if (
                        parameter.key === "tags" &&
                        typeof parameter.idx === "number" &&
                        parameter.idx >= 0 &&
                        parameter.idx < tags.length
                      ) {
                        newTag = { ...tags[parameter.idx] };
                      } else if (tags.length > 0) {
                        newTag = { ...tags[tags.length - 1] };
                      } else {
                        newTag = { name: "", value: 0, unit: "", status: "" };
                      }
                      return {
                        ...prev,
                        tags: [...tags, newTag],
                      };
                    });
                    setParameter({
                      key: "tags",
                      idx: (dataFile.tags || []).length,
                      value: (parameter.key === "tags" &&
                        typeof parameter.idx === "number" &&
                        (dataFile.tags || [])[parameter.idx]) ||
                        (dataFile.tags || [])[
                          (dataFile.tags || []).length - 1
                        ] || { name: "", value: 0, unit: "", status: "" },
                    });
                  }}
                  className='hover:bg-blue-100 cursor-pointer select-none w-full text-center text-xs rounded-sm bg-gray-200 py-1 px-5'
                >
                  ADD
                </div>
                <div
                  onClick={() => {
                    setDataFile((prev) => {
                      const newTags =
                        prev.tags && prev.tags.length > 0
                          ? prev.tags.slice(0, -1)
                          : [];
                      if (newTags.length > 0) {
                        setParameter({
                          key: "tags",
                          idx: (dataFile.tags || []).length - 2,
                          value: (dataFile.tags || [])[
                            Math.max(0, (dataFile.tags || []).length - 2)
                          ] || { name: "", value: 0, unit: "", status: "" },
                        });
                      } else {
                        setParameter({
                          key: "",
                          idx: "",
                          value: null,
                        });
                      }

                      return {
                        ...prev,
                        tags: newTags,
                      };
                    });
                  }}
                  className='hover:bg-blue-100 cursor-pointer select-none w-full text-center text-xs rounded-sm bg-gray-200 py-1 px-5'
                >
                  REM
                </div>
              </div>
              <p className='text-xs pl-2 border-b border-gray-100 bg-gray-200'>
                TAG SETTINGS
              </p>
              {dataFile?.tags
                ? dataFile.tags.map((item, index) => (
                    <div
                      key={`${item.name}-${index}`}
                      onClick={() => {
                        setRightTab("Parameter");
                        setParameter({
                          key: "tags",
                          idx: index,
                          value: item,
                        });
                      }}
                      className={`p-2 pl-6 cursor-pointer border-b border-gray-100 hover:bg-blue-100 ${
                        parameter.key === "tags" && parameter.idx === index
                          ? "bg-blue-200"
                          : "white"
                      }`}
                    >
                      <p className='text-xs'>TAG.{index}</p>
                    </div>
                  ))
                : null}
            </div>
          );
        case "program":
          return (
            <div>
              <div className='flex flex-row w-full justify-around items-center py-1 px-3 gap-2'>
                <div
                  onClick={() => {
                    setDataFile((prev) => ({
                      ...prev,
                      prog: [
                        ...(prev.prog || []),
                        prev.prog && prev.prog.length > 0
                          ? { ...prev.prog[prev.prog.length - 1] }
                          : {},
                      ],
                    }));
                    setParameter({
                      key: "prog",
                      idx: (dataFile.prog || []).length,
                      value: {},
                    });
                  }}
                  className='hover:bg-blue-100 cursor-pointer select-none w-full text-center text-xs rounded-sm bg-gray-200 py-1 px-5'
                >
                  ADD
                </div>
                <div
                  onClick={() => {
                    setDataFile((prev) => {
                      const newProg =
                        prev.prog && prev.prog.length > 0
                          ? prev.prog.slice(0, -1)
                          : [];
                      if (newProg.length > 0) {
                        setParameter({
                          key: "prog",
                          idx: (dataFile.prog || []).length - 2,
                          value: (dataFile.prog || [])[
                            Math.max(0, (dataFile.prog || []).length - 2)
                          ] || { name: "", value: 0, unit: "", status: "" },
                        });
                      } else {
                        setParameter({
                          key: "",
                          idx: "",
                          value: null,
                        });
                      }

                      return {
                        ...prev,
                        prog: newProg,
                      };
                    });
                  }}
                  className='hover:bg-blue-100 cursor-pointer select-none w-full text-center text-xs rounded-sm bg-gray-200 py-1 px-5'
                >
                  REM
                </div>
              </div>
              <p className='text-xs pl-2 border-b border-gray-100 bg-gray-200'>
                PROGRAM SETTINGS
              </p>
              {dataFile?.prog
                ? dataFile.prog.map((item, index) => (
                    <div
                      key={index}
                      onClick={() => {
                        setRightTab("Parameter");
                        setParameter({
                          key: "prog",
                          idx: index,
                          value: item,
                        });
                      }}
                      className={`p-2 pl-6 cursor-pointer border-b border-gray-100 hover:bg-blue-100 ${
                        parameter.key === "prog" && parameter.idx === index
                          ? "bg-blue-200"
                          : "white"
                      }`}
                    >
                      <p className='text-xs'>PROG.{index}</p>
                    </div>
                  ))
                : null}
            </div>
          );
        case "timer":
          return (
            <div>
              <div className='flex flex-row w-full justify-around items-center py-1 px-3 gap-2'>
                <div
                  onClick={() => {
                    setDataFile((prev) => ({
                      ...prev,
                      timers: [
                        ...(prev.timers || []),
                        prev.timers && prev.timers.length > 0
                          ? { ...prev.timers[prev.timers.length - 1] }
                          : {},
                      ],
                    }));
                    setParameter({
                      key: "timers",
                      idx: (dataFile.timers || []).length,
                      value: {},
                    });
                  }}
                  className='hover:bg-blue-100 cursor-pointer select-none w-full text-center text-xs rounded-sm bg-gray-200 py-1 px-5'
                >
                  ADD
                </div>
                <div
                  onClick={() => {
                    setDataFile((prev) => {
                      const newTimers =
                        prev.timers && prev.timers.length > 0
                          ? prev.timers.slice(0, -1)
                          : [];
                      if (newTimers.length > 0) {
                        setParameter({
                          key: "timers",
                          idx: (dataFile.timers || []).length - 2,
                          value: (dataFile.timers || [])[
                            Math.max(0, (dataFile.timers || []).length - 2)
                          ] || { name: "", value: 0, unit: "", status: "" },
                        });
                      } else {
                        setParameter({
                          key: "",
                          idx: "",
                          value: null,
                        });
                      }

                      return {
                        ...prev,
                        timers: newTimers,
                      };
                    });
                  }}
                  className='hover:bg-blue-100 cursor-pointer select-none w-full text-center text-xs rounded-sm bg-gray-200 py-1 px-5'
                >
                  REM
                </div>
              </div>
              <p className='text-xs pl-2 border-b border-gray-100 bg-gray-200'>
                TIMER SETTINGS
              </p>
              {dataFile?.timers
                ? dataFile.timers.map((item, index) => (
                    <div
                      key={index}
                      onClick={() => {
                        setRightTab("Parameter");
                        setParameter({
                          key: "timers",
                          idx: index,
                          value: item,
                        });
                      }}
                      className={`p-2 pl-6 cursor-pointer border-b border-gray-100 hover:bg-blue-100 ${
                        parameter.key === "timers" && parameter.idx === index
                          ? "bg-blue-200"
                          : "white"
                      }`}
                    >
                      <p className='text-xs'>TIMER.{index}</p>
                    </div>
                  ))
                : null}
            </div>
          );
        case "modbus":
          return (
            <div>
              <div className='flex flex-row w-full justify-around items-center py-1 px-3 gap-2'>
                <div
                  onClick={() => {
                    setDataFile((prev) => ({
                      ...prev,
                      modbus_reader: [
                        ...(prev.modbus_reader || []),
                        prev.modbus_reader && prev.modbus_reader.length > 0
                          ? {
                              ...prev.modbus_reader[
                                prev.modbus_reader.length - 1
                              ],
                            }
                          : {},
                      ],
                    }));
                    setParameter({
                      key: "modbus_reader",
                      idx: (dataFile.modbus_reader || []).length,
                      value: {},
                    });
                  }}
                  className='hover:bg-blue-100 cursor-pointer select-none w-full text-center text-xs rounded-sm bg-gray-200 py-1 px-5'
                >
                  ADD
                </div>
                <div
                  onClick={() => {
                    setDataFile((prev) => {
                      const newModbus=
                        prev.modbus_reader && prev.modbus_reader.length > 0
                          ? prev.modbus_reader.slice(0, -1)
                          : [];
                      if (newModbus.length > 0) {
                        setParameter({
                          key: "modbus_reader",
                          idx: (dataFile.modbus_reader || []).length - 2,
                          value: (dataFile.modbus_reader || [])[
                            Math.max(0, (dataFile.modbus_reader || []).length - 2)
                          ] || { name: "", value: 0, unit: "", status: "" },
                        });
                      } else {
                        setParameter({
                          key: "",
                          idx: "",
                          value: null,
                        });
                      }

                      return {
                        ...prev,
                        modbus_reader: newModbus,
                      };
                    });
                  }}
                  className='hover:bg-blue-100 cursor-pointer select-none w-full text-center text-xs rounded-sm bg-gray-200 py-1 px-5'
                >
                  REM
                </div>
              </div>
              <p className='text-xs pl-2 border-b border-gray-100 bg-gray-200'>
                MODBUS SETTINGS
              </p>
              {dataFile?.modbus_reader
                ? dataFile.modbus_reader.map((item, index) => (
                    <div
                      key={index}
                      onClick={() => {
                        setRightTab("Parameter");
                        setParameter({
                          key: "modbus_reader",
                          idx: index,
                          value: item,
                        });
                      }}
                      className={`p-2 pl-6 cursor-pointer border-b border-gray-100 hover:bg-blue-100 ${
                        parameter.key === "modbus_reader" &&
                        parameter.idx === index
                          ? "bg-blue-200"
                          : "white"
                      }`}
                    >
                      <p className='text-xs'>MODBUS.{index}</p>
                    </div>
                  ))
                : null}
            </div>
          );
        default:
          return null;
      }
    },
    [
      dataFile,
      parameter.key,
      parameter.idx,
      systemCenterData,
      setParameter,
      parameter,
    ],
  );
  return <>{readData(keyType)}</>;
};

export default ReadData;
