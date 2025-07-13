import { useEffect, useState, useContext, useCallback } from "react";
import * as AuthService from "../../wailsjs/go/auth/AuthService";
import {
  DownloadConfig,
  UploadConfig,
} from "../../wailsjs/go/workspace/WorkspaceService";
import { ContextMenuContext } from "../store";

import { ChangePassword } from "../../wailsjs/go/auth/AuthService";

import { ShowErrorDialog, ShowInfoDialog } from "../../wailsjs/go/main/App";

function ConnectComponent({ onConnected, dataFile, setDataFile, fileLoaded }) {
  const [ports, setPorts] = useState([]);
  const [status, setStatus] = useState("Not connected");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
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

  const handleLogin = () => {
    setUsername("");
    setPassword("");
    if (context.isLogin) {
      ShowErrorDialog("Vui lòng đăng xuất trước khi đăng nhập lại");
      return;
    }

    if (!context.isConnected) {
      ShowErrorDialog("Vui lòng kết nối trước khi đăng nhập");
      return;
    }

    if (!username || !password) {
      ShowErrorDialog("Vui lòng nhập tên người dùng và mật khẩu");
      return;
    }
    AuthService.Login(username, password).catch((err) => {
      ShowErrorDialog("Lỗi khi đăng nhập: " + err);
    });
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
    // will add context.isLogin
    if (!context.selectedPort || !context.isConnected) return;

    let isListening = true;

    const listenForData = async () => {
      while (isListening) {
        try {
          const response = await AuthService.GetResponse(10000);
          if (response) {
            try {
              const jsonData = JSON.parse(response);
              context.setDataTest(response); // Update dataTest with the raw response
              switch (jsonData.type) {
                case "read_analog":
                  if (jsonData.data) {
                    context.setAnalogData(jsonData.data);
                  }
                  break;
                case "read_tag_view":
                  if (jsonData.data) {
                    context.setTagViewData(jsonData.data);
                  }
                  break;
                case "read_memory_view":
                  if (jsonData.data) {
                    context.setMemoryViewData(jsonData.data);
                  }
                  break;
                case "download_config":
                  if (jsonData.data) {
                    setDataFile(jsonData.data);
                    ShowInfoDialog(
                      "Đã tải xuống cấu hình thành công",
                      "Download Config"
                    );
                  }
                  break;

                case "set_digital_output":
                  if (jsonData.status === "success") {
                    ShowInfoDialog(
                      "Đã cập nhật đầu Digital Output thành công",
                      "Set Digital Output"
                    );
                  } else {
                    ShowErrorDialog("Cập nhật đầu Digital Output thất bại: ");
                  }
                  break;

                case "login":
                  if (jsonData.status === "success") {
                    context.setIsLogin(true);
                    context.setRole(jsonData.role || "user");
                    ShowInfoDialog("Đăng nhập thành công", "Login");
                  } else {
                    ShowErrorDialog("Đăng nhập thất bại");
                  }
                  break;

                case "logout":
                  context.setIsLogin(false);
                  context.setRole("");
                  ShowInfoDialog("Đăng xuất thành công", "Logout");
                  break;

                case "change_password":
                  if (jsonData.status === "success") {
                    ShowInfoDialog(
                      "Đổi mật khẩu thành công",
                      "Change Password"
                    );
                  } else {
                    ShowErrorDialog(jsonData.message);
                  }
                  break;

                case "network_setting":
                  if (jsonData.status === "success") {
                    ShowInfoDialog(
                      "Cài đặt mạng thành công",
                      "Network Setting"
                    );
                  } else {
                    ShowErrorDialog("Cài đặt mạng thất bại");
                  }
                  break;

                case "network":
                  context.setFormData(jsonData);
                  break;

                case "calib_4ma":
                  if (jsonData.status === "success") {
                    ShowInfoDialog("Calib 4mA thành công", "Calib 4mA");
                  } else {
                    ShowErrorDialog("Calib 4mA thất bại");
                  }
                  break;

                case "calib_16ma":
                  if (jsonData.status === "success") {
                    ShowInfoDialog("Calib 16mA thành công", "Calib 16mA");
                  } else {
                    ShowErrorDialog("Calib 16mA thất bại");
                  }
                  break;

                case "upload_config":
                  if (jsonData.status === "success") {
                    ShowInfoDialog(
                      "Upload cấu hình thành công",
                      "Upload Config"
                    );
                  } else {
                    ShowErrorDialog("Upload cấu hình thất bại");
                  }
                  break;

                case "read_system_info":
                  if (jsonData.data) {
                    context.setInfoDialog(jsonData.data.replace(/, /g, "\n"));
                  }
                  break;

                case "write_serial_number":
                  if (jsonData.status === "success") {
                    context.setInfoDialog("Ghi số serial thành công");
                  } else {
                    context.setInfoDialog("Ghi số serial thất bại");
                  }
                  break;

                case "write_mac":
                  if (jsonData.status === "success") {
                    context.setInfoDialog("Ghi địa chỉ MAC thành công");
                  } else {
                    context.setInfoDialog("Ghi địa chỉ MAC thất bại");
                  }
                  break;

                case "reset_configuration":
                  if (jsonData.status === "success") {
                    context.setInfoDialog("Đặt lại cấu hình thành công");
                  } else {
                    context.setInfoDialog("Đặt lại cấu hình thất bại");
                  }
                  break;

                case "reboot":
                  if (jsonData.status === "success") {
                    context.setInfoDialog("Thiết bị đã khởi động lại");
                  } else {
                    context.setInfoDialog("Khởi động lại thiết bị thất bại");
                  }
                  break;

                case "read_sim_info":
                  if (jsonData.data) {
                    context.setInfoDialog(jsonData.data);
                  } else {
                    context.setInfoDialog("Không có thông tin SIM");
                  }
                  break;

                case "read_sdcard_info":
                  if (jsonData.data) {
                    context.setInfoDialog(jsonData.data);
                  } else {
                    context.setInfoDialog("Không có thông tin thẻ SD");
                  }
                  break;

                case "ping":
                  if (jsonData.status === "success") {
                    context.setInfoDialog("Ping thành công");
                  } else {
                    context.setInfoDialog("Ping thất bại");
                  }
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
      {showModal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1100]"
          onClick={() => setShowModal(false)} // Đóng modal khi click nền đen
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-xs sm:max-w-sm p-7 relative animate-fadeIn"
            onClick={(e) => e.stopPropagation()} // Ngăn sự kiện nổi bọt khi click vào modal
            style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}
          >
            <div className="flex flex-col items-center mb-4">
              <span className="text-lg font-semibold text-gray-800">
                Change Password
              </span>
            </div>
            <input
              type="password"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg mb-5 focus:outline-none focus:border-blue-500 transition"
              value={oldPassword}
              autoFocus
              onChange={(e) => setOldPassword(e.target.value)}
            />
            <input
              type="password"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg mb-5 focus:outline-none focus:border-blue-500 transition"
              value={passwordInput}
              autoFocus
              onChange={(e) => setPasswordInput(e.target.value)}
            />
            <input
              type="password"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg mb-5 focus:outline-none focus:border-blue-500 transition"
              value={passwordConfirm}
              autoFocus
              onChange={(e) => setPasswordConfirm(e.target.value)}
            />
            <div className="flex gap-3 mt-2">
              <button
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition"
                onClick={() => {
                  if (!oldPassword || !passwordInput || !passwordConfirm) {
                    ShowErrorDialog("Vui lòng điền đầy đủ thông tin");
                    return;
                  }

                  if (passwordInput === oldPassword) {
                    ShowErrorDialog("Mật khẩu mới không được trùng với mật khẩu cũ");
                    return;
                  }

                  if (passwordInput !== passwordConfirm) {
                    ShowErrorDialog("Mật khẩu không khớp");
                    return;
                  }
                  ChangePassword(oldPassword, passwordInput);
                }}
              >
                Save
              </button>
              <button
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition"
                onClick={() => setShowModal(false)} // Đóng modal khi click nút Close
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
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
      <div className="text-xs text-gray-500 mb-2 flex flex-col gap-1">
        <input
          type="text"
          value={username}
          placeholder="Username"
          onChange={(e) => setUsername(e.target.value)}
          className="w-full border border-gray-300 rounded px-2 py-1 mb-1 focus:outline-none focus:ring focus:border-blue-400"
        />
        <input
          type="password"
          value={password}
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-gray-300 rounded px-2 py-1 mb-1 focus:outline-none focus:ring focus:border-blue-400"
        />
      </div>
      <div className="flex flex-col md:flex-row items-center justify-center gap-2 w-full">
        {!context.isConnected ? (
          <button
            onClick={handleConnect}
            className="flex-1 px-2 w-full bg-blue-600 text-white py-1 rounded border border-blue-700 hover:bg-blue-700 text-xs transition"
          >
            Connect
          </button>
        ) : (
          <button
            onClick={handleDisconnect}
            className="flex-1 px-2 w-full bg-gray-200 text-gray-700 py-1 rounded border border-gray-400 hover:bg-gray-300 text-xs transition"
          >
            Disconnect
          </button>
        )}
      </div>
      <div className="flex flex-col md:flex-row items-center justify-center gap-2 w-full">
        <button
          onClick={handleLogin}
          className="flex-1 px-2 w-full bg-blue-600 text-white py-1 rounded border border-blue-700 hover:bg-blue-700 text-xs transition"
          disabled={!context.isConnected}
        >
          Login
        </button>
      </div>
      <button
        onClick={() => setShowModal(true)}
        className="flex-1 px-2 w-full bg-gray-200 text-gray-700 py-1 rounded border border-gray-400 hover:bg-gray-300 text-xs transition"
        // disabled={!context.isConnected || !context.isLogin}
      >
        Change Password
      </button>
      <button
        disabled={!context.isConnected}
        onClick={handleUploadConfig}
        className={`flex-1 px-2 w-full py-1 rounded border text-xs transition
    ${
      context.isConnected
        ? "bg-gray-200 text-gray-700 border-gray-400 hover:bg-gray-300 cursor-pointer"
        : "bg-gray-100 text-gray-400 border-gray-300"
    }
  `}
      >
        Upload
      </button>
      <button
        disabled={!context.isConnected}
        onClick={DownloadConfig}
        className={`flex-1 px-2 w-full py-1 rounded border text-xs transition
    ${
      context.isConnected
        ? "bg-gray-200 text-gray-700 border-gray-400 hover:bg-gray-300 cursor-pointer"
        : "bg-gray-100 text-gray-400 border-gray-300"
    }
  `}
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
