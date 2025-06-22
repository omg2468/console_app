import { useEffect, useState, useContext, useCallback } from "react";
import * as AuthService from "../../wailsjs/go/auth/AuthService";

import { DowloadConfig } from "../../wailsjs/go/workspace/WorkspaceService";

import { ContextMenuContext } from "../store";

function ConnectComponent({ onConnected }) {
  const [ports, setPorts] = useState([]);
  const [selectedPort, setSelectedPort] = useState("");
  const [status, setStatus] = useState("Not connected");
  const context = useContext(ContextMenuContext);

  const handleConnect = () => {
    if (!selectedPort) {
      setStatus("Please select a COM port");
      return;
    }

    handleSelectPort();

    AuthService.ConnectToPort(selectedPort)
      .then(() => {
        setStatus("Connected to " + selectedPort);
        if (onConnected) onConnected();
      })
      .catch((err) => setStatus("Connection error: " + err));
  };

  const handleDisconnect = () => {
    AuthService.Disconnect()
      .then(() => {
        setStatus("Disconnected");
        setSelectedPort("");
      })
      .catch((err) => setStatus("Disconnect error: " + err));
  };

  const handleData = () => {
    DowloadConfig()
      .then(() => {
        setStatus("Sent download config command");
      })
      .catch((err) => {
        setStatus("Download config command error: " + err);
      });
  };

  useEffect(() => {
    AuthService.ListPorts()
      .then(setPorts)
      .catch((err) => setStatus("Get COM error: " + err));
  }, []);

  const handleSelectPort = useCallback(() => {
    if (!selectedPort) {
      return;
    }

    let isListening = true;

    const listenForData = async () => {
      while (isListening) {
        try {
          const response = await AuthService.GetResponse(10000);

          if (response) {
            try {
              const jsonData = JSON.parse(response);
              switch (jsonData.type) {
                case "read_analog":
                  context.setAnalogData(jsonData.data);
                  break;
                case "read_tag_view":
                  context.setTagViewData(jsonData.data);
                  break;
                case "read_memory_view":
                  context.setMemoryViewData(jsonData.data);
                  break;
                default:
                  break;
              }
            } catch (e) {
              // If not valid JSON, do nothing or handle differently
              console.warn("Response is not valid JSON:", response);
            }
          }
        } catch (err) {
          console.log("err", err);
          if (!err.toString().includes("timeout")) {
            console.error("Receive error:", err);
            setStatus("Receive data error: " + err);
          }
        }
      }
    };

    listenForData();

    return () => {
      isListening = false; // Stop loop when component unmounts
    };
  }, [selectedPort]);

  return (
    <div className='flex-1 min-w-[384px] min-h-[420px] flex flex-col justify-center bg-white p-6 rounded-lg shadow-md max-w-sm w-full'>
      <h2 className='text-xl font-semibold mb-4 flex items-center gap-2'>
        COM Connection
        <span
          className={
            status.includes("Connected to")
              ? "inline-block w-3 h-3 rounded-full bg-green-500"
              : status.includes("error")
              ? "inline-block w-3 h-3 rounded-full bg-red-500"
              : "inline-block w-3 h-3 rounded-full bg-gray-400"
          }
        ></span>
      </h2>
      <div className='mb-4'>
        <label className='block text-gray-700 mb-1'>Select COM port</label>
        <select
          className='border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring focus:border-blue-300'
          value={selectedPort}
          onChange={(e) => setSelectedPort(e.target.value)}
        >
          <option value=''>-- Select COM port --</option>
          {ports?.map((port) => (
            <option key={port} value={port}>
              {port}
            </option>
          ))}
        </select>
      </div>
      <div className='flex gap-2 mb-4'>
        <button
          onClick={handleConnect}
          className='flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition'
        >
          Connect
        </button>
        <button
          onClick={handleDisconnect}
          className='flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400 transition'
        >
          Disconnect
        </button>
      </div>
      <button
        onClick={handleData}
        className='w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 transition mb-4'
      >
        Send login command
      </button>
      <div
        className={`text-sm text-center ${
          status.includes("error")
            ? "text-red-500"
            : status.includes("Connected to")
            ? "text-green-600"
            : "text-gray-700"
        }`}
      >
        {status}
      </div>
    </div>
  );
}

export default ConnectComponent;
