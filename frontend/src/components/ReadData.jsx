import { useCallback } from "react";

const systemCenterData = [
  { label: "MODBUS RTU MASTER", key: "rtu_master" },
  { label: "MODBUS RTU SLAVE", key: "rtu_slave" },
  { label: "MODBUS TCP MASTER", key: "tcp_master" },
  { label: "MODBUS TCP SLAVE", key: "tcp_slave" },
  { label: "COMMON", key: "common" },
];

const ReadData = ({ dataFile, parameter, setParameter, keyType }) => {
  const readData = useCallback(
    (key) => {
      switch (key) {
        case "system":
          return (
            <div>
              <p className='text-sm pl-2 border-b border-gray-100 bg-gray-200'>
                SYSTEM SETTINGS
              </p>
              {dataFile && systemCenterData
                ? systemCenterData.map((item, index) => (
                    <div
                      key={index}
                      onClick={() =>
                        setParameter({
                          key: item.key,
                          idx: index,
                          value: dataFile[item.key],
                        })
                      }
                      className={`p-2 pl-6 cursor-pointer border-b border-gray-100 hover:bg-blue-100 ${
                        parameter.key === item.key && parameter.idx === index
                          ? "bg-blue-200"
                          : "white"
                      }`}
                    >
                      <p className='text-sm'>{item.label}</p>
                    </div>
                  ))
                : null}
            </div>
          );
        case "ftp":
          return (
            <div>
              <p className='text-sm pl-2 border-b border-gray-100 bg-gray-200'>
                FTP SETTINGS
              </p>
              {dataFile?.ftp
                ? dataFile.ftp.map((item, index) => (
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
                      <p className='text-sm'>FTP.{index}</p>
                    </div>
                  ))
                : null}
            </div>
          );
        case "control":
          return (
            <div>
              <p className='text-sm pl-2 border-b border-gray-100 bg-gray-200'>
                CONTROL SETTINGS
              </p>
              {dataFile?.control ? (
                Array.isArray(dataFile.control) ? (
                  dataFile.control.map((item, index) => (
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
                      <p className='text-sm'>Control.{index}</p>
                    </div>
                  ))
                ) : (
                  <div
                    onClick={() =>
                      setParameter({
                        key: "control",
                        idx: 0,
                        value: dataFile.control,
                      })
                    }
                    className={`p-2 pl-6 cursor-pointer border-b border-gray-100 hover:bg-blue-100 ${
                      parameter.key === "control" ? "bg-blue-200" : "white"
                    }`}
                  >
                    <p className='text-sm'>CONTROL 0</p>
                  </div>
                )
              ) : null}
            </div>
          );
        case "di":
          return (
            <div>
              <p className='text-sm pl-2 border-b border-gray-100 bg-gray-200'>
                DI SETTINGS
              </p>
              {dataFile?.dis
                ? dataFile.dis.map((item, index) => (
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
              {dataFile?.dos
                ? dataFile.dos.map((item, index) => (
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
            <div>
              <div className='flex flex-row w-full justify-around items-center py-1 px-3 gap-2'>
                <div className='hover:bg-blue-100 cursor-pointer select-none w-full text-center text-xs rounded-sm bg-gray-200 py-1 px-5'>
                  ADD
                </div>
                <div className='hover:bg-blue-100 cursor-pointer select-none w-full text-center text-xs rounded-sm bg-gray-200 py-1 px-5'>
                  REM
                </div>
              </div>
              <p className='text-sm pl-2 border-b border-gray-100 bg-gray-200'>
                TAG SETTINGS
              </p>
              {dataFile?.tags
                ? dataFile.tags.map((item, index) => (
                    <div
                      key={index}
                      onClick={() =>
                        setParameter({
                          key: "tags",
                          idx: index,
                          value: item,
                        })
                      }
                      className={`p-2 pl-6 cursor-pointer border-b border-gray-100 hover:bg-blue-100 ${
                        parameter.key === "tags" && parameter.idx === index
                          ? "bg-blue-200"
                          : "white"
                      }`}
                    >
                      <p className='text-sm'>TAG.{index}</p>
                    </div>
                  ))
                : null}
            </div>
          );
        case "program":
          return (
            <div>
              <div className='flex flex-row w-full justify-around items-center py-1 px-3 gap-2'>
                <div className='hover:bg-blue-100 cursor-pointer select-none w-full text-center text-xs rounded-sm bg-gray-200 py-1 px-5'>
                  ADD
                </div>
                <div className='hover:bg-blue-100 cursor-pointer select-none w-full text-center text-xs rounded-sm bg-gray-200 py-1 px-5'>
                  REM
                </div>
              </div>
              <p className='text-sm pl-2 border-b border-gray-100 bg-gray-200'>
                PROGRAM SETTINGS
              </p>
              {dataFile?.prog
                ? dataFile.prog.map((item, index) => (
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
                      <p className='text-sm'>PROG.{index}</p>
                    </div>
                  ))
                : null}
            </div>
          );
        case "timer":
          return (
            <div>
              <div className='flex flex-row w-full justify-around items-center py-1 px-3 gap-2'>
                <div className='hover:bg-blue-100 cursor-pointer select-none w-full text-center text-xs rounded-sm bg-gray-200 py-1 px-5'>
                  ADD
                </div>
                <div className='hover:bg-blue-100 cursor-pointer select-none w-full text-center text-xs rounded-sm bg-gray-200 py-1 px-5'>
                  REM
                </div>
              </div>
              <p className='text-sm pl-2 border-b border-gray-100 bg-gray-200'>
                TIMER SETTINGS
              </p>
              {dataFile?.timers
                ? dataFile.timers.map((item, index) => (
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
                      <p className='text-sm'>TIMER.{index}</p>
                    </div>
                  ))
                : null}
            </div>
          );
        case "modbus":
          return (
            <div>
              <div className='flex flex-row w-full justify-around items-center py-1 px-3 gap-2'>
                <div className='hover:bg-blue-100 cursor-pointer select-none w-full text-center text-xs rounded-sm bg-gray-200 py-1 px-5'>
                  ADD
                </div>
                <div className='hover:bg-blue-100 cursor-pointer select-none w-full text-center text-xs rounded-sm bg-gray-200 py-1 px-5'>
                  REM
                </div>
              </div>
              <p className='text-sm pl-2 border-b border-gray-100 bg-gray-200'>
                MODBUS SETTINGS
              </p>
              {dataFile?.modbus_reader
                ? dataFile.modbus_reader.map((item, index) => (
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
                      <p className='text-sm'>MODBUS.{index}</p>
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
