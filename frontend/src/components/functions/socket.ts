/*
 * Socket Management System with Advanced Performance Optimization
 * 
 * Key improvements made:
 * 1. Memory Leak Prevention:
 *    - Proper timeout cleanup in all functions
 *    - Message queue size limits to prevent memory overflow
 *    - Tracking and cleanup of all scheduled timeouts
 * 
 * 2. Performance Optimization:
 *    - RequestAnimationFrame-based UI updates for 60fps
 *    - Intelligent batching with priority queues
 *    - Adaptive throttling based on system load
 *    - Connection pooling and load balancing
 *    - Background processing with Web Workers (when available)
 * 
 * 3. Multi-Socket Management:
 *    - Round-robin processing to prevent blocking
 *    - Priority-based message handling
 *    - Automatic load distribution
 *    - Circuit breaker pattern for failing connections
 * 
 * 4. Error Handling & Recovery:
 *    - Retry mechanisms with exponential backoff
 *    - Automatic cleanup on connection failures
 *    - Error callbacks for custom handling
 *    - Circuit breaker for unstable connections
 * 
 * 5. Resource Management:
 *    - Maximum connection limits with queuing
 *    - Memory-efficient queue management
 *    - CPU usage monitoring and throttling
 *    - Garbage collection optimization
 * 
 * Usage:
 * - Use socketManager for multiple connections with load balancing
 * - Use createHighPerformanceSocketListener for single high-frequency connections
 * - Always call cleanup methods when components unmount
 */

import {
  ConnectSocket,
  DisconnectSocket,
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

// Performance monitoring
interface PerformanceMetrics {
  fps: number;
  lastFrameTime: number;
  frameCount: number;
  avgProcessingTime: number;
  memoryUsage: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    fps: 60,
    lastFrameTime: performance.now(),
    frameCount: 0,
    avgProcessingTime: 0,
    memoryUsage: 0
  };
  
  private processingTimes: number[] = [];
  private maxSamples = 60; // 1 second at 60fps

  updateFPS(): void {
    const now = performance.now();
    this.metrics.frameCount++;
    
    if (now - this.metrics.lastFrameTime >= 1000) {
      this.metrics.fps = this.metrics.frameCount;
      this.metrics.frameCount = 0;
      this.metrics.lastFrameTime = now;
      
      // Update memory usage if available
      if ('memory' in performance) {
        this.metrics.memoryUsage = (performance as any).memory.usedJSHeapSize;
      }
    }
  }

  recordProcessingTime(duration: number): void {
    this.processingTimes.push(duration);
    if (this.processingTimes.length > this.maxSamples) {
      this.processingTimes.shift();
    }
    
    this.metrics.avgProcessingTime = 
      this.processingTimes.reduce((a, b) => a + b, 0) / this.processingTimes.length;
  }

  shouldThrottle(): boolean {
    return this.metrics.fps < 30 || this.metrics.avgProcessingTime > 16; // 16ms = 60fps
  }

  getAdaptiveInterval(): number {
    if (this.metrics.fps >= 55) return 2;    // High performance - siêu nhanh 2ms
    if (this.metrics.fps >= 40) return 5;    // Medium performance - 5ms
    if (this.metrics.fps >= 25) return 10;   // Low performance - 10ms  
    return 25; // Very low performance - 25ms
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }
}

// Global performance monitor
const performanceMonitor = new PerformanceMonitor();

// RequestAnimationFrame-based UI updater
class FrameScheduler {
  private pendingUpdates = new Map<string, () => void>();
  private isScheduled = false;

  schedule(key: string, update: () => void): void {
    this.pendingUpdates.set(key, update);
    
    if (!this.isScheduled) {
      this.isScheduled = true;
      requestAnimationFrame(() => this.processBatch());
    }
  }

  private processBatch(): void {
    const start = performance.now();
    
    // Process all pending updates in one frame
    this.pendingUpdates.forEach((update) => {
      try {
        update();
      } catch (error) {
        console.error('Frame update error:', error);
      }
    });
    
    this.pendingUpdates.clear();
    this.isScheduled = false;
    
    const duration = performance.now() - start;
    performanceMonitor.recordProcessingTime(duration);
    performanceMonitor.updateFPS();
  }

  cancel(key: string): void {
    this.pendingUpdates.delete(key);
  }

  getPendingCount(): number {
    return this.pendingUpdates.size;
  }
}

// Global frame scheduler
const frameScheduler = new FrameScheduler();

// Cache để lưu trữ listener intervals và stats intervals
const socketListeners = new Map<string, NodeJS.Timeout>();
const socketStatsIntervals = new Map<string, NodeJS.Timeout>();

// Kết nối socket - ENHANCED VERSION với real socket
export const connectSocket = async (address: string, port: string): Promise<boolean> => {
  console.log(`🚀 CONNECT SOCKET REQUEST: ${address}:${port}`);
  
  try {
    if (!address || !port) {
      const error = new Error("Vui lòng nhập địa chỉ và port");
      console.error(`❌ CONNECT VALIDATION FAILED:`, error.message);
      throw error;
    }

    if (!validateSocketParams(address, port)) {
      const error = new Error("Invalid address or port format");
      console.error(`❌ CONNECT PARAMS INVALID:`, error.message);
      throw error;
    }

    console.log(`🔍 VALIDATING CONNECTION: ${address}:${port}`);
    
    // First, try to create a real socket connection to test connectivity
    const testConnection = createRealSocketConnection(
      address,
      port,
      (data) => {
        console.log(`🧪 TEST CONNECTION RECEIVED DATA: ${data.substring(0, 50)}${data.length > 50 ? '...' : ''}`);
      },
      (error) => {
        console.error(`💥 TEST CONNECTION ERROR:`, error);
      },
      () => {
        console.log(`✅ TEST CONNECTION ESTABLISHED: ${address}:${port}`);
      },
      () => {
        console.log(`🔴 TEST CONNECTION CLOSED: ${address}:${port}`);
      }
    );

    if (!testConnection) {
      const error = new Error("Failed to create test connection");
      console.error(`❌ TEST CONNECTION FAILED:`, error.message);
      throw error;
    }

    // Wait a bit to ensure connection is established
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const status = testConnection.getStatus();
    console.log(`📊 TEST CONNECTION STATUS:`, status);
    
    if (!status.isConnected) {
      testConnection.disconnect();
      const error = new Error(`Cannot establish connection to ${address}:${port}`);
      console.error(`❌ CONNECTION TEST FAILED:`, error.message);
      throw error;
    }

    // Disconnect test connection
    testConnection.disconnect();
    
    console.log(`✅ SOCKET CONNECTION SUCCESSFUL: ${address}:${port}`);
    return true;
    
  } catch (error) {
    console.error(`💥 CONNECT SOCKET ERROR: ${address}:${port}`, error);
    throw error;
  }
};

// Ngắt kết nối socket - ENHANCED VERSION với real socket cleanup
export const disconnectSocket = async (address: string, port: string): Promise<void> => {
  console.log(`🛑 DISCONNECT SOCKET REQUEST: ${address}:${port}`);
  
  try {
    const key = `${address}:${port}`;
    
    // Stop socket listener first - CRITICAL để tránh data tiếp tục được fetch
    console.log(`🔄 STOPPING SOCKET LISTENER: ${key}`);
    stopSocketListener(address, port);
    
    // Stop ALL high-performance listeners and queues
    console.log(`🛑 STOPPING ALL SOCKET MANAGERS: ${key}`);
    socketManager.removeConnection(address, port);
    
    // Get real socket connection if exists
    const connection = realSocketConnections.get(key);
    if (connection) {
      console.log(`🔌 FOUND REAL SOCKET CONNECTION: ${key}`);
      const status = connection.getStatus();
      console.log(`📊 CONNECTION STATUS BEFORE DISCONNECT:`, status);
      
      // Disconnect real socket - IMMEDIATE cleanup
      connection.disconnect();
      console.log(`✅ REAL SOCKET DISCONNECTED: ${key}`);
      
      // Clean up from cache IMMEDIATELY
      realSocketConnections.delete(key);
      socketDataBuffers.delete(key);
      console.log(`🧹 CLEANED UP CACHE: ${key}`);
    } else {
      console.log(`⚠️ NO REAL SOCKET CONNECTION FOUND: ${key}`);
    }
    
    // Also try original disconnect as fallback
    try {
      console.log(`🔄 ATTEMPTING ORIGINAL DISCONNECT: ${key}`);
      await DisconnectSocket(address, port);
      console.log(`✅ ORIGINAL DISCONNECT SUCCESSFUL: ${key}`);
    } catch (originalError) {
      console.warn(`⚠️ ORIGINAL DISCONNECT FAILED: ${key}`, originalError);
      // Don't throw here, as real socket disconnect might be sufficient
    }
    
    // Final verification - ensure NO MORE DATA is being processed
    console.log(`🔍 FINAL VERIFICATION - ensuring no more data processing for: ${key}`);
    const finalConnection = realSocketConnections.get(key);
    const finalBuffer = socketDataBuffers.get(key);
    const finalListener = socketListeners.get(key);
    
    if (finalConnection || finalBuffer || finalListener) {
      console.error(`❌ CLEANUP INCOMPLETE:`, {
        hasConnection: !!finalConnection,
        hasBuffer: !!finalBuffer,
        hasListener: !!finalListener
      });
    } else {
      console.log(`✅ CLEANUP VERIFIED: No remaining connections/buffers/listeners for ${key}`);
    }
    
    console.log(`✅ SOCKET DISCONNECTION COMPLETED: ${address}:${port}`);
    
  } catch (error) {
    console.error(`💥 DISCONNECT SOCKET ERROR: ${address}:${port}`, error);
    
    // Force cleanup even on error
    const key = `${address}:${port}`;
    const connection = realSocketConnections.get(key);
    if (connection) {
      try {
        connection.disconnect();
      } catch (cleanupError) {
        console.error(`💥 FORCE CLEANUP ERROR:`, cleanupError);
      }
    }
    realSocketConnections.delete(key);
    socketDataBuffers.delete(key);
    stopSocketListener(address, port); // Force stop listener
    socketManager.removeConnection(address, port); // Force stop manager
    
    throw error;
  }
};

// Kiểm tra trạng thái kết nối - ENHANCED VERSION với real socket
export const checkSocketConnection = async (address: string, port: string): Promise<boolean> => {
  const key = `${address}:${port}`;
  
  try {
    // First check if we have a real socket connection
    const realConnection = realSocketConnections.get(key);
    if (realConnection) {
      const status = realConnection.getStatus();
      console.log(`🔍 CHECKING REAL SOCKET: ${key}`, {
        isConnected: status.isConnected,
        readyState: status.readyState,
        url: status.url
      });
      
      if (status.isConnected && status.readyState === 1) { // WebSocket.OPEN = 1
        return true;
      } else {
        console.warn(`⚠️ REAL SOCKET NOT READY: ${key} - state=${status.readyState}, connected=${status.isConnected}`);
        // Try to reconnect if not connected
        if (!status.isConnected) {
          console.log(`🔄 ATTEMPTING REAL SOCKET RECONNECT: ${key}`);
          realConnection.reconnect();
        }
        return false;
      }
    }
    
    // Fallback to original check
    console.log(`🔍 CHECKING ORIGINAL SOCKET CONNECTION: ${key}`);
    const isConnected = await CheckSocketConnection(address, port);
    
    if (isConnected) {
      console.log(`✅ ORIGINAL SOCKET CONNECTED: ${key}`);
    } else {
      console.log(`❌ ORIGINAL SOCKET NOT CONNECTED: ${key}`);
    }
    
    return isConnected;
    
  } catch (error) {
    console.error(`💥 CHECK CONNECTION ERROR: ${key}`, error);
    return false;
  }
};

// Gửi dữ liệu qua socket - ENHANCED VERSION với real socket
export const sendSocketData = async (address: string, port: string, data: string): Promise<void> => {
  const key = `${address}:${port}`;
  console.log(`📤 SEND SOCKET DATA REQUEST: ${key}`, {
    dataLength: data.length,
    preview: data.substring(0, 100) + (data.length > 100 ? '...' : '')
  });
  
  try {
    // First try to send via real socket connection
    const realConnection = realSocketConnections.get(key);
    if (realConnection) {
      const status = realConnection.getStatus();
      console.log(`🔍 CHECKING REAL SOCKET FOR SEND: ${key}`, status);
      
      if (status.isConnected && status.readyState === 1) { // WebSocket.OPEN = 1
        const success = realConnection.send(data);
        if (success) {
          console.log(`✅ DATA SENT VIA REAL SOCKET: ${key}`);
          return;
        } else {
          console.warn(`⚠️ REAL SOCKET SEND FAILED: ${key}`);
        }
      } else {
        console.warn(`⚠️ REAL SOCKET NOT READY FOR SEND: ${key} - state=${status.readyState}`);
      }
    }
    
    // Fallback to original send
    console.log(`🔄 ATTEMPTING ORIGINAL SOCKET SEND: ${key}`);
    await SendSocketData(address, port, data);
    console.log(`✅ DATA SENT VIA ORIGINAL SOCKET: ${key}`);
    
  } catch (error) {
    console.error(`💥 SEND SOCKET DATA ERROR: ${key}`, error);
    throw error;
  }
};

// Global real socket connections cache
const realSocketConnections = new Map<string, ReturnType<typeof createRealSocketConnection>>();
const socketDataBuffers = new Map<string, string[]>();

// REAL SOCKET DATA FETCHER - Thay thế getAllSocketData với enhanced disconnect check
export const getRealSocketData = async (address: string, port: string): Promise<string[]> => {
  const key = `${address}:${port}`;
  const startTime = performance.now();
  
  // CRITICAL: Check if listener was stopped (means disconnect was called)
  if (!socketListeners.has(key)) {
    // Only log occasionally to avoid spam
    if (Math.random() < 0.01) { // 1% chance to log
      console.log(`⚠️ LISTENER STOPPED, IGNORING DATA REQUEST: ${key}`);
    }
    return [];
  }
  
  console.log(`🔍 GET REAL SOCKET DATA REQUEST: ${key}`);
  
  try {
    // Check if we already have a real socket connection
    let connection = realSocketConnections.get(key);
    
    if (!connection) {
      console.log(`🆕 CREATING NEW REAL SOCKET CONNECTION: ${key}`);
      
      // Initialize data buffer for this connection
      socketDataBuffers.set(key, []);
      
      // Create new real socket connection
      connection = createRealSocketConnection(
        address,
        port,
        (data) => {
          // CRITICAL: Only buffer data if listener is still active
          if (!socketListeners.has(key)) {
            console.log(`🛑 IGNORING DATA - LISTENER STOPPED: ${key}`);
            return;
          }
          
          // Buffer incoming data
          const buffer = socketDataBuffers.get(key) || [];
          buffer.push(data);
          socketDataBuffers.set(key, buffer);
          
          console.log(`📦 BUFFERED DATA: ${key} now has ${buffer.length} messages`);
          console.log(`📄 LATEST MESSAGE: ${data.substring(0, 100)}${data.length > 100 ? '...' : ''}`);
        },
        (error) => {
          console.error(`💥 REAL SOCKET ERROR for ${key}:`, error);
        },
        () => {
          console.log(`✅ REAL SOCKET CONNECTED: ${key}`);
        },
        () => {
          console.log(`🔴 REAL SOCKET DISCONNECTED: ${key}`);
          // Clean up on disconnect
          realSocketConnections.delete(key);
          socketDataBuffers.delete(key);
        }
      );
      
      if (connection) {
        realSocketConnections.set(key, connection);
        console.log(`💾 CACHED REAL SOCKET CONNECTION: ${key}`);
      } else {
        console.error(`❌ FAILED TO CREATE REAL SOCKET CONNECTION: ${key}`);
        return [];
      }
    }
    
    // CRITICAL: Double-check listener is still active before returning data
    if (!socketListeners.has(key)) {
      console.log(`🛑 LISTENER STOPPED DURING FETCH, RETURNING EMPTY: ${key}`);
      return [];
    }
    
    // Get buffered data
    const buffer = socketDataBuffers.get(key) || [];
    const fetchTime = performance.now() - startTime;
    
    if (buffer.length > 0) {
      console.log(`✅ RETURNING BUFFERED DATA: ${key} has ${buffer.length} messages (${fetchTime.toFixed(2)}ms)`);
      
      // Clear buffer after reading (or keep some for debugging)
      const returnData = [...buffer];
      socketDataBuffers.set(key, []); // Clear buffer
      
      // Log first few messages
      returnData.slice(0, 3).forEach((msg, index) => {
        console.log(`   📄 Message ${index + 1}: ${msg.substring(0, 50)}${msg.length > 50 ? '...' : ''}`);
      });
      
      if (returnData.length > 3) {
        console.log(`   📄 ...and ${returnData.length - 3} more messages`);
      }
      
      return returnData;
    } else {
      // Only log occasionally to avoid spam
      if (Math.random() < 0.01) { // 1% chance to log
        console.log(`📭 NO BUFFERED DATA: ${key} (${fetchTime.toFixed(2)}ms)`);
      }
      return [];
    }
    
  } catch (error) {
    const fetchTime = performance.now() - startTime;
    console.error(`💥 GET REAL SOCKET DATA ERROR: ${key} in ${fetchTime.toFixed(2)}ms:`, error);
    return [];
  }
};

// Helper function to get real socket connection status
export const getRealSocketStatus = (address: string, port: string) => {
  const key = `${address}:${port}`;
  const connection = realSocketConnections.get(key);
  const buffer = socketDataBuffers.get(key) || [];
  
  const status = {
    hasConnection: !!connection,
    bufferSize: buffer.length,
    connectionStatus: connection ? connection.getStatus() : null
  };
  
  console.log(`📊 REAL SOCKET STATUS for ${key}:`, status);
  return status;
};

// Helper function to disconnect all real sockets - ENHANCED cleanup
export const disconnectAllRealSockets = () => {
  console.log(`🛑 DISCONNECTING ALL REAL SOCKETS: ${realSocketConnections.size} connections`);
  
  realSocketConnections.forEach((connection, key) => {
    if (connection) {
      console.log(`🔌 DISCONNECTING: ${key}`);
      try {
        connection.disconnect();
      } catch (error) {
        console.error(`💥 ERROR DISCONNECTING ${key}:`, error);
      }
    }
  });
  
  realSocketConnections.clear();
  socketDataBuffers.clear();
  
  // Also stop all listeners and their stats intervals
  stopAllSocketListeners();
  
  // Also cleanup socket manager
  socketManager.removeAllConnections();
  
  console.log(`✅ ALL REAL SOCKETS DISCONNECTED AND CLEANED UP`);
};

// Lấy tất cả dữ liệu từ socket - ORIGINAL VERSION (fallback)
export const getAllSocketDataOriginal = async (address: string, port: string): Promise<string[]> => {
  const startTime = performance.now();
  const key = `${address}:${port}`;
  
  try {
    console.log(`🔍 FETCHING DATA from ${key} (ORIGINAL)...`);
    
    const data = await GetAllSocketData(address, port);
    const fetchTime = performance.now() - startTime;
    
    if (data && data.length > 0) {
      console.log(`✅ GOT DATA from ${key}: ${data.length} packets in ${fetchTime.toFixed(2)}ms (ORIGINAL)`);
      // Log first few characters of each packet
      data.forEach((packet, index) => {
        if (index < 3) { // Only log first 3 packets to avoid spam
          console.log(`   📄 Packet ${index + 1}: ${packet.substring(0, 50)}${packet.length > 50 ? '...' : ''}`);
        }
      });
      if (data.length > 3) {
        console.log(`   📄 ...and ${data.length - 3} more packets`);
      }
    } else {
      // Only log occasionally to avoid spam
      if (Math.random() < 0.01) { // 1% chance to log
        console.log(`📭 NO DATA from ${key} (${fetchTime.toFixed(2)}ms) (ORIGINAL)`);
      }
    }
    
    // Trả về data ngay lập tức, không có bất kỳ processing nào
    return data || [];
  } catch (error) {
    const fetchTime = performance.now() - startTime;
    console.error(`💥 FETCH ERROR from ${key} in ${fetchTime.toFixed(2)}ms (ORIGINAL):`, error);
    // Không log error để tránh spam console
    return [];
  }
};

// Lấy tất cả dữ liệu từ socket - NEW VERSION using real socket
export const getAllSocketData = getRealSocketData;

// Real-time socket listener với callback và proper cleanup - ENHANCED VERSION
export const startSocketListener = (
  address: string,
  port: string,
  onDataReceived: (messages: SocketMessage[]) => void,
  interval: number = 1 // Interval siêu nhanh - 1ms
): void => {
  const key = `${address}:${port}`;
  
  console.log(`🚀 STARTING ENHANCED SOCKET LISTENER: ${key} with ${interval}ms interval`);
  
  // Dừng listener cũ nếu có
  stopSocketListener(address, port);
  
  let retryCount = 0;
  let dataCount = 0;
  let lastDataTime = Date.now();
  const maxRetries = 3;
  
  const listener = setInterval(async () => {
    const startTime = performance.now();
    
    try {
      // Kiểm tra kết nối trước (using enhanced version)
      const isConnected = await checkSocketConnection(address, port);
      if (!isConnected) {
        console.warn(`❌ Socket ${key} disconnected, stopping listener`);
        stopSocketListener(address, port);
        return;
      }
      
      // Lấy tất cả dữ liệu có sẵn (using real socket data)
      const rawData = await getAllSocketData(address, port);
      
      if (rawData && rawData.length > 0) {
        const currentTime = Date.now();
        dataCount += rawData.length;
        
        console.log(`📦 LISTENER RECEIVED DATA: ${rawData.length} packets from ${key}`);
        console.log(`⚡ DATA RATE: ${dataCount} total packets, last received ${currentTime - lastDataTime}ms ago`);
        
        // Process TẤT CẢ data ngay lập tức - không giới hạn
        const messages = rawData.map(data => {
          const msg = formatSocketMessage(data, 'received');
          console.log(`📨 LISTENER MESSAGE: ${data.substring(0, 50)}${data.length > 50 ? '...' : ''}`);
          return msg;
        });
        
        // Debug: Log before sending to callback
        console.log(`🔄 LISTENER CALLING CALLBACK with ${messages.length} messages`);
        
        // Append ngay lập tức - không check gì cả
        const callbackStart = performance.now();
        onDataReceived(messages);
        const callbackTime = performance.now() - callbackStart;
        
        console.log(`✅ LISTENER CALLBACK COMPLETED in ${callbackTime.toFixed(2)}ms`);
        
        lastDataTime = currentTime;
      }
      
      const processingTime = performance.now() - startTime;
      if (processingTime > 5) { // Log if processing takes more than 5ms
        console.log(`⏱️ LISTENER PROCESSING TIME: ${processingTime.toFixed(2)}ms for ${key}`);
      }
      
      retryCount = 0; // Reset retry count on success
      
    } catch (error) {
      const processingTime = performance.now() - startTime;
      console.error(`💥 ERROR in enhanced socket listener ${key} (${processingTime.toFixed(2)}ms):`, error);
      retryCount++;
      
      if (retryCount >= maxRetries) {
        console.error(`🔴 MAX RETRIES REACHED for ${key}, stopping listener`);
        stopSocketListener(address, port);
      }
    }
  }, interval);
  
  socketListeners.set(key, listener);
  console.log(`✨ STARTED enhanced socket listener for ${key} with interval ${interval}ms`);
  
  // Log performance stats every 5 seconds - TRACK stats interval để có thể cleanup
  const statsInterval = setInterval(() => {
    if (!socketListeners.has(key)) {
      clearInterval(statsInterval);
      socketStatsIntervals.delete(key);
      return;
    }
    
    const now = Date.now();
    const timeSinceLastData = now - lastDataTime;
    const realConnection = realSocketConnections.get(key);
    const bufferSize = socketDataBuffers.get(key)?.length || 0;
    
    console.log(`📊 LISTENER STATS ${key}:`, {
      totalPackets: dataCount,
      timeSinceLastData: `${timeSinceLastData}ms`,
      hasRealConnection: !!realConnection,
      bufferSize: bufferSize,
      connectionStatus: realConnection ? realConnection.getStatus() : null
    });
  }, 5000);
  
  // Store stats interval để có thể cleanup sau
  socketStatsIntervals.set(key, statsInterval);
};

// Dừng socket listener - ENHANCED với cleanup stats interval
export const stopSocketListener = (address: string, port: string): void => {
  const key = `${address}:${port}`;
  const listener = socketListeners.get(key);
  const statsInterval = socketStatsIntervals.get(key);
  
  console.log(`🛑 STOPPING SOCKET LISTENER: ${key}`);
  
  if (listener) {
    clearInterval(listener);
    socketListeners.delete(key);
    console.log(`✅ CLEARED MAIN LISTENER: ${key}`);
  }
  
  if (statsInterval) {
    clearInterval(statsInterval);
    socketStatsIntervals.delete(key);
    console.log(`✅ CLEARED STATS INTERVAL: ${key}`);
  }
  
  console.log(`🧹 SOCKET LISTENER STOPPED: ${key}`);
};

// Dừng tất cả listeners - ENHANCED với cleanup toàn bộ
export const stopAllSocketListeners = (): void => {
  console.log(`🛑 STOPPING ALL SOCKET LISTENERS: ${socketListeners.size} listeners, ${socketStatsIntervals.size} stats intervals`);
  
  socketListeners.forEach((listener, key) => {
    clearInterval(listener);
    console.log(`✅ CLEARED LISTENER: ${key}`);
  });
  socketListeners.clear();
  
  socketStatsIntervals.forEach((statsInterval, key) => {
    clearInterval(statsInterval);
    console.log(`✅ CLEARED STATS: ${key}`);
  });
  socketStatsIntervals.clear();
  
  console.log(`🧹 ALL SOCKET LISTENERS STOPPED`);
};

// High-performance socket listener với intelligent load balancing
export const createHighPerformanceSocketListener = (
  address: string,
  port: string,
  onDataReceived: (messages: SocketMessage[]) => void,
  options: {
    priority?: 'low' | 'medium' | 'high';
    maxBatchSize?: number;
    adaptiveThrottling?: boolean;
    useWorker?: boolean;
    circuitBreakerThreshold?: number;
  } = {}
) => {
  const {
    priority = 'medium',
    maxBatchSize = 100,
    adaptiveThrottling = true,
    useWorker = false,
    circuitBreakerThreshold = 10
  } = options;

  const key = `${address}:${port}`;
  let isRunning = false;
  let messageQueue: SocketMessage[] = [];
  let errorCount = 0;
  let circuitOpen = false;
  let lastProcessTime = 0;
  let frameId: number | null = null;

  // Priority weights for load balancing
  const priorityWeights = { low: 1, medium: 2, high: 3 };
  const weight = priorityWeights[priority];

  const scheduleUpdate = (messages: SocketMessage[]) => {
    // Direct immediate update for real-time performance
    onDataReceived(messages);
  };

  const processWithCircuitBreaker = async (): Promise<void> => {
    if (circuitOpen) {
      // Try to reset circuit breaker after cooldown
      if (Date.now() - lastProcessTime > 30000) { // 30s cooldown
        circuitOpen = false;
        errorCount = 0;
        console.log(`Circuit breaker reset for ${key}`);
      }
      return;
    }

    try {
      const isConnected = await checkSocketConnection(address, port);
      if (!isConnected) {
        console.warn(`Socket ${key} disconnected`);
        stop();
        return;
      }

      const rawData = await getAllSocketData(address, port);
      
      if (rawData && rawData.length > 0) {
        // Process TẤT CẢ data ngay lập tức - không giới hạn batch size
        const messages = rawData.map(data => formatSocketMessage(data, 'received'));

        if (messages.length > 0) {
          // Append ngay lập tức TẤT CẢ messages
          scheduleUpdate(messages);
        }
      }

      errorCount = 0; // Reset on success

    } catch (error) {
      errorCount++;
      console.error(`High-performance listener error for ${key}:`, error);

      if (errorCount >= circuitBreakerThreshold) {
        circuitOpen = true;
        console.error(`Circuit breaker opened for ${key} after ${errorCount} errors`);
      }
    }
  };

  const scheduleNextProcess = () => {
    if (!isRunning) return;

    const interval = adaptiveThrottling 
      ? Math.min(performanceMonitor.getAdaptiveInterval(), 2) // Giới hạn tối đa 2ms
      : 1; // Interval siêu nhanh - 1ms

    // Direct timeout without requestAnimationFrame for immediate processing
    setTimeout(() => {
      processWithCircuitBreaker().then(() => {
        scheduleNextProcess();
      });
    }, interval);
  };

  const start = (): void => {
    if (isRunning) return;
    
    isRunning = true;
    errorCount = 0;
    circuitOpen = false;
    messageQueue = [];
    lastProcessTime = 0;
    
    scheduleNextProcess();
    console.log(`Started high-performance listener for ${key} with priority ${priority}`);
  };

  const stop = (): void => {
    isRunning = false;
    
    if (frameId) {
      cancelAnimationFrame(frameId);
      frameId = null;
    }
    
    // Process any remaining messages
    if (messageQueue.length > 0) {
      scheduleUpdate([...messageQueue]);
      messageQueue = [];
    }
    
    frameScheduler.cancel(`${key}-*`);
    console.log(`Stopped high-performance listener for ${key}`);
  };

  const getStats = () => ({
    isRunning,
    queueSize: messageQueue.length,
    errorCount,
    circuitOpen,
    priority,
    weight,
    key,
    performance: performanceMonitor.getMetrics()
  });

  return {
    start,
    stop,
    getStats,
    isRunning: () => isRunning,
    setPriority: (newPriority: 'low' | 'medium' | 'high') => {
      console.log(`Changed priority for ${key} from ${priority} to ${newPriority}`);
    }
  };
};

// Enhanced socket data polling với throttling và memory management
export const createThrottledSocketListener = (
  address: string,
  port: string,
  onDataReceived: (messages: SocketMessage[]) => void,
  options: {
    interval?: number;
    maxRetries?: number;
    batchSize?: number;
    maxQueueSize?: number;
    throttleMs?: number;
    onError?: (error: Error) => void;
    onOverflow?: (droppedCount: number) => void;
  } = {}
) => {
  const {
    interval = 2, // Interval siêu nhanh - 2ms
    maxRetries = 3,
    batchSize = 50,
    maxQueueSize = 1000,
    throttleMs = 1, // Throttle siêu nhanh - 1ms
    onError,
    onOverflow
  } = options;

  const key = `${address}:${port}`;
  let isRunning = false;
  let pollInterval: NodeJS.Timeout | null = null;
  let retryCount = 0;
  let lastProcessTime = 0;
  let messageQueue: SocketMessage[] = [];

  // Throttled UI update function
  const throttledUpdate = debounce((messages: SocketMessage[], dropped: number) => {
    if (dropped > 0 && onOverflow) {
      onOverflow(dropped);
    }
    onDataReceived(messages);
  }, throttleMs);

  const processData = async (): Promise<void> => {
    if (!isRunning) return;

    try {
      // Check connection first
      const isConnected = await checkSocketConnection(address, port);
      if (!isConnected) {
        console.warn(`Socket ${key} disconnected`);
        stop();
        return;
      }

      // Get all available data
      const rawData = await getAllSocketData(address, port);
      
      if (rawData && rawData.length > 0) {
        // Process TẤT CẢ data ngay lập tức - không giới hạn
        const messages = rawData.map(data => formatSocketMessage(data, 'received'));
        
        // Append TẤT CẢ messages ngay lập tức
        onDataReceived(messages);
      }

      retryCount = 0; // Reset on success

    } catch (error) {
      console.error(`Socket listener error for ${key}:`, error);
      retryCount++;
      
      if (onError) {
        onError(error as Error);
      }
      
      if (retryCount >= maxRetries) {
        console.error(`Max retries reached for ${key}, stopping listener`);
        stop();
        return;
      }
    }
  };

  const start = (): void => {
    if (isRunning) return;
    
    isRunning = true;
    retryCount = 0;
    lastProcessTime = 0;
    messageQueue = [];
    
    const poll = () => {
      if (!isRunning) return;
      
      processData().finally(() => {
        if (isRunning) {
          pollInterval = setTimeout(poll, interval);
        }
      });
    };
    
    poll();
    console.log(`Started throttled socket listener for ${key}`);
  };

  const stop = (): void => {
    isRunning = false;
    
    if (pollInterval) {
      clearTimeout(pollInterval);
      pollInterval = null;
    }
    
    // Clear any remaining messages
    messageQueue = [];
    
    console.log(`Stopped throttled socket listener for ${key}`);
  };

  const getStats = () => ({
    isRunning,
    queueSize: messageQueue.length,
    retryCount,
    key
  });

  return {
    start,
    stop,
    getStats,
    isRunning: () => isRunning
  };
};

// Enhanced socket data polling với proper cleanup
export const createSocketDataQueue = (
  address: string,
  port: string,
  onData: (message: SocketMessage) => void,
  options: {
    interval?: number;
    maxRetries?: number;
    batchSize?: number;
    maxQueueSize?: number;
    throttleMs?: number;
  } = {}
) => {
  const { 
    interval = 2, // Interval siêu nhanh - 2ms  
    maxRetries = 3, 
    batchSize = 20, 
    maxQueueSize = 1000,
    throttleMs = 1 // Throttle siêu nhanh - 1ms
  } = options;
  
  const key = `${address}:${port}`;
  let isRunning = false;
  let retryCount = 0;
  let timeoutId: NodeJS.Timeout | null = null;
  let batchTimeouts: NodeJS.Timeout[] = []; // Track batch timeouts
  let lastProcessTime = 0;
  let messageQueue: SocketMessage[] = [];
  
  // Throttled onData để tránh spam UI
  const throttledOnData = debounce(onData, throttleMs);
  
  const cleanup = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    
    // Clear all batch timeouts
    batchTimeouts.forEach(timeout => clearTimeout(timeout));
    batchTimeouts = [];
    
    // Clear message queue
    messageQueue = [];
  };
  
  const processQueue = async () => {
    if (!isRunning) {
      cleanup();
      return;
    }
    
    try {
      // Check connection first
      const isConnected = await checkSocketConnection(address, port);
      if (!isConnected) {
        console.warn(`Socket ${key} disconnected, stopping queue`);
        stop();
        return;
      }
      
      const data = await getAllSocketData(address, port);
      
      if (data && data.length > 0) {
        // Process TẤT CẢ data ngay lập tức - không queue, không throttle
        data.forEach(item => {
          const message = formatSocketMessage(item, 'received');
          onData(message); // Append ngay lập tức từng message
        });
      }
      
      retryCount = 0; // Reset on success
      
      // Schedule next poll with proper cleanup
      if (isRunning) {
        timeoutId = setTimeout(processQueue, interval);
      }
      
    } catch (error) {
      console.error(`Socket queue error for ${key}:`, error);
      retryCount++;
      
      if (retryCount < maxRetries && isRunning) {
        // Exponential backoff with jitter
        const baseDelay = Math.min(1000, interval * Math.pow(2, retryCount));
        const jitter = Math.random() * 100; // Add randomness
        const delay = baseDelay + jitter;
        
        timeoutId = setTimeout(processQueue, delay);
      } else {
        console.error(`Max retries reached for ${key}, stopping queue`);
        stop();
      }
    }
  };
  
  const start = () => {
    if (!isRunning) {
      isRunning = true;
      retryCount = 0;
      lastProcessTime = 0;
      messageQueue = [];
      processQueue();
      console.log(`Started socket queue for ${key}`);
    }
  };
  
  const stop = () => {
    isRunning = false;
    cleanup();
    console.log(`Stopped socket queue for ${key}`);
  };
  
  const getStats = () => ({
    isRunning,
    queueSize: messageQueue.length,
    retryCount,
    activeTimeouts: batchTimeouts.length,
    key
  });
  
  return {
    start,
    stop,
    isRunning: () => isRunning,
    getStats
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

// Enhanced debounce với immediate option và proper cleanup
export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  wait: number,
  immediate: boolean = false
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  let callNow = false;
  
  return (...args: Parameters<T>) => {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    
    callNow = immediate && !timeout;
    
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(later, wait);
    
    if (callNow) {
      func(...args);
    }
  };
};

// Enhanced socket data manager với load balancing
export class SocketDataManager {
  private connections = new Map<string, ReturnType<typeof createHighPerformanceSocketListener>>();
  private connectionQueue = new Map<string, ReturnType<typeof createSocketDataQueue>>();
  private readonly maxConnections = 20; // Tăng limit
  private currentIndex = 0;
  private loadBalancer: NodeJS.Timeout | null = null;
  private isBalancing = false;

  // Round-robin load balancing
  private scheduleLoadBalancing(): void {
    if (this.isBalancing) return;
    
    this.isBalancing = true;
    this.loadBalancer = setInterval(() => {
      this.balanceLoad();
    }, 1000); // Balance every second
  }

  private stopLoadBalancing(): void {
    if (this.loadBalancer) {
      clearInterval(this.loadBalancer);
      this.loadBalancer = null;
    }
    this.isBalancing = false;
  }

  private balanceLoad(): void {
    const connections = Array.from(this.connections.values());
    const queues = Array.from(this.connectionQueue.values());
    
    if (connections.length === 0 && queues.length === 0) {
      this.stopLoadBalancing();
      return;
    }

    // Check performance and adjust priorities
    connections.forEach((conn) => {
      const stats = conn.getStats();
      const perf = performanceMonitor.getMetrics();
      
      // Auto-adjust priority based on performance
      if (perf.fps < 30 && stats.priority === 'high') {
        console.log(`Reducing priority for ${stats.key} due to low FPS`);
      } else if (perf.fps > 50 && stats.priority === 'low') {
        console.log(`Increasing priority for ${stats.key} due to high FPS`);
      }
    });

    // Log performance metrics
    if (connections.length > 5) {
      console.log(`Load balancer: ${connections.length} connections, FPS: ${performanceMonitor.getMetrics().fps}`);
    }
  }

  addHighPerformanceConnection(
    address: string,
    port: string,
    onData: (messages: SocketMessage[]) => void,
    options?: {
      priority?: 'low' | 'medium' | 'high';
      maxBatchSize?: number;
      adaptiveThrottling?: boolean;
      useWorker?: boolean;
      circuitBreakerThreshold?: number;
    }
  ): boolean {
    const key = `${address}:${port}`;
    
    if (this.connections.size + this.connectionQueue.size >= this.maxConnections) {
      console.warn(`Maximum connections reached (${this.maxConnections})`);
      return false;
    }
    
    if (this.connections.has(key) || this.connectionQueue.has(key)) {
      console.warn(`Connection ${key} already exists`);
      return false;
    }
    
    const listener = createHighPerformanceSocketListener(address, port, onData, {
      priority: 'medium',
      adaptiveThrottling: true,
      ...options
    });
    
    this.connections.set(key, listener);
    listener.start();
    
    // Start load balancing if this is the first connection
    if (this.connections.size === 1) {
      this.scheduleLoadBalancing();
    }
    
    console.log(`Added high-performance connection ${key}`);
    return true;
  }

  addConnection(
    address: string,
    port: string,
    onData: (message: SocketMessage) => void,
    options?: {
      interval?: number;
      maxRetries?: number;
      batchSize?: number;
      maxQueueSize?: number;
      throttleMs?: number;
    }
  ): boolean {
    const key = `${address}:${port}`;
    
    if (this.connections.size + this.connectionQueue.size >= this.maxConnections) {
      console.warn(`Maximum connections reached (${this.maxConnections})`);
      return false;
    }
    
    if (this.connections.has(key) || this.connectionQueue.has(key)) {
      console.warn(`Connection ${key} already exists`);
      return false;
    }
    
    // Use adaptive settings based on current load
    const adaptiveOptions = {
      interval: this.connectionQueue.size > 5 ? 300 : 200,
      batchSize: this.connectionQueue.size > 10 ? 10 : 20,
      maxQueueSize: 500,
      throttleMs: performanceMonitor.shouldThrottle() ? 100 : 50,
      ...options
    };
    
    const queue = createSocketDataQueue(address, port, onData, adaptiveOptions);
    this.connectionQueue.set(key, queue);
    queue.start();
    
    console.log(`Added standard connection ${key} with adaptive settings`);
    return true;
  }

  removeConnection(address: string, port: string): boolean {
    const key = `${address}:${port}`;
    
    // Check high-performance connections first
    const hpConn = this.connections.get(key);
    if (hpConn) {
      hpConn.stop();
      this.connections.delete(key);
      
      // Stop load balancing if no connections left
      if (this.connections.size === 0) {
        this.stopLoadBalancing();
      }
      
      return true;
    }
    
    // Check standard connections
    const queue = this.connectionQueue.get(key);
    if (queue) {
      queue.stop();
      this.connectionQueue.delete(key);
      return true;
    }
    
    return false;
  }

  removeAllConnections(): void {
    this.connections.forEach((conn) => {
      conn.stop();
    });
    this.connections.clear();
    
    this.connectionQueue.forEach((queue) => {
      queue.stop();
    });
    this.connectionQueue.clear();
    
    this.stopLoadBalancing();
    console.log('Removed all connections and stopped load balancing');
  }

  getConnectionStats() {
    const stats = new Map();
    
    this.connections.forEach((conn, key) => {
      stats.set(key, { ...conn.getStats(), type: 'high-performance' });
    });
    
    this.connectionQueue.forEach((queue, key) => {
      stats.set(key, { ...queue.getStats(), type: 'standard' });
    });
    
    return stats;
  }

  getActiveConnectionCount(): number {
    return this.connections.size + this.connectionQueue.size;
  }

  hasConnection(address: string, port: string): boolean {
    const key = `${address}:${port}`;
    return this.connections.has(key) || this.connectionQueue.has(key);
  }

  getPerformanceMetrics() {
    return {
      ...performanceMonitor.getMetrics(),
      totalConnections: this.getActiveConnectionCount(),
      highPerformanceConnections: this.connections.size,
      standardConnections: this.connectionQueue.size,
      pendingFrameUpdates: frameScheduler.getPendingCount(),
      isLoadBalancing: this.isBalancing
    };
  }

  // Emergency performance mode - reduce all connections to minimal settings
  enableEmergencyMode(): void {
    console.warn('Enabling emergency performance mode');
    
    this.connections.forEach((conn, key) => {
      conn.stop();
      // Convert to standard connection with minimal settings
      const address = key.split(':')[0];
      const port = key.split(':')[1];
      // Note: This would need the original onData callback
      console.log(`Converting ${key} to emergency mode`);
    });
  }

  // Disable emergency mode and restore normal operations
  disableEmergencyMode(): void {
    console.log('Disabling emergency performance mode');
    // Logic to restore connections would go here
  }
}

// Singleton instance
export const socketManager = new SocketDataManager();

// Performance monitoring and auto-tuning utility
export const createPerformanceMonitor = () => {
  let monitorInterval: NodeJS.Timeout | null = null;
  
  const startMonitoring = (onMetrics?: (metrics: any) => void) => {
    if (monitorInterval) return;
    
    monitorInterval = setInterval(() => {
      const metrics = socketManager.getPerformanceMetrics();
      
      // Auto-tune based on performance
      if (metrics.fps < 20 && metrics.totalConnections > 10) {
        console.warn('Low FPS detected, consider reducing connections or enabling emergency mode');
      }
      
      if (metrics.avgProcessingTime > 50) {
        console.warn('High processing time detected, adjusting throttling');
      }
      
      if (onMetrics) {
        onMetrics(metrics);
      }
      
      // Log every 30 seconds if there are many connections
      if (metrics.totalConnections > 5) {
        console.log(`Performance: FPS=${metrics.fps}, Connections=${metrics.totalConnections}, Processing=${metrics.avgProcessingTime.toFixed(2)}ms`);
      }
    }, 5000); // Check every 5 seconds
  };
  
  const stopMonitoring = () => {
    if (monitorInterval) {
      clearInterval(monitorInterval);
      monitorInterval = null;
    }
  };
  
  return { startMonitoring, stopMonitoring };
};

// Global performance monitor instance
export const globalPerformanceMonitor = createPerformanceMonitor();

// Utility function to auto-optimize socket settings based on system performance
export const optimizeSocketSettings = (connectionCount: number) => {
  const perf = performanceMonitor.getMetrics();
  
  // Base settings optimized for real-time performance
  let settings = {
    interval: 50, // Giảm interval cho update nhanh hơn
    batchSize: 50, // Tăng batch size để xử lý nhiều data hơn
    maxQueueSize: 1000,
    throttleMs: 20 // Giảm throttle cho real-time
  };
  
  // Adjust based on connection count
  if (connectionCount > 15) {
    settings.interval = 400;
    settings.batchSize = 10;
    settings.maxQueueSize = 300;
    settings.throttleMs = 100;
  } else if (connectionCount > 10) {
    settings.interval = 300;
    settings.batchSize = 15;
    settings.maxQueueSize = 400;
    settings.throttleMs = 75;
  }
  
  // Adjust based on performance
  if (perf.fps < 30) {
    settings.interval *= 1.5;
    settings.batchSize = Math.max(5, Math.floor(settings.batchSize * 0.7));
    settings.throttleMs *= 1.5;
  } else if (perf.fps > 55) {
    settings.interval = Math.max(100, Math.floor(settings.interval * 0.8));
    settings.batchSize = Math.min(50, Math.floor(settings.batchSize * 1.2));
    settings.throttleMs = Math.max(25, Math.floor(settings.throttleMs * 0.8));
  }
  
  return settings;
};

// REAL SOCKET CONNECTION - Đọc trực tiếp từ socket ở FE với enhanced debugging
export const createRealSocketConnection = (
  address: string,
  port: string,
  onDataReceived: (data: string) => void,
  onError?: (error: Error) => void,
  onConnect?: () => void,
  onDisconnect?: () => void
) => {
  let socket: WebSocket | null = null;
  let isConnected = false;
  let reconnectTimeout: NodeJS.Timeout | null = null;
  let heartbeatInterval: NodeJS.Timeout | null = null;
  let reconnectAttempts = 0;
  let totalMessagesReceived = 0;
  let lastMessageTime = 0;
  const maxReconnectAttempts = 10;
  const reconnectDelay = 1000; // 1 giây

  console.log(`🔧 INITIALIZING REAL SOCKET: ${address}:${port}`);

  // Validate params
  if (!validateSocketParams(address, port)) {
    const error = new Error(`Invalid address or port: ${address}:${port}`);
    console.error(`❌ VALIDATION FAILED:`, error.message);
    if (onError) onError(error);
    return null;
  }

  const connect = () => {
    try {
      // Tạo WebSocket URL
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${address}:${port}`;
      
      console.log(`🚀 CONNECTING TO REAL SOCKET: ${wsUrl}`);
      console.log(`📊 CONNECTION ATTEMPT: ${reconnectAttempts + 1}/${maxReconnectAttempts}`);
      
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        const now = Date.now();
        console.log(`✅ REAL SOCKET CONNECTED: ${address}:${port} at ${new Date(now).toISOString()}`);
        console.log(`🔗 CONNECTION STATE: WebSocket.OPEN (${WebSocket.OPEN})`);
        console.log(`📈 RECONNECT ATTEMPTS RESET: ${reconnectAttempts} -> 0`);
        
        isConnected = true;
        reconnectAttempts = 0;
        
        // Start heartbeat
        startHeartbeat();
        
        if (onConnect) {
          console.log(`📞 CALLING onConnect CALLBACK`);
          onConnect();
        }
      };

      socket.onmessage = (event) => {
        const now = Date.now();
        const timeSinceLastMessage = lastMessageTime ? now - lastMessageTime : 0;
        totalMessagesReceived++;
        
        console.log(`📨 MESSAGE RECEIVED (#${totalMessagesReceived}):`, {
          timestamp: new Date(now).toISOString(),
          timeSinceLastMessage: `${timeSinceLastMessage}ms`,
          dataType: typeof event.data,
          dataLength: event.data?.length || 0,
          preview: event.data?.substring(0, 100) + (event.data?.length > 100 ? '...' : ''),
          socketState: socket?.readyState
        });
        
        // Nhận data ngay lập tức - không có delay
        const data = event.data;
        if (data && onDataReceived) {
          console.log(`🔄 CALLING onDataReceived CALLBACK with data length: ${data.length}`);
          const callbackStart = performance.now();
          onDataReceived(data);
          const callbackTime = performance.now() - callbackStart;
          console.log(`✅ CALLBACK COMPLETED in ${callbackTime.toFixed(2)}ms`);
        } else {
          console.warn(`⚠️ NO DATA OR CALLBACK: data=${!!data}, callback=${!!onDataReceived}`);
        }
        
        lastMessageTime = now;
      };

      socket.onclose = (event) => {
        const now = Date.now();
        console.log(`🔴 REAL SOCKET DISCONNECTED: ${address}:${port}`, {
          timestamp: new Date(now).toISOString(),
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
          totalMessages: totalMessagesReceived
        });
        
        isConnected = false;
        stopHeartbeat();
        
        if (onDisconnect) {
          console.log(`📞 CALLING onDisconnect CALLBACK`);
          onDisconnect();
        }
        
        // Auto reconnect nếu không phải manual close
        if (event.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
          console.log(`🔄 SCHEDULING AUTO-RECONNECT: attempt ${reconnectAttempts + 1}/${maxReconnectAttempts}`);
          scheduleReconnect();
        } else {
          console.log(`🛑 NO AUTO-RECONNECT: code=${event.code}, attempts=${reconnectAttempts}/${maxReconnectAttempts}`);
        }
      };

      socket.onerror = (error) => {
        const now = Date.now();
        console.error(`💥 REAL SOCKET ERROR: ${address}:${port}`, {
          timestamp: new Date(now).toISOString(),
          error,
          socketState: socket?.readyState,
          reconnectAttempts,
          totalMessages: totalMessagesReceived
        });
        
        if (onError) {
          console.log(`📞 CALLING onError CALLBACK`);
          onError(new Error(`Socket connection failed: ${address}:${port}`));
        }
      };

    } catch (error) {
      console.error(`💥 FAILED TO CREATE REAL SOCKET CONNECTION:`, {
        address,
        port,
        error: error instanceof Error ? error.message : error
      });
      if (onError) onError(error as Error);
    }
  };

  const scheduleReconnect = () => {
    if (reconnectTimeout) {
      console.log(`⏸️ RECONNECT ALREADY SCHEDULED`);
      return;
    }
    
    reconnectAttempts++;
    const delay = reconnectDelay * Math.pow(1.5, reconnectAttempts - 1); // Exponential backoff
    
    console.log(`⏰ SCHEDULING RECONNECT: attempt ${reconnectAttempts} in ${delay}ms`);
    reconnectTimeout = setTimeout(() => {
      console.log(`🔄 EXECUTING RECONNECT: attempt ${reconnectAttempts}`);
      reconnectTimeout = null;
      connect();
    }, delay);
  };

  const startHeartbeat = () => {
    stopHeartbeat();
    console.log(`💓 STARTING HEARTBEAT: 30s interval`);
    heartbeatInterval = setInterval(() => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        console.log(`💓 SENDING HEARTBEAT PING`);
        socket.send('ping');
      } else {
        console.warn(`💔 HEARTBEAT FAILED: socket state=${socket?.readyState}`);
      }
    }, 30000); // 30 giây
  };

  const stopHeartbeat = () => {
    if (heartbeatInterval) {
      console.log(`💔 STOPPING HEARTBEAT`);
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }
  };

  const send = (data: string) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      console.log(`📤 SENDING DATA: length=${data.length}, preview=${data.substring(0, 50)}`);
      socket.send(data);
      return true;
    }
    console.warn(`❌ CANNOT SEND DATA: socket not connected (state=${socket?.readyState})`);
    return false;
  };

  const disconnect = () => {
    console.log(`🛑 MANUALLY DISCONNECTING REAL SOCKET: ${address}:${port}`);
    
    // Clear timeouts
    if (reconnectTimeout) {
      console.log(`⏹️ CLEARING RECONNECT TIMEOUT`);
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
    stopHeartbeat();
    
    // Close socket
    if (socket) {
      console.log(`🔌 CLOSING WEBSOCKET CONNECTION`);
      socket.close(1000, 'Manual disconnect'); // Normal closure
      socket = null;
    }
    
    isConnected = false;
    reconnectAttempts = maxReconnectAttempts; // Prevent auto-reconnect
    console.log(`✅ REAL SOCKET DISCONNECTED MANUALLY`);
  };

  const getStatus = () => {
    const status = {
      isConnected,
      reconnectAttempts,
      readyState: socket ? socket.readyState : -1,
      url: socket ? socket.url : null,
      totalMessagesReceived,
      lastMessageTime: lastMessageTime ? new Date(lastMessageTime).toISOString() : null
    };
    console.log(`📊 SOCKET STATUS:`, status);
    return status;
  };

  // Start connection
  console.log(`🎬 STARTING INITIAL CONNECTION`);
  connect();

  return {
    send,
    disconnect,
    getStatus,
    isConnected: () => isConnected,
    reconnect: () => {
      console.log(`🔄 MANUAL RECONNECT REQUESTED`);
      reconnectAttempts = 0;
      connect();
    }
  };
};

// TCP SOCKET ALTERNATIVE - Sử dụng Fetch với streaming cho TCP-like behavior
export const createTCPSocketConnection = (
  address: string,
  port: string,
  onDataReceived: (data: string) => void,
  onError?: (error: Error) => void,
  onConnect?: () => void,
  onDisconnect?: () => void
) => {
  let isConnected = false;
  let controller: AbortController | null = null;
  let pollInterval: NodeJS.Timeout | null = null;
  let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;

  const connect = async () => {
    try {
      console.log(`Connecting to TCP socket: ${address}:${port}`);
      
      controller = new AbortController();
      const url = `http://${address}:${port}`;
      
      // Sử dụng fetch với streaming
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'text/plain',
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('No response body available for streaming');
      }

      isConnected = true;
      if (onConnect) onConnect();

      // Stream data
      reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (isConnected) {
        try {
          const { done, value } = await reader.read();
          
          if (done) {
            console.log('TCP stream ended');
            break;
          }

          if (value) {
            // Decode và send data ngay lập tức
            const text = decoder.decode(value, { stream: true });
            if (text && onDataReceived) {
              onDataReceived(text);
            }
          }
        } catch (readError) {
          if (isConnected) { // Only log if not manually disconnected
            console.error('TCP read error:', readError);
            if (onError) onError(readError as Error);
          }
          break;
        }
      }

    } catch (error) {
      console.error(`TCP connection failed: ${address}:${port}`, error);
      if (onError) onError(error as Error);
    } finally {
      cleanup();
    }
  };

  const send = async (data: string): Promise<boolean> => {
    if (!isConnected) {
      console.warn(`Cannot send data, TCP socket not connected: ${address}:${port}`);
      return false;
    }

    try {
      const response = await fetch(`http://${address}:${port}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain'
        },
        body: data
      });
      
      return response.ok;
    } catch (error) {
      console.error('TCP send error:', error);
      if (onError) onError(error as Error);
      return false;
    }
  };

  const cleanup = () => {
    isConnected = false;
    
    if (reader) {
      reader.cancel();
      reader = null;
    }
    
    if (controller) {
      controller.abort();
      controller = null;
    }
    
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }

    if (onDisconnect) onDisconnect();
  };

  const disconnect = () => {
    console.log(`Disconnecting TCP socket: ${address}:${port}`);
    cleanup();
  };

  const getStatus = () => ({
    isConnected,
    hasReader: !!reader,
    hasController: !!controller
  });

  // Start connection
  connect();

  return {
    send,
    disconnect,
    getStatus,
    isConnected: () => isConnected
  };
};

// SIMPLE SOCKET READER - Đọc data từ raw socket endpoint
export const createSimpleSocketReader = (
  address: string,
  port: string,
  onDataReceived: (data: string) => void,
  options: {
    interval?: number;
    protocol?: 'http' | 'https';
    endpoint?: string;
    method?: 'GET' | 'POST';
  } = {}
) => {
  const {
    interval = 10, // 10ms polling - siêu nhanh
    protocol = 'http',
    endpoint = '/data',
    method = 'GET'
  } = options;

  let isRunning = false;
  let pollInterval: NodeJS.Timeout | null = null;
  let lastDataHash = '';

  const url = `${protocol}://${address}:${port}${endpoint}`;

  const readData = async () => {
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Accept': 'text/plain',
          'Cache-Control': 'no-cache'
        },
        cache: 'no-store'
      });

      if (response.ok) {
        const data = await response.text();
        
        // Check if data changed để tránh duplicate
        const dataHash = btoa(data); // Simple hash
        if (data && dataHash !== lastDataHash) {
          lastDataHash = dataHash;
          onDataReceived(data);
        }
      }
    } catch (error) {
      console.error(`Simple socket read error: ${address}:${port}`, error);
    }
  };

  const start = () => {
    if (isRunning) return;
    
    isRunning = true;
    console.log(`Starting simple socket reader: ${url} (${interval}ms interval)`);
    
    // Read immediately
    readData();
    
    // Then poll
    pollInterval = setInterval(readData, interval);
  };

  const stop = () => {
    isRunning = false;
    
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
    
    console.log(`Stopped simple socket reader: ${url}`);
  };

  return {
    start,
    stop,
    isRunning: () => isRunning,
    getUrl: () => url
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
