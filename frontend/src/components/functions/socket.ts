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

// Cache để lưu trữ listener intervals
const socketListeners = new Map<string, NodeJS.Timeout>();

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
    // Dừng listener trước khi disconnect
    stopSocketListener(address, port);
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

// Lấy dữ liệu từ socket (single message) với timeout
export const getSocketData = async (
  address: string, 
  port: string,
  timeout: number = 5000
): Promise<string> => {
  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Socket timeout')), timeout);
    });
    
    const dataPromise = GetSocketData(address, port);
    
    return await Promise.race([dataPromise, timeoutPromise]);
  } catch (error) {
    console.error("Lỗi nhận dữ liệu:", error);
    throw error;
  }
};

// Lấy tất cả dữ liệu từ socket với debounce
export const getAllSocketData = async (address: string, port: string): Promise<string[]> => {
  try {
    return await GetAllSocketData(address, port);
  } catch (error) {
    console.error("Lỗi nhận tất cả dữ liệu:", error);
    throw error;
  }
};

// Real-time socket listener với callback
export const startSocketListener = (
  address: string,
  port: string,
  onDataReceived: (messages: SocketMessage[]) => void,
  interval: number = 100 // Giảm interval để responsive hơn
): void => {
  const key = `${address}:${port}`;
  
  // Dừng listener cũ nếu có
  stopSocketListener(address, port);
  
  const listener = setInterval(async () => {
    try {
      // Kiểm tra kết nối trước
      const isConnected = await checkSocketConnection(address, port);
      if (!isConnected) {
        console.warn(`Socket ${key} disconnected, stopping listener`);
        stopSocketListener(address, port);
        return;
      }
      
      // Lấy tất cả dữ liệu có sẵn
      const rawData = await getAllSocketData(address, port);
      
      if (rawData && rawData.length > 0) {
        const messages = rawData.map(data => formatSocketMessage(data, 'received'));
        
        // Batch update để tránh nhiều re-render
        onDataReceived(messages);
      }
    } catch (error) {
      console.error(`Lỗi trong socket listener ${key}:`, error);
      // Có thể tự động retry hoặc thông báo lỗi
    }
  }, interval);
  
  socketListeners.set(key, listener);
  console.log(`Started socket listener for ${key}`);
};

// Dừng socket listener
export const stopSocketListener = (address: string, port: string): void => {
  const key = `${address}:${port}`;
  const listener = socketListeners.get(key);
  
  if (listener) {
    clearInterval(listener);
    socketListeners.delete(key);
    console.log(`Stopped socket listener for ${key}`);
  }
};

// Dừng tất cả listeners
export const stopAllSocketListeners = (): void => {
  socketListeners.forEach((listener, key) => {
    clearInterval(listener);
    console.log(`Stopped socket listener for ${key}`);
  });
  socketListeners.clear();
};

// Enhanced socket data polling với queue management
export const createSocketDataQueue = (
  address: string,
  port: string,
  onData: (message: SocketMessage) => void,
  options: {
    interval?: number;
    maxRetries?: number;
    batchSize?: number;
  } = {}
) => {
  const { interval = 50, maxRetries = 3, batchSize = 10 } = options;
  const key = `${address}:${port}`;
  let isRunning = false;
  let retryCount = 0;
  
  const processQueue = async () => {
    if (!isRunning) return;
    
    try {
      const data = await getAllSocketData(address, port);
      
      if (data && data.length > 0) {
        // Process in batches để tránh overwhelm UI
        for (let i = 0; i < data.length; i += batchSize) {
          const batch = data.slice(i, i + batchSize);
          batch.forEach(item => {
            onData(formatSocketMessage(item, 'received'));
          });
          
          // Small delay between batches
          if (i + batchSize < data.length) {
            await new Promise(resolve => setTimeout(resolve, 10));
          }
        }
        
        retryCount = 0; // Reset retry count on success
      }
      
      // Schedule next poll
      setTimeout(processQueue, interval);
      
    } catch (error) {
      console.error(`Socket queue error for ${key}:`, error);
      retryCount++;
      
      if (retryCount < maxRetries) {
        // Exponential backoff
        const delay = Math.min(1000, interval * Math.pow(2, retryCount));
        setTimeout(processQueue, delay);
      } else {
        console.error(`Max retries reached for ${key}, stopping queue`);
        isRunning = false;
      }
    }
  };
  
  return {
    start: () => {
      if (!isRunning) {
        isRunning = true;
        retryCount = 0;
        processQueue();
        console.log(`Started socket queue for ${key}`);
      }
    },
    stop: () => {
      isRunning = false;
      console.log(`Stopped socket queue for ${key}`);
    },
    isRunning: () => isRunning
  };
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
    timestamp: new Date().toISOString(), // Use ISO string for better precision
    data: data.trim(), // Trim whitespace
    direction
  };
};

// Debounce helper for UI updates
export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
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
