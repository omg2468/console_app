import { useEffect, useState, useContext } from "react";
import * as AuthService from "../../wailsjs/go/auth/AuthService";
import {
  DownloadConfig,
  UploadConfig,
  DownloadConfigEthernet,
  UploadConfigEthernet,
} from "../../wailsjs/go/workspace/WorkspaceService";
import { ContextMenuContext } from "../store";

import { ChangePassword } from "../../wailsjs/go/auth/AuthService";

import { ShowErrorDialog, ShowInfoDialog } from "../../wailsjs/go/main/App";

import { GetLocalTimezoneOffset } from "../../wailsjs/go/control/ControlService";

import {
  Login,
  ChangePassword as ChangePasswordWS,
} from "../../wailsjs/go/workspace/WorkspaceService";

import {
  connectSocket,
  disconnectSocket,
  getAllSocketData,
  validateSocketParams,
  getRealSocketData
} from "./functions/socket";

function ConnectComponent({
  onConnected,
  dataFile,
  setDataFile,
  fileLoaded,
  setFileLoaded,
}) {
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
    if (context.selectedConnection === "serial") {
      handleSerialConnect();
    } else if (context.selectedConnection === "ethernet") {
      handleSocketConnect();
    }
  };

  const handleSerialConnect = () => {
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

  const handleSocketConnect = async () => {
    if (!validateSocketParams(context.socketAddress, context.socketPort)) {
      setStatus("Invalid address or port");
      return;
    }

    try {
      // await connectSocket(context.socketAddress, context.socketPort);
      await getRealSocketData(context.socketAddress, context.socketPort);
      context.setIsSocketConnected(true);
      context.setIsConnected(true);
      setStatus(`Connected to ${context.socketAddress}:${context.socketPort}`);
      if (onConnected) onConnected();
    } catch (err) {
      setStatus("Socket connection error: " + err.message);
      context.setIsSocketConnected(false);
    }
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
    if (context.selectedConnection === "serial") {
      AuthService.Login(username, password).catch((err) => {
        ShowErrorDialog("Lỗi khi đăng nhập: " + err);
      });
    } else if (context.selectedConnection === "ethernet") {
      Login(
        context.socketAddress,
        context.socketPort,
        username,
        password
      ).catch((err) => {
        ShowErrorDialog("Lỗi khi đăng nhập: " + err);
      });
    }
  };

  const handleDisconnect = () => {
    if (context.selectedConnection === "serial") {
      handleSerialDisconnect();
    } else if (context.selectedConnection === "ethernet") {
      handleSocketDisconnect();
    }
    // Reset connection state regardless of connection type
    context.setIsConnected(false);
    context.setIsLogin(false);
    context.setRole("");
    setStatus("Disconnected");
  };

  const handleSerialDisconnect = () => {
    if (!context.isConnected) {
      return;
    }

    AuthService.Logout()
      .then(() => {
        // Logout successful, now proceed to disconnect
        AuthService.Disconnect()
          .then(() => {
            // Disconnect successful
            setStatus("Disconnected from serial");
            context.setSelectedPort("");
            context.setIsConnected(false);
            context.setIsLogin(false);
            context.setRole("");
          })
          .catch((err) => {
            setStatus("Disconnect error: " + err);
          });
      })
      .catch((logoutErr) => {
        setStatus("Logout error: " + logoutErr);
      });
  };

  const handleSocketDisconnect = async () => {
    try {
      await disconnectSocket(context.socketAddress, context.socketPort);
      context.setIsSocketConnected(false);
      context.setIsConnected(false);
      context.setIsLogin(false);
      context.setRole("");
      setStatus("Disconnected from socket");
    } catch (err) {
      setStatus("Disconnect error: " + err.message);
      // Even if there's an error, reset the state
      context.setIsSocketConnected(false);
      context.setIsConnected(false);
      context.setIsLogin(false);
      context.setRole("");
    }
  };

  const handleUploadConfig = () => {
    if (!dataFile) {
      ShowErrorDialog("Không có data để upload");
      return;
    }
    if (context.selectedConnection === "serial") {
      UploadConfig(JSON.stringify(dataFile)).catch((err) => {
        ShowErrorDialog("Lỗi upload cấu hình: " + err);
      });
    } else if (context.selectedConnection === "ethernet") {
      UploadConfigEthernet(
        context.socketAddress,
        context.socketPort,
        JSON.stringify(dataFile)
      ).catch((err) => {
        ShowErrorDialog("Lỗi upload cấu hình: " + err);
      });
    }
  };

  // Function xử lý data response
  const handleDataResponse = (jsonData) => {
    switch (jsonData.type) {
      case "read_analog":
        if (jsonData.data) {
          context.setAnalogData(jsonData.data);
          context.setAnalogUnit(jsonData.unit || "V");
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

      case "set_rtc":
        if (jsonData.status === "success") {
          context.setInfoDialog("Đặt thời gian thành công");
        } else {
          context.setInfoDialog("Đặt thời gian thất bại");
        }
        break;

      case "get_measure_mode":
        if (jsonData.mode) {
          context.setChangeMode(jsonData.mode);
        }
        break;

      case "set_measure_mode":
        if (jsonData.status === "success") {
          context.setChangeMode(!context.changeMode);
          ShowInfoDialog(
            `Đặt chế độ đo ${
              context.changeMode === "current" ? "voltage" : "current"
            } thành công`,
            "Set Measure Mode"
          );
        } else {
          ShowErrorDialog("Đặt chế độ đo thất bại");
        }
        break;

      case "get_rtc":
        if (jsonData.ts) {
          const tsSeconds = Number(jsonData.ts);

          GetLocalTimezoneOffset().then((offsetSeconds) => {
            const localTsMs = (tsSeconds + offsetSeconds) * 1000;
            context.setInfoDialog(
              `Thời gian hiện tại: ${new Date(localTsMs).toLocaleString()}`
            );
          });
        }
        break;
      case "download_config":
        // if (jsonData.data) {
        setFileLoaded("");
        setDataFile(jsonData);
        ShowInfoDialog("Đã tải xuống cấu hình thành công", "Download Config");
        // } else {
        //   ShowErrorDialog("Tải xuống cấu hình thất bại");
        // }
        break;
      case "upload_config":
        if (jsonData.status === "success") {
          ShowInfoDialog("Upload thành công", "Login");
        } else {
          ShowErrorDialog("Upload thất bại");
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
        if (jsonData.status === "success") {
          context.setIsLogin(false);
          context.setRole("");
          ShowInfoDialog("Đăng xuất thành công", "Logout");
        } else {
          ShowErrorDialog("Đăng xuất thất bại");
        }
        break;
      case "change_password":
        if (jsonData.status === "success") {
          ShowInfoDialog("Đổi mật khẩu thành công", "Change Password");
        } else {
          ShowErrorDialog(jsonData.message);
        }
        break;
      case "network_setting":
        if (jsonData.status === "success") {
          ShowInfoDialog(
            "Cài đặt mạng thành công. Reboot thiết bị để áp dụng thay đổi",
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
      case "set_digital_output":
        if (jsonData.status === "success") {
          ShowInfoDialog(
            "Đã cập nhật đầu Digital Output thành công",
            "Set Digital Output"
          );
        } else {
          ShowErrorDialog("Cập nhật đầu Digital Output thất bại");
        }
        break;
      case "read_system_info":
        if (jsonData.data) {
          context.setInfoDialog(jsonData.data.replaceAll(",", "\n"));
        } else {
          context.setInfoDialog("Không có dữ liệu hệ thống");
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

      case "write_serial_number":
        if (jsonData.status === "success") {
          context.setInfoDialog("Write serial number thành công");
        } else {
          context.setInfoDialog("Write serial number thất bại");
        }
        break;

      case "write_mac":
        if (jsonData.status === "success") {
          context.setInfoDialog("Write mac thành công");
        } else {
          context.setInfoDialog("Write mac thất bại");
        }
        break;

      case "reset_configuration":
        if (jsonData.status === "success") {
          context.setInfoDialog("Reset configuration thành công");
        } else {
          context.setInfoDialog("Reset configuration thất bại");
        }
        break;

      default:
        break;
    }
  };

  // Socket data reader
  const readSocketData = async () => {
    if (!context.isSocketConnected) return;

    try {
      const data = await getAllSocketData(
        context.socketAddress,
        context.socketPort
      );
      console.log(data);
      if (data && data.length > 0) {
        const latestData = data[data.length - 1];
        context.setDataTest(latestData);

        try {
          const jsonData = JSON.parse(latestData);
          handleDataResponse(jsonData);
        } catch (parseErr) {
          console.log("Non-JSON data received:", latestData);
        }
      }
    } catch (err) {
      console.error("Error reading socket data:", err);
    }
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
    // Handle data listening for both serial and socket
    if (!context.isConnected) return;

    let isListening = true;

    const listenForData = async () => {
      while (isListening) {
        try {
          if (context.selectedConnection === "serial" && context.selectedPort) {
            const response = await AuthService.GetResponse(100000);
            if (response) {
              try {
                const jsonData = JSON.parse(response);
                context.setDataTest(response);
                handleDataResponse(jsonData);
              } catch (e) {
                context.setDataTest(response);
              }
            }
          } else if (
            context.selectedConnection === "ethernet" &&
            context.isSocketConnected
          ) {
            await readSocketData();
            await new Promise((resolve) => setTimeout(resolve, 10000));
          }
        } catch (err) {
          if (!err.toString().includes("timeout")) {
            console.error("Data listening error:", err);
          }
        }
      }
    };

    listenForData();

    return () => {
      isListening = false;
    };
  }, [
    context.isConnected,
    context.selectedPort,
    context.selectedConnection,
    context.isSocketConnected,
  ]);

  // Cleanup effect to disconnect when component unmounts
  useEffect(() => {
    return () => {
      if (context.isConnected) {
        handleDisconnect();
      }
    };
  }, []);

  return (
    <div className="w-full max-w-xs bg-white border border-gray-300 rounded-lg shadow p-4 flex flex-col gap-3">
      {showModal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1100]"
          // onClick={() => setShowModal(false)} // Đóng modal khi click nền đen
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
              placeholder="Old Password"
              onChange={(e) => setOldPassword(e.target.value)}
            />
            <input
              type="password"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg mb-5 focus:outline-none focus:border-blue-500 transition"
              value={passwordInput}
              autoFocus
              placeholder="New Password"
              onChange={(e) => setPasswordInput(e.target.value)}
            />
            <input
              type="password"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg mb-5 focus:outline-none focus:border-blue-500 transition"
              value={passwordConfirm}
              autoFocus
              placeholder="Confirm New Password"
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
                    ShowErrorDialog(
                      "Mật khẩu mới không được trùng với mật khẩu cũ"
                    );
                    return;
                  }

                  if (passwordInput !== passwordConfirm) {
                    ShowErrorDialog("Mật khẩu không khớp");
                    return;
                  }
                  if (context.selectedConnection === "serial") {
                    ChangePassword(oldPassword, passwordInput);
                  } else if (context.selectedConnection === "ethernet") {
                    ChangePasswordWS(
                      context.socketAddress,
                      context.socketPort,
                      oldPassword,
                      passwordInput
                    );
                  }
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
        <label className="block text-xs text-gray-700 mb-1">Connection</label>
        <select
          className="border border-gray-300 rounded px-2 py-1 w-full text-xs focus:outline-none focus:ring focus:border-blue-400"
          value={context.selectedConnection}
          onChange={(e) => {
            // Disconnect current connection before switching
            if (context.isConnected) {
              handleDisconnect();
            }
            context.setSelectedConnection(e.target.value);
          }}
        >
          <option value="">-- Select connection --</option>
          {["serial", "ethernet"]?.map((type) => (
            <option key={type} value={type}>
              {type.toUpperCase()}
            </option>
          ))}
        </select>
      </div>
      {context.selectedConnection === "serial" && (
        <div>
          <label className="block text-xs text-gray-700 mb-1">
            Serial port
          </label>
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
      )}
      {context.selectedConnection === "ethernet" && (
        <div>
          <label className="block text-xs text-gray-700 mb-1">IP Address</label>
          <input
            className="mb-1 border border-gray-300 rounded px-2 py-1 w-full text-xs focus:outline-none focus:ring focus:border-blue-400"
            value={context.socketAddress}
            onChange={(e) => context.setSocketAddress(e.target.value)}
          />
          <label className="block text-xs text-gray-700 mb-1">Port</label>
          <input
            className="mb-1 border border-gray-300 rounded px-2 py-1 w-full text-xs focus:outline-none focus:ring focus:border-blue-400"
            value={context.socketPort}
            onChange={(e) => context.setSocketPort(e.target.value)}
            type="number"
          />
        </div>
      )}

      <div className="text-xs text-gray-500 mb-2 flex flex-col gap-1">
        <label className="block text-xs text-gray-700">Login</label>
        <input
          type="text"
          value={username}
          disabled={!context.isConnected}
          placeholder="Username"
          onChange={(e) => setUsername(e.target.value)}
          className="w-full border border-gray-300 rounded px-2 py-1 mb-1 focus:outline-none focus:ring focus:border-blue-400"
        />
        <input
          type="password"
          value={password}
          disabled={!context.isConnected}
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
        onClick={() => {
          if (context.selectedConnection === "serial") {
            DownloadConfig();
          } else if (context.selectedConnection === "ethernet") {
            DownloadConfigEthernet(context.socketAddress, context.socketPort);
          }
        }}
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
