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

  useEffect(() => {
    AuthService.ListPorts()
      .then(setPorts)
      .catch((err) => setStatus("Lỗi lấy COM: " + err));
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>Kết nối COM</h2>

      <select
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
