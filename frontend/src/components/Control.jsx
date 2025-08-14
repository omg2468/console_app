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
  GetRTC,
  SetRTC,
  SetMeasureMode,
  GetMeasureMode,
} from "../../wailsjs/go/control/ControlService";

import {
  ReadAnalog as ReadAnalogWS,
  QueryNetwork,
  Calibrate4mA,
  Calibrate16mA,
  SetDigitalOutputEthernet,
  ReadSystemInfo as ReadSystemInfoWS,
  WriteSerialNumber as WriteSerialNumberWS,
  WriteMacAddress as WriteMacAddressWS,
  ResetConfiguration as ResetConfigurationWS,
  RebootDevice as RebootWS,
  ReadSimInfo as ReadSimInfoWS,
  ReadSdCardInfo as ReadSdcardInfoWS,
  PingDevice as PingWS,
  SettingNetworkEthernet,
  GetRTC as GetRTCWS,
  SetRTC as SetRTCWS,
  SetMeasureMode as SetMeasureModeEthernet,
  GetMeasureMode as GetMeasureModeWS,
} from "../../wailsjs/go/workspace/WorkspaceService";
import { ShowQuestionDialog } from "../../wailsjs/go/main/App";

const Control = () => {
  const [digitalOutput, setDigitalOutput] = useState(Array(8).fill(false));
  const [loadingPos, setLoadingPos] = useState(0);
  const [dataCommand, setDataCommand] = useState("");
  const [selectedCommand, setSelectedCommand] = useState("read_system_info");
  const [inputType, setInputType] = useState("text");

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
    if (context.selectedConnection === "serial") {
      SettingNetwork(context.formData);
    } else if (context.selectedConnection === "ethernet") {
      SettingNetworkEthernet(
        context.socketAddress,
        context.socketPort,
        context.formData
      );
    }
  };

  const handleGetNetwork = () => {
    if (context.selectedConnection === "serial") {
      GetNetworkInfo();
    } else if (context.selectedConnection === "ethernet") {
      QueryNetwork(context.socketAddress, context.socketPort);
    }
  };

  const handleCalib4 = async () => {
    const result = await ShowQuestionDialog(
      "Calibration at 4mA",
      "Calibration"
    );

    if (result === "Yes") {
      if (context.selectedConnection === "serial") {
        Calib4ma();
      } else if (context.selectedConnection === "ethernet") {
        Calibrate4mA(context.socketAddress, context.socketPort);
      }
    }
  };

  const handleCalib16 = async () => {
    const result = await ShowQuestionDialog(
      "Calibration at 16mA",
      "Calibration"
    );

    if (result === "Yes") {
      if (context.selectedConnection === "serial") Calib16ma();
      else if (context.selectedConnection === "ethernet")
        Calibrate16mA(context.socketAddress, context.socketPort);
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
    <div className="w-full overflow-x-scroll flex flex-row px-2 py-1 box-border">
      <div className="min-w-[350px] flex flex-col gap-2">
        <span className="text-xs font-semibold">NETWORK SETTING</span>
        <div className="border flex-1">
          <table className="w-full h-full max-h-[400px] border-collapse">
            <tbody>
              <tr>
                <td className="border-r border-b p-2 text-right">
                  <span className="font-extrabold text-base">DHCP</span>
                </td>
                <td className="p-2 border-b text-left ">
                  <div className="w-full h-full flex items-center justify-start">
                    <input
                      type="checkbox"
                      name="dhcp"
                      className="w-4 h-4"
                      checked={context.formData.dhcp}
                      onChange={handleChange}
                    />
                  </div>
                </td>
              </tr>

              <tr>
                <td className="border-r border-b p-2 text-right">IP</td>
                <td className="p-2 border-b text-left">
                  <input
                    className="w-full"
                    type="text"
                    name="ip"
                    placeholder="Enter IP address"
                    value={context.formData.ip}
                    onChange={handleChange}
                  />
                </td>
              </tr>

              <tr>
                <td className="border-r border-b p-2 text-right">Netmask</td>
                <td className="p-2 border-b text-left">
                  <input
                    className="w-full"
                    type="text"
                    name="netmask"
                    placeholder="Enter subnet mask"
                    value={context.formData.netmask}
                    onChange={handleChange}
                  />
                </td>
              </tr>

              <tr>
                <td className="border-r border-b p-2 text-right">Gateway</td>
                <td className="p-2 border-b text-left">
                  <input
                    className="w-full"
                    type="text"
                    name="gateway"
                    placeholder="Enter gateway IP"
                    value={context.formData.gateway}
                    onChange={handleChange}
                  />
                </td>
              </tr>

              <tr>
                <td className="border-r border-b p-2 text-right">DNS</td>
                <td className="p-2 border-b text-left">
                  <input
                    className="w-full"
                    type="text"
                    name="dns"
                    placeholder="Enter DNS server"
                    value={context.formData.dns}
                    onChange={handleChange}
                  />
                </td>
              </tr>

              <tr>
                <td className="border-r border-b p-2 text-right">Proxy</td>
                <td className="p-2 border-b text-left">
                  <input
                    className="w-full"
                    type="text"
                    name="proxy"
                    placeholder="Enter proxy address"
                    value={context.formData.proxy}
                    onChange={handleChange}
                  />
                </td>
              </tr>

              <tr>
                <td className="border-r border-b p-2 text-right">Secondary</td>
                <td className="p-2 border-b text-left">
                  <input
                    className="w-full"
                    type="text"
                    name="secondary_ip"
                    placeholder="Enter secondary IP"
                    value={context.formData.secondary_ip}
                    onChange={handleChange}
                  />
                </td>
              </tr>

              <tr>
                <td className="border-r border-b p-2 text-right">Global</td>
                <td className="p-2 border-b text-left">
                  <input
                    className="w-full"
                    type="text"
                    name="global"
                    placeholder="Enter global IP"
                    value={context.formData.global}
                    onChange={handleChange}
                  />
                </td>
              </tr>

              <tr>
                <td className="border-r border-b p-2 text-right">Modem</td>
                <td className="p-2 border-b text-left">
                  <div className="w-full h-full flex items-center justify-start">
                    <input
                      type="checkbox"
                      name="modem"
                      className="w-4 h-4"
                      checked={context.formData.modem}
                      onChange={handleChange}
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex flex-row w-full items-center justify-center gap-2">
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
          <span className="font-black text-xs pt-2">ANALOG INPUT</span>
          <div className="gap-2 flex items-center justify-start ">
            <input
              disabled={!context.isConnected}
              type="checkbox"
              className="w-4 h-4"
              checked={context.displayAnalogUnit}
              onChange={(e) => {
                if (e.target.checked) {
                  if (context.selectedConnection === "serial") {
                    ReadAnalog();
                  } else if (context.selectedConnection === "ethernet") {
                    ReadAnalogWS(
                      context.socketAddress,
                      context.socketPort,
                      "enable"
                    );
                  }
                } else {
                  if (context.selectedConnection === "serial") {
                    StopReadAnalog();
                  } else if (context.selectedConnection === "ethernet") {
                    ReadAnalogWS(
                      context.socketAddress,
                      context.socketPort,
                      "disable"
                    );
                  }
                }
                context.setDisplayAnalogUnit(e.target.checked);
              }}
            />
            <span className="text-sm">Display analog value</span>
            <div className="w-[100px] h-2 bg-gray-200 rounded overflow-hidden relative">
              <div
                className="absolute h-full bg-blue-500 rounded transition-all"
                style={{
                  width: `${analogData?.length ? barWidth : 0}%`,
                  left: `${loadingPos}%`,
                  transition: "left 0.01s linear",
                  display: context.displayAnalogUnit && analogData?.length ? "block" : "none",
                }}
              />
            </div>
          </div>
          <div className="w-full">
            <div className="analog-table-wrapper min-h-[200px]">
              <table className="w-full">
                <colgroup>
                  <col style={{ minWidth: "150px" }} />
                  <col />
                </colgroup>
                <thead>
                  <tr>
                    <th className="border-r w-[150px] border-b p-2 text-right">
                      Parameter
                    </th>
                    <th className="p-2 border-b text-left win-[150px] min-w-[150px]">
                      Value
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {analogData.length === 0 || !context.displayAnalogUnit
                    ? Array.from({ length: 12 }, (_, index) => (
                        <tr key={index}>
                          <td className="border-r border-b p-2 text-right min-w-[150px] whitespace-nowrap">
                            Analog input {index + 1}
                          </td>
                          <td className="p-2 border-box border-b text-left min-w-[150px]"></td>
                        </tr>
                      ))
                    : analogData.map(({ id, value }) => (
                        <tr key={id}>
                          <td className="border-r border-b p-2 text-right min-w-[150px] whitespace-nowrap">
                            Analog input {id}
                          </td>
                          <td className="p-2 border-box border-b text-left min-w-[150px]">
                            {value.toFixed(2) + context.analogUnit}
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col h-full w-full">
        <div className="w-full flex flex-col gap-2 p-1">
          <div className="flex flex-col gap-2">
            <div className="flex-1 min-w-[200px] flex flex-col gap-2 border rounded-md p-2 bg-gray-50">
              <div className="flex items-center justify-between gap-4">
                <button
                  disabled={!context.isConnected}
                  className={`flex-1 text-xs px-2 py-1 rounded min-w-[90px] transition ${
                    !context.isConnected
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-gray-200 hover:bg-gray-300 cursor-pointer"
                  }`}
                  onClick={() => {
                    if (!context.isConnected) return;
                    if (context.selectedConnection === "serial") {
                      GetMeasureMode();
                    } else if (context.selectedConnection === "ethernet") {
                      GetMeasureModeWS(
                        context.socketAddress,
                        context.socketPort
                      );
                    }
                  }}
                >
                  Get measure mode
                </button>
                <div className="flex-1 flex items-center justify-center">
                  <div
                    className={`
      px-3 py-1 rounded-lg text-xs font-semibold text-center min-w-[100px]
      ${
        !context.changeMode
          ? "bg-gradient-to-r from-gray-50 to-gray-100 text-gray-500 border border-gray-200 shadow-sm"
          : context.changeMode === "current"
          ? "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border border-blue-200 shadow-sm"
          : "bg-gradient-to-r from-green-50 to-green-100 text-green-700 border border-green-200 shadow-sm"
      }
    `}
                  >
                    {!context.changeMode
                      ? "Unknown Mode"
                      : `${
                          context.changeMode.charAt(0).toUpperCase() +
                          context.changeMode.slice(1)
                        } Mode`}
                  </div>
                </div>
              </div>
              <button
                disabled={!context.isConnected || !context.changeMode}
                className={`flex-1 text-xs px-2 py-1 rounded min-w-[90px] transition ${
                  !context.isConnected || !context.changeMode
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-gray-200 hover:bg-gray-300 cursor-pointer"
                }`}
                onClick={() => {
                  if (!context.isConnected || !context.changeMode) return;
                  if (context.selectedConnection === "serial") {
                    SetMeasureMode(
                      context.changeMode === "current" ? "voltage" : "current"
                    );
                  } else if (context.selectedConnection === "ethernet") {
                    SetMeasureModeEthernet(
                      context.socketAddress,
                      context.socketPort,
                      context.changeMode === "current" ? "voltage" : "current"
                    );
                  }
                }}
              >
                {!context.changeMode
                  ? "Get mode first"
                  : `Change to ${
                      context.changeMode === "current" ? "voltage" : "current"
                    } mode`}
              </button>
              <div className="flex flex-col sm:flex-row gap-2 mt-2 flex-wrap">
                <button
                  disabled={!context.isConnected || !context.changeMode}
                  className={`flex-1 text-xs px-2 py-1 rounded min-w-[90px] transition ${
                    !context.isConnected || !context.changeMode
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-gray-200 hover:bg-gray-300 cursor-pointer"
                  }`}
                  onClick={handleCalib4}
                >
                  CALIB{" "}
                  {!context.changeMode
                    ? "?"
                    : context.changeMode === "current"
                    ? "4mA"
                    : "2V"}
                </button>
                <button
                  disabled={!context.isConnected || !context.changeMode}
                  className={`flex-1 text-xs px-2 rounded min-w-[90px] transition ${
                    !context.isConnected || !context.changeMode
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-gray-200 hover:bg-gray-300 cursor-pointer"
                  }`}
                  onClick={handleCalib16}
                >
                  CALIB{" "}
                  {!context.changeMode
                    ? "?"
                    : context.changeMode === "current"
                    ? "16mA"
                    : "8V"}
                </button>
              </div>
            </div>
            {/* Digital output control */}
            <div className="flex-1 min-w-[200px] flex flex-col gap-2 border rounded-md p-2 bg-gray-50">
              <span className="text-xs font-semibold">
                Digital output control
              </span>
              <div className="flex flex-wrap gap-2">
                {digitalOutput.map((_, index) => (
                  <label
                    key={index}
                    className="flex items-center gap-2 text-xs min-w-[38px] justify-end"
                  >
                    <span>{index}</span>
                    <input
                      checked={digitalOutput[index]}
                      onChange={(e) => {
                        const newDigitalOutput = [...digitalOutput];
                        newDigitalOutput[index] = e.target.checked;
                        setDigitalOutput(newDigitalOutput);
                      }}
                      type="checkbox"
                      className="custom"
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
                  if (context.selectedConnection === "serial") {
                    SetDigitalOutput(digitalOutput);
                  } else if (context.selectedConnection === "ethernet") {
                    SetDigitalOutputEthernet(
                      context.socketAddress,
                      context.socketPort,
                      digitalOutput
                    );
                  }
                }}
              >
                SET
              </button>
            </div>
            {/* System control */}
            <div className="flex-1 min-w-[200px] flex flex-col gap-2 border rounded-md p-2 bg-gray-50">
              <span className="text-xs font-semibold">System control</span>
              <div className="flex flex-col sm:flex-row gap-2 items-center flex-wrap">
                <select
                  value={selectedCommand}
                  onChange={(e) => {
                    if (e.target.value === "set_rtc_manual") {
                      setInputType("datetime-local");
                    } else {
                      setInputType("text");
                    }
                    setSelectedCommand(e.target.value);
                  }}
                  className="bg-white border border-gray-300 text-gray-900 text-xs py-[2px] w-full"
                >
                  <option value="read_system_info"></option>
                  <option value="write_serial_number">
                    Write serial number
                  </option>
                  <option value="write_mac">Write mac address</option>
                  <option value="reset_configuration">
                    Reset Configuration
                  </option>
                  <option value="reboot">Reboot</option>
                  <option value="read_sim_info">Read sim info</option>
                  <option value="read_sdcard_info">Read sdcard info</option>
                  <option value="set_rtc_manual">Set RTC manual</option>
                  <option value="set_rtc_internet">Set RTC internet</option>
                  <option value="get_rtc">Get RTC</option>
                  <option value="ping">Ping</option>
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
                          if (context.selectedConnection === "serial") {
                            ReadSystemInfo();
                          } else if (
                            context.selectedConnection === "ethernet"
                          ) {
                            ReadSystemInfoWS(
                              context.socketAddress,
                              context.socketPort
                            );
                          }
                          break;
                        case "write_serial_number":
                          context.setInfoDialog("Writing serial number...");
                          if (context.selectedConnection === "serial") {
                            WriteSerialNumber(dataCommand);
                          } else if (
                            context.selectedConnection === "ethernet"
                          ) {
                            WriteSerialNumberWS(
                              context.socketAddress,
                              context.socketPort,
                              dataCommand
                            );
                          }
                          break;
                        case "write_mac":
                          context.setInfoDialog("Writing MAC address...");
                          if (context.selectedConnection === "serial") {
                            WriteMacAddress(dataCommand);
                          } else if (
                            context.selectedConnection === "ethernet"
                          ) {
                            WriteMacAddressWS(
                              context.socketAddress,
                              context.socketPort,
                              dataCommand
                            );
                          }
                          break;
                        case "reset_configuration":
                          context.setInfoDialog("Resetting configuration...");
                          if (context.selectedConnection === "serial") {
                            ResetConfiguration();
                          } else if (
                            context.selectedConnection === "ethernet"
                          ) {
                            ResetConfigurationWS(
                              context.socketAddress,
                              context.socketPort
                            );
                          }
                          break;
                        case "reboot":
                          context.setInfoDialog("Rebooting system...");
                          if (context.selectedConnection === "serial") {
                            Reboot();
                          } else if (
                            context.selectedConnection === "ethernet"
                          ) {
                            RebootWS(context.socketAddress, context.socketPort);
                          }
                          break;
                        case "read_sim_info":
                          context.setInfoDialog("Reading SIM info...");
                          if (context.selectedConnection === "serial") {
                            ReadSimInfo();
                          } else if (
                            context.selectedConnection === "ethernet"
                          ) {
                            ReadSimInfoWS(
                              context.socketAddress,
                              context.socketPort
                            );
                          }
                          break;

                        case "set_rtc_manual":
                          context.setInfoDialog("Setting RTC manually...");

                          const date = new Date(dataCommand);
                          if (isNaN(date.getTime())) {
                            context.setInfoDialog("Invalid date format.");
                            break;
                          }

                          const tsUTC = Math.floor(date.getTime() / 1000);

                          if (context.selectedConnection === "serial") {
                            SetRTC("manual", tsUTC);
                          } else if (
                            context.selectedConnection === "ethernet"
                          ) {
                            SetRTCWS(
                              context.socketAddress,
                              context.socketPort,
                              "manual",
                              tsUTC
                            );
                          }
                          break;

                        case "set_rtc_internet":
                          context.setInfoDialog("Setting RTC via internet...");
                          if (context.selectedConnection === "serial") {
                            // Assuming setDataCommand is in the format "YYYY-MM-DD HH:MM:SS"
                            SetRTC("internet", 0);
                          } else if (
                            context.selectedConnection === "ethernet"
                          ) {
                            SetDigitalOutputEthernet(
                              context.socketAddress,
                              context.socketPort,
                              "internet",
                              0
                            );
                          }
                          break;

                        case "get_rtc":
                          context.setInfoDialog("Getting RTC...");
                          if (context.selectedConnection === "serial") {
                            GetRTC();
                          } else if (
                            context.selectedConnection === "ethernet"
                          ) {
                            GetRTCWS(context.socketAddress, context.socketPort);
                          }
                          break;
                        case "read_sdcard_info":
                          context.setInfoDialog("Reading SD card info...");
                          if (context.selectedConnection === "serial") {
                            ReadSdcardInfo();
                          } else if (
                            context.selectedConnection === "ethernet"
                          ) {
                            ReadSdcardInfoWS(
                              context.socketAddress,
                              context.socketPort
                            );
                          }
                          break;
                        case "ping":
                          context.setInfoDialog("Pinging...");
                          if (context.selectedConnection === "serial") {
                            Ping(dataCommand);
                          } else if (
                            context.selectedConnection === "ethernet"
                          ) {
                            PingWS(
                              context.socketAddress,
                              context.socketPort,
                              dataCommand
                            );
                          }
                          break;
                        default:
                          break;
                      }
                    } catch (error) {
                      context.setInfoDialog(
                        "An error occurred while executing the command."
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
        <div className="gap-2 flex flex-1 flex-col mx-1">
          <input
            type={inputType}
            value={dataCommand}
            onChange={(e) => setDataCommand(e.target.value)}
            className="w-full min-h-[20px] border p-2 text-xs"
          />
          <textarea
            className="w-full h-full border p-2 text-xs resize-none"
            value={context.infoDialog}
          ></textarea>
        </div>
      </div>
    </div>
  );
};

export default Control;
