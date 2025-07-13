import {
  ConnectSocket,
  DisconnectSocket,
  GetSocketData,
  GetAllSocketData,
  SendSocketData,
  CheckSocketConnection,
  ListActiveConnections,
} from "../../../wailsjs/go/workspace/WorkspaceService";

export interface SocketConnection {
  address: string;
  port: string;
  isConnected: boolean;
}

export interface SocketMessage {
  timestamp: string;
  data: string;
  direction: 'received' | 'sent';
}

// Kết nối socket
export const connectSocket = async (address: string, port: string): Promise<boolean> => {
  try {
    if (!address || !port) {
      throw new Error("Vui lòng nhập địa chỉ và port");
    }

    await ConnectSocket(address, port);
    return true;
  } catch (error) {
    console.error("Lỗi kết nối socket:", error);
    throw error;
  }
};

// Ngắt kết nối socket
export const disconnectSocket = async (address: string, port: string): Promise<void> => {
  try {
    await DisconnectSocket(address, port);
  } catch (error) {
    console.error("Lỗi ngắt kết nối socket:", error);
    throw error;
  }
};

// Kiểm tra trạng thái kết nối
export const checkSocketConnection = async (address: string, port: string): Promise<boolean> => {
  try {
    return await CheckSocketConnection(address, port);
  } catch (error) {
    console.error("Lỗi kiểm tra kết nối:", error);
    return false;
  }
};

// Gửi dữ liệu qua socket
export const sendSocketData = async (address: string, port: string, data: string): Promise<void> => {
  try {
    await SendSocketData(address, port, data);
  } catch (error) {
    console.error("Lỗi gửi dữ liệu:", error);
    throw error;
  }
};

// Lấy dữ liệu từ socket (single message)
export const getSocketData = async (address: string, port: string): Promise<string> => {
  try {
    return await GetSocketData(address, port);
  } catch (error) {
    console.error("Lỗi nhận dữ liệu:", error);
    throw error;
  }
};

// Lấy tất cả dữ liệu từ socket
export const getAllSocketData = async (address: string, port: string): Promise<string[]> => {
  try {
    return await GetAllSocketData(address, port);
  } catch (error) {
    console.error("Lỗi nhận tất cả dữ liệu:", error);
    throw error;
  }
};

// Lấy danh sách kết nối hoạt động
export const listActiveConnections = async (): Promise<string[]> => {
  try {
    return await ListActiveConnections();
  } catch (error) {
    console.error("Lỗi lấy danh sách kết nối:", error);
    return [];
  }
};

// Helper function để format socket data
export const formatSocketMessage = (data: string, direction: 'received' | 'sent'): SocketMessage => {
  return {
    timestamp: new Date().toLocaleTimeString(),
    data,
    direction
  };
};

// Helper function để validate socket address and port
export const validateSocketParams = (address: string, port: string): boolean => {
  if (!address || !port) return false;
  
  const portNum = parseInt(port);
  if (isNaN(portNum) || portNum < 1 || portNum > 65535) return false;
  
  // Basic IP/hostname validation
  const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  const hostnamePattern = /^[a-zA-Z0-9.-]+$/;
  
  return ipPattern.test(address) || hostnamePattern.test(address);
};
