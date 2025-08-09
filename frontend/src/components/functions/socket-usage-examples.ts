/*
 * Socket Usage Examples - High Performance Multi-Socket Management
 * 
 * Các ví dụ về cách sử dụng socket system mới để đảm bảo performance tốt nhất
 * khi có nhiều socket connections và data bắn liên tục
 */

import { 
  socketManager, 
  createHighPerformanceSocketListener,
  globalPerformanceMonitor,
  optimizeSocketSettings,
  SocketMessage 
} from './socket';

// ========================================
// 1. BASIC USAGE - Single Socket
// ========================================

export const basicSocketExample = () => {
  const address = "192.168.1.100";
  const port = "8080";

  // High-performance listener for single socket with heavy traffic
  const listener = createHighPerformanceSocketListener(
    address,
    port,
    (messages: SocketMessage[]) => {
      console.log(`Received ${messages.length} messages`);
      // Process messages here
      messages.forEach(msg => {
        // Handle each message
        console.log(`Data: ${msg.data}`);
      });
    },
    {
      priority: 'high',
      maxBatchSize: 100,
      adaptiveThrottling: true,
      circuitBreakerThreshold: 5
    }
  );

  // Start listening
  listener.start();

  // Cleanup when component unmounts
  return () => {
    listener.stop();
  };
};

// ========================================
// 2. MULTI-SOCKET MANAGEMENT - Using Socket Manager
// ========================================

export const multiSocketExample = () => {
  // Start performance monitoring
  globalPerformanceMonitor.startMonitoring((metrics) => {
    console.log('Performance Metrics:', metrics);
    
    // Auto-adjust if performance drops
    if (metrics.fps < 30) {
      console.warn('Low FPS detected, reducing socket load');
      // Could implement auto-scaling here
    }
  });

  // Add multiple high-performance connections
  const sockets = [
    { address: "192.168.1.100", port: "8080", priority: 'high' as const },
    { address: "192.168.1.101", port: "8081", priority: 'medium' as const },
    { address: "192.168.1.102", port: "8082", priority: 'low' as const },
  ];

  sockets.forEach(({ address, port, priority }) => {
    socketManager.addHighPerformanceConnection(
      address,
      port,
      (messages: SocketMessage[]) => {
        console.log(`${address}:${port} received ${messages.length} messages`);
        // Process messages based on priority
        if (priority === 'high') {
          // Process immediately
          processHighPriorityMessages(messages);
        } else {
          // Queue for later processing
          queueLowPriorityMessages(messages);
        }
      },
      {
        priority,
        adaptiveThrottling: true,
        maxBatchSize: priority === 'high' ? 200 : 50
      }
    );
  });

  // Monitor and log performance
  const statsInterval = setInterval(() => {
    const stats = socketManager.getConnectionStats();
    console.log(`Active connections: ${socketManager.getActiveConnectionCount()}`);
    stats.forEach((stat, key) => {
      console.log(`${key}: ${stat.type}, running: ${stat.isRunning}, queue: ${stat.queueSize}`);
    });
  }, 10000); // Every 10 seconds

  // Cleanup function
  return () => {
    clearInterval(statsInterval);
    socketManager.removeAllConnections();
    globalPerformanceMonitor.stopMonitoring();
  };
};

// ========================================
// 3. ADAPTIVE PERFORMANCE - Auto-tuning
// ========================================

export const adaptivePerformanceExample = () => {
  const connectionCount = 15; // Many connections
  
  // Get optimized settings based on current load
  const optimizedSettings = optimizeSocketSettings(connectionCount);
  console.log('Optimized settings:', optimizedSettings);

  // Add connections with adaptive settings
  for (let i = 0; i < connectionCount; i++) {
    const address = `192.168.1.${100 + i}`;
    const port = `${8080 + i}`;
    
    socketManager.addConnection(
      address,
      port,
      (message: SocketMessage) => {
        // Handle individual message
        processMessage(message, i);
      },
      optimizedSettings // Use optimized settings
    );
  }

  // Monitor performance and auto-adjust
  const performanceMonitor = setInterval(() => {
    const metrics = socketManager.getPerformanceMetrics();
    
    if (metrics.fps < 20) {
      console.warn('Critical performance issue, enabling emergency mode');
      socketManager.enableEmergencyMode();
    } else if (metrics.fps > 50 && metrics.totalConnections < 10) {
      console.log('Good performance, could handle more connections');
    }
  }, 2000);

  return () => {
    clearInterval(performanceMonitor);
    socketManager.removeAllConnections();
  };
};

// ========================================
// 4. REAL-TIME DASHBOARD EXAMPLE
// ========================================

export const realtimeDashboardExample = () => {
  // For real-time dashboard with many data sources
  const dashboardSockets = [
    { address: "192.168.1.100", port: "8080", name: "CPU_METRICS" },
    { address: "192.168.1.100", port: "8081", name: "MEMORY_METRICS" },
    { address: "192.168.1.100", port: "8082", name: "NETWORK_METRICS" },
    { address: "192.168.1.100", port: "8083", name: "DISK_METRICS" },
    { address: "192.168.1.101", port: "8080", name: "APPLICATION_LOGS" },
  ];

  // Message buffers for different data types
  const messageBuffers = new Map<string, SocketMessage[]>();

  dashboardSockets.forEach(({ address, port, name }) => {
    messageBuffers.set(name, []);
    
    socketManager.addHighPerformanceConnection(
      address,
      port,
      (messages: SocketMessage[]) => {
        const buffer = messageBuffers.get(name) || [];
        
        // Add new messages
        buffer.push(...messages);
        
        // Keep only last 1000 messages for memory efficiency
        if (buffer.length > 1000) {
          buffer.splice(0, buffer.length - 1000);
        }
        
        messageBuffers.set(name, buffer);
        
        // Update UI component for this data type
        updateDashboardComponent(name, buffer);
      },
      {
        priority: name.includes('METRICS') ? 'high' : 'medium',
        adaptiveThrottling: true,
        maxBatchSize: 150
      }
    );
  });

  // Periodic UI updates to prevent overwhelming the interface
  const uiUpdateInterval = setInterval(() => {
    // Batch update all dashboard components
    messageBuffers.forEach((buffer, name) => {
      if (buffer.length > 0) {
        // Process latest data for UI
        const latestData = buffer.slice(-10); // Last 10 messages
        updateDashboardSummary(name, latestData);
      }
    });
  }, 1000); // Update every second

  return () => {
    clearInterval(uiUpdateInterval);
    socketManager.removeAllConnections();
    messageBuffers.clear();
  };
};

// ========================================
// 5. ERROR HANDLING & RECOVERY
// ========================================

export const errorHandlingExample = () => {
  const listener = createHighPerformanceSocketListener(
    "192.168.1.100",
    "8080",
    (messages: SocketMessage[]) => {
      try {
        processMessages(messages);
      } catch (error) {
        console.error('Message processing error:', error);
        // Handle processing errors gracefully
      }
    },
    {
      priority: 'high',
      circuitBreakerThreshold: 3, // Open circuit after 3 failures
      adaptiveThrottling: true
    }
  );

  // Monitor connection health
  const healthCheck = setInterval(() => {
    const stats = listener.getStats();
    
    if (stats.circuitOpen) {
      console.warn('Circuit breaker is open, connection experiencing issues');
      // Could implement fallback data source here
    }
    
    if (stats.errorCount > 0) {
      console.warn(`Connection has ${stats.errorCount} recent errors`);
    }
  }, 5000);

  listener.start();

  return () => {
    clearInterval(healthCheck);
    listener.stop();
  };
};

// ========================================
// HELPER FUNCTIONS
// ========================================

const processHighPriorityMessages = (messages: SocketMessage[]) => {
  // Immediate processing for critical data
  messages.forEach(msg => {
    // Handle critical messages
  });
};

const queueLowPriorityMessages = (messages: SocketMessage[]) => {
  // Queue for batch processing later
  setTimeout(() => {
    messages.forEach(msg => {
      // Handle non-critical messages
    });
  }, 100);
};

const processMessage = (message: SocketMessage, connectionId: number) => {
  // Process individual message
  console.log(`Connection ${connectionId}: ${message.data}`);
};

const processMessages = (messages: SocketMessage[]) => {
  // Batch process messages
  messages.forEach(msg => {
    // Process each message
  });
};

const updateDashboardComponent = (componentName: string, data: SocketMessage[]) => {
  // Update specific dashboard component
  console.log(`Updating ${componentName} with ${data.length} new messages`);
};

const updateDashboardSummary = (componentName: string, latestData: SocketMessage[]) => {
  // Update dashboard summary
  console.log(`Summary update for ${componentName}: ${latestData.length} latest messages`);
};

// ========================================
// USAGE IN REACT COMPONENT
// ========================================

/*
// Example React hook
export const useMultiSocket = (socketConfigs: Array<{address: string, port: string, priority?: 'low' | 'medium' | 'high'}>) => {
  const [messages, setMessages] = useState<Map<string, SocketMessage[]>>(new Map());
  
  useEffect(() => {
    // Start performance monitoring
    globalPerformanceMonitor.startMonitoring();
    
    // Add all socket connections
    socketConfigs.forEach(({ address, port, priority = 'medium' }) => {
      socketManager.addHighPerformanceConnection(
        address,
        port,
        (newMessages) => {
          const key = `${address}:${port}`;
          setMessages(prev => {
            const updated = new Map(prev);
            const existing = updated.get(key) || [];
            updated.set(key, [...existing, ...newMessages].slice(-100)); // Keep last 100
            return updated;
          });
        },
        { priority, adaptiveThrottling: true }
      );
    });
    
    // Cleanup on unmount
    return () => {
      socketManager.removeAllConnections();
      globalPerformanceMonitor.stopMonitoring();
    };
  }, []);
  
  return {
    messages,
    performance: socketManager.getPerformanceMetrics(),
    connectionStats: socketManager.getConnectionStats()
  };
};
*/
