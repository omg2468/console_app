import React, { useContext, useState, useEffect } from "react";
import { ContextMenuContext } from "../store";

import {
  SettingNetwork,
  GetNetworkInfo,
  Calib4ma,
  Calib16ma,
  ReadAnalog,
  StopReadAnalog,
  SetDigitalOutput,
  ReadSystemInfo,
  WriteSerialNumber,
  WriteMacAddress,
  ResetConfiguration,
  Reboot,
  ReadSimInfo,
  ReadSdcardInfo,
  Ping,
} from "../../wailsjs/go/control/ControlService";
import { ShowQuestionDialog } from "../../wailsjs/go/main/App";

const Control = () => {
  const [display, setDisplay] = useState(false);
  const [digitalOutput, setDigitalOutput] = useState(Array(8).fill(false));
  const [loadingPos, setLoadingPos] = useState(0);
  const [dataCommand, setDataCommand] = useState("");
  const [selectedCommand, setSelectedCommand] = useState("read_system_info");

  const barWidth = 40;

  const context = useContext(ContextMenuContext);

  const analogData = context.analogData || [];

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    context.setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSetNetwork = () => {
    SettingNetwork(context.formData);
  };

  const handleGetNetwork = () => {
    GetNetworkInfo();
  };

  const handleCalib4 = async () => {
    const result = await ShowQuestionDialog(
      "Calibration at 4mA",
      "Calibration",
    );

    if (result === "Yes") {
      Calib4ma(); // Chỉ chạy khi người dùng chọn Yes
    }
  };

  const handleCalib16 = async () => {
    const result = await ShowQuestionDialog(
      "Calibration at 16mA",
      "Calibration"
    );

    if (result === "Yes") {
      Calib16ma(); // Chỉ chạy khi người dùng chọn Yes
    }
  };

  useEffect(() => {
    if (!analogData?.length) return;
    const interval = setInterval(() => {
      setLoadingPos((prev) => (prev >= 100 ? -loadingPos : prev + 1));
    }, 15);
    return () => clearInterval(interval);
  }, [analogData]);

  return (
    <div className='w-full overflow-x-scroll flex flex-row px-2 py-1 box-border'>
      <div className='min-w-[350px] flex flex-col gap-2'>
        <span className='text-xs font-semibold'>NETWORK SETTING</span>
        <div className='border flex-1'>
          <table className='w-full h-full max-h-[400px] border-collapse'>
            <tbody>
              <tr>
                <td className='border-r border-b p-2 text-right'>
                  <span className='font-extrabold text-base'>DHCP</span>
                </td>
                <td className='p-2 border-b text-left '>
                  <div className='w-full h-full flex items-center justify-start'>
                    <input
                      type='checkbox'
                      name='dhcp'
                      className='w-4 h-4'
                      checked={context.formData.dhcp}
                      onChange={handleChange}
                    />
                  </div>
                </td>
              </tr>

              <tr>
                <td className='border-r border-b p-2 text-right'>IP</td>
                <td className='p-2 border-b text-left'>
                  <input
                    className='w-full'
                    type='text'
                    name='ip'
                    placeholder='Enter IP address'
                    value={context.formData.ip}
                    onChange={handleChange}
                  />
                </td>
              </tr>

              <tr>
                <td className='border-r border-b p-2 text-right'>Netmask</td>
                <td className='p-2 border-b text-left'>
                  <input
                    className='w-full'
                    type='text'
                    name='netmask'
                    placeholder='Enter subnet mask'
                    value={context.formData.netmask}
                    onChange={handleChange}
                  />
                </td>
              </tr>

              <tr>
                <td className='border-r border-b p-2 text-right'>Gateway</td>
                <td className='p-2 border-b text-left'>
                  <input
                    className='w-full'
                    type='text'
                    name='gateway'
                    placeholder='Enter gateway IP'
                    value={context.formData.gateway}
                    onChange={handleChange}
                  />
                </td>
              </tr>

              <tr>
                <td className='border-r border-b p-2 text-right'>DNS</td>
                <td className='p-2 border-b text-left'>
                  <input
                    className='w-full'
                    type='text'
                    name='dns'
                    placeholder='Enter DNS server'
                    value={context.formData.dns}
                    onChange={handleChange}
                  />
                </td>
              </tr>

              <tr>
                <td className='border-r border-b p-2 text-right'>Proxy</td>
                <td className='p-2 border-b text-left'>
                  <input
                    className='w-full'
                    type='text'
                    name='proxy'
                    placeholder='Enter proxy address'
                    value={context.formData.proxy}
                    onChange={handleChange}
                  />
                </td>
              </tr>

              <tr>
                <td className='border-r border-b p-2 text-right'>Secondary</td>
                <td className='p-2 border-b text-left'>
                  <input
                    className='w-full'
                    type='text'
                    name='secondary_ip'
                    placeholder='Enter secondary IP'
                    value={context.formData.secondary_ip}
                    onChange={handleChange}
                  />
                </td>
              </tr>

              <tr>
                <td className='border-r border-b p-2 text-right'>Global</td>
                <td className='p-2 border-b text-left'>
                  <input
                    className='w-full'
                    type='text'
                    name='global'
                    placeholder='Enter global IP'
                    value={context.formData.global}
                    onChange={handleChange}
                  />
                </td>
              </tr>

              <tr>
                <td className='border-r border-b p-2 text-right'>Modem</td>
                <td className='p-2 border-b text-left'>
                  <div className='w-full h-full flex items-center justify-start'>
                    <input
                      type='checkbox'
                      name='modem'
                      className='w-4 h-4'
                      checked={context.formData.modem}
                      onChange={handleChange}
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className='flex flex-col gap-1'>
          <div className='flex flex-row w-full items-center justify-center gap-2'>
            <button
              disabled={!context.isConnected}
              onClick={handleGetNetwork}
              className={`flex-1 text-center text-xs border py-1 ${
                context.isConnected
                  ? "bg-gray-200 text-black hover:bg-gray-300 cursor-pointer"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              GET NETWORK
            </button>
            <div
              disabled={!context.isConnected}
              className={`flex-1 text-center text-xs border py-1 ${
                context.isConnected
                  ? "bg-gray-200 text-black hover:bg-gray-300 cursor-pointer"
                  : "bg-gray-100 text-gray-400"
              }`}
              onClick={handleSetNetwork}
            >
              SET NETWORK
            </div>
          </div>
          <span className='font-black text-xs pt-2'>ANALOG INPUT</span>
          <div className='gap-2 flex items-center justify-start '>
            <input
              disabled={!context.isConnected}
              type='checkbox'
              className='w-4 h-4'
              checked={display}
              onChange={(e) => {
                if (e.target.checked) {
                  ReadAnalog();
                } else {
                  StopReadAnalog();
                }
                setDisplay(e.target.checked);
              }}
            />
            <span className='text-sm'>Display analog value</span>
            <div className='w-[100px] h-2 bg-gray-200 rounded overflow-hidden relative'>
              <div
                className='absolute h-full bg-blue-500 rounded transition-all'
                style={{
                  width: `${analogData?.length ? barWidth : 0}%`,
                  left: `${loadingPos}%`,
                  transition: "left 0.01s linear",
                  display: display && analogData?.length ? "block" : "none",
                }}
              />
            </div>
          </div>
          <div className='w-full'>
            <div className='analog-table-wrapper min-h-[200px]'>
              <table className='w-full'>
                <colgroup>
                  <col style={{ minWidth: "150px" }} />
                  <col />
                </colgroup>
                <thead>
                  <tr>
                    <th className='border-r w-[150px] border-b p-2 text-right'>
                      Parameter
                    </th>
                    <th className='p-2 border-b text-left win-[150px] min-w-[150px]'>
                      Value
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {analogData.length === 0 || !display
                    ? Array.from({ length: 12 }, (_, index) => (
                        <tr key={index}>
                          <td className='border-r border-b p-2 text-right min-w-[150px] whitespace-nowrap'>
                            Analog input {index + 1}
                          </td>
                          <td className='p-2 border-box border-b text-left min-w-[150px]'></td>
                        </tr>
                      ))
                    : analogData.map(({ id, value }) => (
                        <tr key={id}>
                          <td className='border-r border-b p-2 text-right min-w-[150px] whitespace-nowrap'>
                            Analog input {id}
                          </td>
                          <td className='p-2 border-box border-b text-left min-w-[150px]'>
                            {value.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <div className='flex flex-col h-full w-full'>
        <div className='w-full flex flex-col gap-2 p-1'>
          <div className='flex flex-col gap-2'>
            <div className='flex-1 min-w-[200px] flex flex-col gap-2 border rounded-md p-2 bg-gray-50'>
              <div className='flex flex-col sm:flex-row gap-2 mt-2 flex-wrap'>
                <button
                  disabled={!context.isConnected}
                  className={`flex-1 text-xs px-2 py-1 rounded min-w-[90px] transition ${
                    !context.isConnected
                      ? "bg-gray-100 text-gray-400"
                      : "bg-gray-200 hover:bg-gray-300 cursor-pointer"
                  }`}
                  onClick={handleCalib4}
                >
                  CALIB 4mA
                </button>
                <button
                  disabled={!context.isConnected}
                  className={`flex-1 text-xs px-2 rounded min-w-[90px] transition ${
                    !context.isConnected
                      ? "bg-gray-100 text-gray-400"
                      : "bg-gray-200 hover:bg-gray-300 cursor-pointer"
                  }`}
                  onClick={handleCalib16}
                >
                  CALIB 16mA
                </button>
              </div>
            </div>
            {/* Digital output control */}
            <div className='flex-1 min-w-[200px] flex flex-col gap-2 border rounded-md p-2 bg-gray-50'>
              <span className='text-xs font-semibold'>
                Digital output control
              </span>
              <div className='flex flex-wrap gap-2'>
                {digitalOutput.map((_, index) => (
                  <label
                    key={index}
                    className='flex items-center gap-2 text-xs min-w-[38px] justify-end'
                  >
                    <span >{index}</span>
                    <input
                      checked={digitalOutput[index]}
                      onChange={(e) => {
                        const newDigitalOutput = [...digitalOutput];
                        newDigitalOutput[index] = e.target.checked;
                        setDigitalOutput(newDigitalOutput);
                      }}
                      type='checkbox'
                      className='custom'
                    />
                  </label>
                ))}
              </div>
              <button
                disabled={!context.isConnected}
                className={`text-xs px-2 py-1 rounded min-w-[60px] transition
    ${
      !context.isConnected
        ? "bg-gray-100 text-gray-400"
        : "bg-gray-200 hover:bg-gray-300 cursor-pointer"
    }
  `}
                style={{ minWidth: 60 }}
                onClick={() => {
                  console.log("click");
                  SetDigitalOutput(digitalOutput);
                }}
              >
                SET
              </button>
            </div>
            {/* System control */}
            <div className='flex-1 min-w-[200px] flex flex-col gap-2 border rounded-md p-2 bg-gray-50'>
              <span className='text-xs font-semibold'>System control</span>
              <div className='flex flex-col sm:flex-row gap-2 items-center flex-wrap'>
                <select
                  value={selectedCommand}
                  onChange={(e) => setSelectedCommand(e.target.value)}
                  className='bg-white border border-gray-300 text-gray-900 text-xs py-[2px] w-full'
                >
                  <option value='read_system_info'>Read system info</option>
                  <option value='write_serial_number'>
                    Write serial number
                  </option>
                  <option value='write_mac'>Write mac address</option>
                  <option value='reset_configuration'>
                    Reset Configuration
                  </option>
                  <option value='reboot'>Reboot</option>
                  <option value='read_sim_info'>Read sim info</option>
                  <option value='read_sdcard_info'>Read sdcard info</option>
                  <option value='ping'>Ping</option>
                </select>
                <button
                  disabled={!context.isConnected}
                  className={`text-xs px-2 py-1 rounded min-w-[60px] transition
    ${
      !context.isConnected
        ? "bg-gray-100 text-gray-400"
        : "bg-gray-200 hover:bg-gray-300 cursor-pointer"
    }
  `}
                  onClick={() => {
                    setDataCommand("");
                    try {
                      switch (selectedCommand) {
                        case "read_system_info":
                          context.setInfoDialog("Reading system info...");
                          ReadSystemInfo();
                          break;
                        case "write_serial_number":
                          context.setInfoDialog("Writing serial number...");
                          WriteSerialNumber(dataCommand);
                          break;
                        case "write_mac":
                          context.setInfoDialog("Writing MAC address...");
                          WriteMacAddress(dataCommand);
                          break;
                        case "reset_configuration":
                          context.setInfoDialog("Resetting configuration...");
                          ResetConfiguration();

                          break;
                        case "reboot":
                          context.setInfoDialog("Rebooting system...");
                          Reboot();
                          break;
                        case "read_sim_info":
                          context.setInfoDialog("Reading SIM info...");
                          ReadSimInfo();
                          break;
                        case "read_sdcard_info":
                          context.setInfoDialog("Reading SD card info...");
                          ReadSdcardInfo();
                          break;
                        case "ping":
                          context.setInfoDialog("Pinging...");
                          Ping();
                          break;
                        default:
                          break;
                      }
                    } catch (error) {
                      context.setInfoDialog(
                        "An error occurred while executing the command.",
                      );
                    }
                  }}
                >
                  PERFORM
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className='gap-2 flex flex-1 flex-col mx-1'>
          <input
            type='text'
            value={dataCommand}
            onChange={(e) => setDataCommand(e.target.value)}
            className='w-full min-h-[20px] border p-2 text-xs'
          />
          <textarea
            className='w-full h-full border p-2 text-xs'
            value={context.infoDialog}
          ></textarea>
        </div>
      </div>
    </div>
  );
};

export default Control;
