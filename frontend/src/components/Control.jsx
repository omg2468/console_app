import React, { useContext, useState, useEffect } from "react";
import { ContextMenuContext } from "../store";

import {
  SettingNetwork,
  GetNetworkInfo,
  Calib4ma,
  Calib20ma,
} from "../../wailsjs/go/control/ControlService";

import { ShowQuestionDialog } from "../../wailsjs/go/main/App";

const Control = () => {
  const [realCurrent, setRealCurrent] = useState("4.000mA");
  const [display, setDisplay] = useState(false);
  const [formData, setFormData] = useState({
    dhcp: false,
    ip: "",
    netmask: "",
    gateway: "",
    dns: "",
    proxy: "",
    "secondary ip": "",
    global: "",
    modem: false,
  });
  const [generateCurrent, setGenerateCurrent] = useState(false);
  const [digitalOutput, setDigitalOutput] = useState([
    false,
    false,
    false,
    false,
    false,
  ]);
  const [loadingPos, setLoadingPos] = useState(0);
  const barWidth = 40;

  const context = useContext(ContextMenuContext);

  const analogData = context.analogData || [];

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSetNetwork = () => {
    SettingNetwork(formData);
  };

  const handleGetNetwork = () => {
    GetNetworkInfo();
  };

  const handleCalib4 = () => {
    ShowQuestionDialog("Calibration at 4mA", "Calibration");

    Calib4ma();
  };

  const handleCalib16 = () => {
    ShowQuestionDialog("Calibration at 20mA", "Calibration");
    Calib20ma();
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
                      checked={formData.dhcp}
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
                    value={formData.ip}
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
                    value={formData.netmask}
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
                    value={formData.gateway}
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
                    value={formData.dns}
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
                    value={formData.proxy}
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
                    name="secondary ip"
                    placeholder="Enter secondary IP"
                    value={formData["secondary ip"]}
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
                    value={formData.global}
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
                      checked={formData.modem}
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
            <div
              className="flex-1 text-center text-xs border py-1 bg-gray-200 cursor-pointer hover:bg-gray-300"
              onClick={handleGetNetwork}
            >
              GET NETWORK
            </div>
            <div
              className="flex-1 text-center text-xs border py-1 bg-gray-200 cursor-pointer hover:bg-gray-300"
              onClick={handleSetNetwork}
            >
              SET NETWORK
            </div>
          </div>
          <span className="font-black text-xs pt-2">ANALOG INPUT</span>
          <div className="gap-2 flex items-center justify-start ">
            <input
              type="checkbox"
              className="w-4 h-4"
              checked={display}
              onChange={(e) => setDisplay(e.target.checked)}
            />
            <span className="text-sm">Display analog value</span>
            <div className="w-[100px] h-2 bg-gray-200 rounded overflow-hidden relative">
              <div
                className="absolute h-full bg-blue-500 rounded transition-all"
                style={{
                  width: `${analogData?.length ? barWidth : 0}%`,
                  left: `${loadingPos}%`,
                  transition: "left 0.01s linear",
                  display: display && analogData?.length ? "block" : "none",
                }}
              />
            </div>
          </div>
          <div className="w-full">
            <div style={{ maxHeight: 310, overflowY: "auto" }}>
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
                  {analogData.length === 0 || !display
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
      <div className="flex flex-col h-full w-full">
        <div className="grid grid-cols-3 grid-rows-3 gap-2 p-1 ">
          <div className="flex items-center justify-start">
            <p className="text-xs whitespace-nowrap text-left px-2">
              Generate current
            </p>
          </div>
          <select className="bg-gray-50 w-full border border-gray-300 text-gray-900 text-sm py-[2px] ml-0">
            <option value="4">4mA</option>
            <option value="8">8mA</option>
            <option value="12">12mA</option>
            <option value="16">16mA</option>
            <option value="20">20mA</option>
          </select>
          <div className="flex items-center justify-start">
            <input
              type="checkbox"
              checked={generateCurrent}
              onChange={(e) => setGenerateCurrent(e.target.checked)}
            />
          </div>
          {/* Real current */}
          <div className="flex flex-col md:flex-row md:items-center w-full">
            <div className="flex-1 flex items-center justify-start max-w-[95px]">
              <p className="text-xs text-left">
                Real current
              </p>
            </div>
            <input
              className="custom text-xs bg-gray-50 border rounded-md border-gray-300 text-gray-900 pl-3 h-[24px] w-auto"
              type="text"
              value={realCurrent}
              onChange={(e) => setRealCurrent(e.target.value)}
            />
            <div className="flex items-center flex-1 justify-center w-full md:ml-2">
              <p className="text-xs bg-gray-200 w-full p-1 text-center select-none hover:bg-gray-300 cursor-pointer">
                UPDATE
              </p>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <p
              className="text-sm bg-gray-200 w-full p-1 ml-2 text-center select-none hover:bg-gray-300 cursor-pointer"
              onClick={handleCalib4}
            >
              CALIB 4mA
            </p>
          </div>
          <div className="flex items-center justify-center">
            <p
              className="text-sm bg-gray-200 w-full p-1  text-center select-none hover:bg-gray-300 cursor-pointer"
              onClick={handleCalib16}
            >
              CALIB 16mA
            </p>
          </div>
          {/* Digital output control */}
          <div className="flex flex-col w-full">
            <div className="flex items-center justify-start">
              <p className="text-xs whitespace-nowrap text-left px-2">
                Digital output control
              </p>
            </div>
            <div className="flex flex-row gap-4 ml-2 flex-wrap">
              {digitalOutput.map((_, index) => (
                <div className="flex flex-row items-center justify-center" key={index}>
                  <p className="text-center mt-[1px]">{index}</p>
                  <input
                    checked={digitalOutput[index]}
                    onChange={(e) => {
                      const newDigitalOutput = [...digitalOutput];
                      newDigitalOutput[index] = e.target.checked;
                      setDigitalOutput(newDigitalOutput);
                    }}
                    type="checkbox"
                    className="custom ml-1"
                  />
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center mt-2">
              <p className="text-xs bg-gray-200 w-full p-1 text-center select-none hover:bg-gray-300 cursor-pointer">
                SET
              </p>
            </div>
          </div>
          {/* System control */}
          <div className="flex flex-col w-full">
            <div className="flex items-center justify-start">
              <p className="text-xs whitespace-nowrap text-left px-2">
                System control
              </p>
            </div>
            <div className="flex flex-row gap-2 items-center">
              <select className="bg-gray-50 w-full border border-gray-300 text-gray-900 text-xs py-[2px] ml-0">
                <option value="0">Read system info</option>
                <option value="1">Write serial number</option>
                <option value="2">Write mac address</option>
                <option value="3">Retry configuration</option>
                <option value="4">Reboot</option>
                <option value="5">Reload</option>
                <option value="6">get time</option>
                <option value="7">set time</option>
                <option value="8">enable ntp</option>
                <option value="9">Read sim info</option>
                <option value="10">Read sdcard info</option>
                <option value="11">Ping</option>
                <option value="12">Get log</option>
                <option value="13">Command</option>
              </select>
              <div className="flex items-center justify-center">
                <p className="text-xs bg-gray-200 w-full p-1 text-center select-none hover:bg-gray-300 cursor-pointer">
                  PERFORM
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="gap-2 flex flex-1 flex-col mx-1">
          <div className="w-full min-h-[20px] border "></div>
          <div className="flex-1 w-full border"></div>
        </div>
      </div>
    </div>
  );
};

export default Control;
