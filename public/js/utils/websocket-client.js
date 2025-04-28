/**
 * WebSocket Client Utility
 * 
 * This utility provides a simple interface for connecting to the WebSocket server
 * and handling WebSocket events. It includes reconnection logic and event handling.
 */

class WebSocketClient {
  /**
   * Create a new WebSocketClient instance
   * @param {Object} options - Configuration options
   * @param {string} options.endpoint - WebSocket endpoint path (default: '/api/1/ws')
   * @param {number} options.reconnectInterval - Reconnection interval in milliseconds (default: 5000)
   * @param {number} options.maxReconnectAttempts - Maximum number of reconnection attempts (default: 5)
   */
  constructor(options = {}) {
    this.endpoint = options.endpoint || '';
    this.port = options.port || 8100;
    this.reconnectInterval = options.reconnectInterval || 5000;
    this.maxReconnectAttempts = options.maxReconnectAttempts || 5;
    
    this.socket = null;
    this.reconnectAttempts = 0;
    this.reconnectTimer = null;
    this.isConnecting = false;
    this.eventListeners = {
      message: [],
      open: [],
      close: [],
      error: [],
      reconnect: [],
      reconnectFailed: []
    };
    
    // Bind methods to this instance
    this.connect = this.connect.bind(this);
    this.disconnect = this.disconnect.bind(this);
    this.send = this.send.bind(this);
    this.on = this.on.bind(this);
    this.off = this.off.bind(this);
    this.handleOpen = this.handleOpen.bind(this);
    this.handleMessage = this.handleMessage.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.handleError = this.handleError.bind(this);
    this.attemptReconnect = this.attemptReconnect.bind(this);
  }
  
  /**
   * Connect to the WebSocket server
   * @param {boolean} autoReconnect - Whether to automatically reconnect on disconnect
   * @returns {Promise} - Resolves when connected, rejects on error
   */
  connect(autoReconnect = true) {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return Promise.resolve();
    }
    
    this.autoReconnect = autoReconnect;
    this.isConnecting = true;
    
    return new Promise((resolve, reject) => {
      try {
        // Get the current host
        const host = window.location.hostname;
        
        // Create the WebSocket URL
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProtocol}//${host}:${this.port}${this.endpoint}`;
        
        console.log(`Connecting to WebSocket server at ${wsUrl}`);
        
        // Create a new WebSocket connection
        this.socket = new WebSocket(wsUrl);
        
        // Set up event handlers
        this.socket.addEventListener('open', (event) => {
          this.handleOpen(event);
          resolve();
        });
        
        this.socket.addEventListener('message', this.handleMessage);
        this.socket.addEventListener('close', this.handleClose);
        this.socket.addEventListener('error', (event) => {
          this.handleError(event);
          if (this.isConnecting) {
            reject(new Error('Failed to connect to WebSocket server'));
            this.isConnecting = false;
          }
        });
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }
  
  /**
   * Disconnect from the WebSocket server
   */
  disconnect() {
    this.autoReconnect = false;
    this.clearReconnectTimer();
    
    if (this.socket) {
      this.socket.close();
    }
  }
  
  /**
   * Send a message to the WebSocket server
   * @param {string|Object} data - The data to send
   * @returns {boolean} - Whether the message was sent successfully
   */
  send(data) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.error('Cannot send message: WebSocket is not connected');
      return false;
    }
    
    try {
      // Convert objects to JSON strings
      const message = typeof data === 'object' ? JSON.stringify(data) : data;
      this.socket.send(message);
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }
  
  /**
   * Register an event listener
   * @param {string} event - The event name ('message', 'open', 'close', 'error', 'reconnect', 'reconnectFailed')
   * @param {Function} callback - The callback function
   */
  on(event, callback) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].push(callback);
    }
  }
  
  /**
   * Remove an event listener
   * @param {string} event - The event name
   * @param {Function} callback - The callback function to remove
   */
  off(event, callback) {
    if (this.eventListeners[event]) {
      this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
    }
  }
  
  /**
   * Handle WebSocket open event
   * @private
   */
  handleOpen(event) {
    console.log('WebSocket connection established');
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    
    // Trigger event listeners
    this.eventListeners.open.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in open event listener:', error);
      }
    });
  }
  
  /**
   * Handle WebSocket message event
   * @private
   */
  handleMessage(event) {
    let data = event.data;
    
    // Try to parse JSON data
    try {
      data = JSON.parse(event.data);
    } catch (error) {
      // Not JSON, use the raw data
    }
    
    // Trigger event listeners
    this.eventListeners.message.forEach(callback => {
      try {
        callback(data, event);
      } catch (error) {
        console.error('Error in message event listener:', error);
      }
    });
  }
  
  /**
   * Handle WebSocket close event
   * @private
   */
  handleClose(event) {
    console.log(`WebSocket connection closed: ${event.reason || 'Connection closed'}`);
    
    // Trigger event listeners
    this.eventListeners.close.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in close event listener:', error);
      }
    });
    
    // Attempt to reconnect if enabled
    if (this.autoReconnect) {
      this.attemptReconnect();
    }
  }
  
  /**
   * Handle WebSocket error event
   * @private
   */
  handleError(event) {
    console.error('WebSocket error:', event);
    
    // Trigger event listeners
    this.eventListeners.error.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in error event listener:', error);
      }
    });
  }
  
  /**
   * Attempt to reconnect to the WebSocket server
   * @private
   */
  attemptReconnect() {
    this.clearReconnectTimer();
    
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log(`Maximum reconnection attempts (${this.maxReconnectAttempts}) reached`);
      
      // Trigger reconnect failed event
      this.eventListeners.reconnectFailed.forEach(callback => {
        try {
          callback();
        } catch (error) {
          console.error('Error in reconnectFailed event listener:', error);
        }
      });
      
      return;
    }
    
    this.reconnectAttempts++;
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    
    // Trigger reconnect event
    this.eventListeners.reconnect.forEach(callback => {
      try {
        callback(this.reconnectAttempts);
      } catch (error) {
        console.error('Error in reconnect event listener:', error);
      }
    });
    
    // Set a timer to reconnect
    this.reconnectTimer = setTimeout(() => {
      this.connect(true).catch(error => {
        console.error('Reconnection failed:', error);
      });
    }, this.reconnectInterval);
  }
  
  /**
   * Clear the reconnect timer
   * @private
   */
  clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
  
  /**
   * Check if the WebSocket is connected
   * @returns {boolean} - Whether the WebSocket is connected
   */
  isConnected() {
    return this.socket && this.socket.readyState === WebSocket.OPEN;
  }
}

// Export the WebSocketClient class
export default WebSocketClient;