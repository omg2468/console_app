import { useEffect, useState, useContext, useCallback } from "react";
import * as AuthService from "../../wailsjs/go/auth/AuthService";
import {
  DownloadConfig,
  UploadConfig,
} from "../../wailsjs/go/workspace/WorkspaceService";
import { ContextMenuContext } from "../store";

import { ShowErrorDialog, ShowInfoDialog } from "../../wailsjs/go/main/App";

function ConnectComponent({ onConnected, dataFile, setDataFile, fileLoaded }) {
  const [ports, setPorts] = useState([]);
  const [status, setStatus] = useState("Not connected");
  const context = useContext(ContextMenuContext);

  const handleConnect = () => {
    if (!context.selectedPort) {
      setStatus("Please select a COM port");
      return;
    }

    AuthService.ConnectToPort(context.selectedPort)
      .then(() => {
        context.setIsConnected(true);
        context.setSelectedPort(context.selectedPort);
        setStatus("Connected to " + context.selectedPort);
        if (onConnected) onConnected();
      })
      .catch((err) => setStatus("Connection error: " + err));
  };

  const handleDisconnect = () => {
    AuthService.Disconnect()
      .then(() => {
        setStatus("Disconnected");
        context.setSelectedPort("");
        context.setIsConnected(false);
      })
      .catch((err) => setStatus("Disconnect error: " + err));
  };

  const handleUploadConfig = () => {
    if (!dataFile) {
      ShowErrorDialog("Không có data để upload");
      return;
    }
    UploadConfig(JSON.stringify(dataFile)).catch((err) => {
        ShowErrorDialog("Lỗi upload cấu hình: " + err);
      });
  };

  useEffect(() => {
    AuthService.ListPorts()
      .then(setPorts)
      .catch((err) => console.log("Get COM error: " + err));

    if (context.selectedPort && context.isConnected) {
      setStatus("Connected to " + context.selectedPort);
    } else {
      AuthService.GetCurrentPort()
        .then((port) => {
          if (port) {
            context.setSelectedPort(port);
            context.setIsConnected(true);
            setStatus("Connected to " + port);
          } else {
            setStatus("Not connected");
          }
        })
        .catch((err) => console.log("Get current port error: " + err));
    }
  }, []);

  useEffect(() => {
    if (!context.selectedPort || !context.isConnected) return;

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
                case "download_config":
                  setDataFile(jsonData.data);
                  ShowInfoDialog(
                    "Đã tải xuống cấu hình thành công",
                    "Download Config"
                  );
                  break;

                default:
                  break;
              }
            } catch (e) {
              // Ignore invalid JSON
            }
          }
        } catch (err) {
          if (!err.toString().includes("timeout")) {
            // Handle other errors
          }
        }
      }
    };

    listenForData();

    return () => {
      isListening = false;
    };
  }, [context.selectedPort, context.isConnected]);

  return (
    <div className="w-full max-w-xs bg-white border border-gray-300 rounded-lg shadow p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-base font-semibold">COM Port</span>
        <span
          className={
            status.includes("Connected to")
              ? "inline-block w-3 h-3 rounded-full bg-green-500 border border-green-700"
              : status.includes("error")
              ? "inline-block w-3 h-3 rounded-full bg-red-500 border border-red-700"
              : "inline-block w-3 h-3 rounded-full bg-gray-400 border border-gray-500"
          }
        ></span>
      </div>
      <div>
        <label className="block text-xs text-gray-700 mb-1">Select port</label>
        <select
          className="border border-gray-300 rounded px-2 py-1 w-full text-xs focus:outline-none focus:ring focus:border-blue-400"
          value={context.selectedPort}
          onChange={(e) => context.setSelectedPort(e.target.value)}
        >
          <option value="">-- Select COM port --</option>
          {ports?.map((port) => (
            <option key={port} value={port}>
              {port}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col md:flex-row items-center justify-center gap-2 w-full">
        <button
          onClick={handleConnect}
          className="flex-1 px-2 w-full bg-blue-600 text-white py-1 rounded border border-blue-700 hover:bg-blue-700 text-xs transition"
        >
          Connect
        </button>
        <button
          onClick={handleDisconnect}
          className="flex-1 px-2 w-full bg-gray-200 text-gray-700 py-1 rounded border border-gray-400 hover:bg-gray-300 text-xs transition"
        >
          Disconnect
        </button>
      </div>
      <button
        onClick={handleUploadConfig}
        className="flex-1 px-2 w-full bg-gray-200 text-gray-700 py-1 rounded border border-gray-400 hover:bg-gray-300 text-xs transition"
      >
        Upload
      </button>
      <button
        onClick={DownloadConfig}
        className="flex-1 px-2 w-full bg-gray-200 text-gray-700 py-1 rounded border border-gray-400 hover:bg-gray-300 text-xs transition"
      >
        Download
      </button>
      <div
        className={`text-xs text-center ${
          status.includes("error")
            ? "text-red-500"
            : status.includes("Connected to")
            ? "text-green-600"
            : "text-gray-700"
        }`}
      >
        {status}
      </div>
      {!!fileLoaded && (
        <div className="fixed bottom-0 left-0 z-20 p-2 bg-stone-100 shadow-md text-sm text-gray-600">
          {fileLoaded}
        </div>
      )}
    </div>
  );
}

export default ConnectComponent;
