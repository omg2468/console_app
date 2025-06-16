import React, { useContext, useState } from "react";
import { ContextMenuContext } from "../store";

const Control = () => {
  const [realCurrent, setRealCurrent] = useState("4.000mA");

  const context = useContext(ContextMenuContext);

  console.log(context.analogData);

  return (
    <div className="w-full overflow-x-scroll flex flex-row px-2 py-1 box-border">
      <div className="min-w-[350px] flex flex-col gap-2 ">
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
                    <input type="checkbox" className="w-4 h-4" checked={true} />
                  </div>
                </td>
              </tr>
              <tr>
                <td className="border-r border-b p-2 text-right">IP</td>
                <td className="p-2 border-b text-left">192.168.1.16</td>
              </tr>
              <tr>
                <td className="border-r border-b p-2 text-right">Netmask</td>
                <td className="p-2 border-b text-left">255.255.255.0</td>
              </tr>
              <tr>
                <td className="border-r border-b p-2 text-right">Gateway</td>
                <td className="p-2 border-b text-left">192.168.1.1</td>
              </tr>
              <tr>
                <td className="border-r border-b p-2 text-right">Dns</td>
                <td className="p-2 border-b text-left">8.8.8.8</td>
              </tr>
              <tr>
                <td className="border-r border-b p-2 text-right">Proxy</td>
                <td className="p-2 border-b text-left">direct</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex flex-row w-full items-center justify-center gap-2">
            <div className="flex-1 text-center text-xs border py-1 bg-gray-200 cursor-pointer hover:bg-gray-300">
              GET NETWORK
            </div>
            <div className="flex-1 text-center text-xs border py-1 bg-gray-200 cursor-pointer hover:bg-gray-300">
              SET NETWORK
            </div>
          </div>
          <span className="font-black text-sm pt-2">ANALOG INPUT</span>
          <div className="gap-2 flex items-center justify-start ">
            <input type="checkbox" className="w-4 h-4" checked={true} />
            <span className="text-sm">Display analog value</span>
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
                  {context.analogData.length === 0
                    ? Array.from({ length: 12 }, (_, index) => (
                        <tr key={index}>
                          <td className="border-r border-b p-2 text-right min-w-[150px] whitespace-nowrap">
                            Analog input {index + 1}
                          </td>
                          <td className="p-2 border-box border-b text-left min-w-[150px]"></td>
                        </tr>
                      ))
                    : context.analogData.map(({ id, value }) => (
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
            <input type="checkbox" />
          </div>
          <div className="flex items-center justify-start">
            <p className="text-xs whitespace-nowrap text-left px-2">
              Real current
            </p>
          </div>
          <input
            className="custom bg-gray-50 w-full border rounded-md border-gray-300 text-gray-900 pl-3"
            type="text"
            value={realCurrent}
            onChange={(e) => setRealCurrent(e.target.value)}
          />
          <div className="flex items-center justify-center w-full">
            <p className="text-sm bg-gray-200 w-full p-1 text-center select-none hover:bg-gray-300 cursor-pointer">
              UPDATE
            </p>
          </div>
          <div className="flex items-center justify-center">
            <p className="text-sm bg-gray-200 w-full p-1 ml-2 text-center select-none hover:bg-gray-300 cursor-pointer">
              CALIB 4mA
            </p>
          </div>
          <div className="flex items-center justify-center">
            <p className="text-sm bg-gray-200 w-full p-1  text-center select-none hover:bg-gray-300 cursor-pointer">
              CALIB 16mA
            </p>
          </div>
          <div></div>
          <div className="flex items-center justify-start col-span-3">
            <p className="text-xs whitespace-nowrap text-left px-2">
              Digital output control
            </p>
          </div>
          <div className="flex flex-row gap-4 ml-2 col-span-2">
            {Array.from({ length: 5 }, (_, index) => (
              <div className="flex flex-row items-center justify-center">
                <p className="text-center mt-[1px]">{index}</p>
                <input
                  checked={false}
                  type="checkbox"
                  className="custom ml-1"
                />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center">
            <p className="text-sm bg-gray-200 w-full p-1  text-center select-none hover:bg-gray-300 cursor-pointer">
              SET
            </p>
          </div>
          <div className="flex items-center justify-start col-span-3">
            <p className="text-xs whitespace-nowrap text-left px-2">
              System control
            </p>
          </div>
          <select className="bg-gray-50 w-full border border-gray-300 text-gray-900 text-sm py-[2px] ml-0 col-span-2">
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
            <p className="text-sm bg-gray-200 w-full p-1  text-center select-none hover:bg-gray-300 cursor-pointer">
              PERFORM
            </p>
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
