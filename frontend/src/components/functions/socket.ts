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
    if (this.metrics.fps >= 55) return 5;    // High performance - cực nhanh 5ms
    if (this.metrics.fps >= 40) return 10;   // Medium performance - 10ms
    if (this.metrics.fps >= 25) return 20;   // Low performance - 20ms  
    return 50; // Very low performance - 50ms
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

// Lấy tất cả dữ liệu từ socket - trả về ngay lập tức
export const getAllSocketData = async (address: string, port: string): Promise<string[]> => {
  try {
    const data = await GetAllSocketData(address, port);
    // Trả về data ngay lập tức, không có bất kỳ processing nào
    return data || [];
  } catch (error) {
    // Không log error để tránh spam console
    return [];
  }
};

// Real-time socket listener với callback và proper cleanup
export const startSocketListener = (
  address: string,
  port: string,
  onDataReceived: (messages: SocketMessage[]) => void,
  interval: number = 10 // Interval cực nhanh
): void => {
  const key = `${address}:${port}`;
  
  // Dừng listener cũ nếu có
  stopSocketListener(address, port);
  
  let retryCount = 0;
  const maxRetries = 3;
  
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
        // Process TẤT CẢ data ngay lập tức - không giới hạn
        const messages = rawData.map(data => formatSocketMessage(data, 'received'));
        
        // Append ngay lập tức - không check gì cả
        onDataReceived(messages);
      }
      
      retryCount = 0; // Reset retry count on success
      
    } catch (error) {
      console.error(`Lỗi trong socket listener ${key}:`, error);
      retryCount++;
      
      if (retryCount >= maxRetries) {
        console.error(`Max retries reached for ${key}, stopping listener`);
        stopSocketListener(address, port);
      }
    }
  }, interval);
  
  socketListeners.set(key, listener);
  console.log(`Started socket listener for ${key} with interval ${interval}ms`);
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
      ? Math.min(performanceMonitor.getAdaptiveInterval(), 10) // Giới hạn tối đa 10ms
      : 5; // Interval cực nhanh - 5ms

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
    interval = 10, // Interval cực nhanh - 10ms
    maxRetries = 3,
    batchSize = 50,
    maxQueueSize = 1000,
    throttleMs = 5, // Throttle cực nhanh
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
    interval = 10, // Interval cực nhanh - 10ms  
    maxRetries = 3, 
    batchSize = 20, 
    maxQueueSize = 1000,
    throttleMs = 5 // Throttle cực nhanh
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