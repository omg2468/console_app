import { useEffect, useState } from "react";
import * as AuthService from "../../wailsjs/go/auth/AuthService";

function ConnectComponent() {
  const [ports, setPorts] = useState([]);
  const [selectedPort, setSelectedPort] = useState("");
  const [status, setStatus] = useState("Chưa kết nối");

  const handleConnect = () => {
    if (!selectedPort) {
      setStatus("Hãy chọn một cổng COM");
      return;
    }

    AuthService.ConnectToPort(selectedPort)
      .then(() => setStatus("Đã kết nối đến " + selectedPort))
      .catch((err) => setStatus("Lỗi kết nối: " + err));
  };

  const handleDisconnect = () => {
    AuthService.Disconnect()
      .then(() => {
        setStatus("Đã ngắt kết nối");
        setSelectedPort("");
      })
      .catch((err) => setStatus("Lỗi ngắt kết nối: " + err));
  };

  const handleData = () => {
    console.log("Gửi lệnh đăng nhập");

    AuthService.Login("admin", "1231abc").then(() =>
      setStatus("Đã gửi lệnh đăng nhập")
    );
  };

  useEffect(() => {
    AuthService.ListPorts()
      .then(setPorts)
      .catch((err) => setStatus("Lỗi lấy COM: " + err));
  }, []);

  useEffect(() => {
    if (!selectedPort) {
      return;
    }

    let isListening = true;

    const listenForData = async () => {
      while (isListening) {
        try {
          const response = await AuthService.GetResponse(1000);

          if (response) {
            console.log("Dữ liệu từ thiết bị:", response);
            setStatus("Thiết bị gửi: " + response);
          }
        } catch (err) {
          if (!err.toString().includes("timeout")) {
            console.error("Lỗi nhận:", err);
            setStatus("Lỗi nhận dữ liệu: " + err);
          }
        }
      }
    };

    listenForData();

    return () => {
      isListening = false; // Ngừng vòng lặp khi component bị unmount
    };
  }, [selectedPort]);

  return (
    <div className="bg-white p-4 shadow-md">
      <h2>Kết nối COM</h2>
      <button onClick={handleData} style={{ marginBottom: 10 }}>
        Gửi lệnh đăng nhập
      </button>
      <select
        className="border border-gray-300 rounded p-2"
        value={selectedPort}
        onChange={(e) => setSelectedPort(e.target.value)}
      >
        <option value="">-- Chọn cổng COM --</option>
        {ports?.map((port) => (
          <option key={port} value={port}>
            {port}
          </option>
        ))}
      </select>

      <button onClick={handleConnect} style={{ marginLeft: 10 }}>
        Kết nối
      </button>

      <button onClick={handleDisconnect} style={{ marginLeft: 10 }}>
        Ngắt kết nối
      </button>

      <p>{status}</p>
    </div>
  );
}

export default ConnectComponent;
