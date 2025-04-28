import { BaseComponent } from './base-component.js';
import WebSocketClient from '../utils/websocket-client.js';

/**
 * WebSocket Example Component
 * 
 * This component demonstrates how to use the WebSocketClient utility
 * to establish a WebSocket connection and exchange messages with the server.
 */
class WebSocketExample extends BaseComponent {
  constructor() {
    super();
    
    // Initialize WebSocketClient
    this.wsClient = new WebSocketClient({
      port: 8100,
      endpoint: '',
      reconnectInterval: 3000,
      maxReconnectAttempts: 3
    });
    
    // Bind methods
    this.handleConnect = this.handleConnect.bind(this);
    this.handleDisconnect = this.handleDisconnect.bind(this);
    this.handleSendMessage = this.handleSendMessage.bind(this);
    this.handleMessageInput = this.handleMessageInput.bind(this);
    this.handleWebSocketMessage = this.handleWebSocketMessage.bind(this);
    this.handleWebSocketOpen = this.handleWebSocketOpen.bind(this);
    this.handleWebSocketClose = this.handleWebSocketClose.bind(this);
    this.handleWebSocketError = this.handleWebSocketError.bind(this);
    this.handleWebSocketReconnect = this.handleWebSocketReconnect.bind(this);
    this.handleWebSocketReconnectFailed = this.handleWebSocketReconnectFailed.bind(this);
    
    // Register WebSocket event listeners
    this.wsClient.on('message', this.handleWebSocketMessage);
    this.wsClient.on('open', this.handleWebSocketOpen);
    this.wsClient.on('close', this.handleWebSocketClose);
    this.wsClient.on('error', this.handleWebSocketError);
    this.wsClient.on('reconnect', this.handleWebSocketReconnect);
    this.wsClient.on('reconnectFailed', this.handleWebSocketReconnectFailed);
  }
  
  /**
   * Component template
   */
  template() {
    return `
      <div class="websocket-example">
        <h2>WebSocket Example</h2>
        
        <div class="connection-status">
          Status: <span id="status" class="status-disconnected">Disconnected</span>
        </div>
        
        <div class="connection-controls">
          <button id="connectBtn" class="btn">Connect</button>
          <button id="disconnectBtn" class="btn" disabled>Disconnect</button>
        </div>
        
        <div class="message-container">
          <h3>Messages</h3>
          <div id="messages" class="messages"></div>
        </div>
        
        <div class="message-input">
          <input type="text" id="messageInput" placeholder="Type a message..." disabled>
          <button id="sendBtn" class="btn" disabled>Send</button>
        </div>
      </div>
    `;
  }
  
  /**
   * Component styles
   */
  styles() {
    return `
      .websocket-example {
        font-family: Arial, sans-serif;
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        border: 1px solid #ddd;
        border-radius: 5px;
      }
      
      .connection-status {
        margin-bottom: 10px;
      }
      
      .status-connected {
        color: green;
        font-weight: bold;
      }
      
      .status-disconnected {
        color: red;
      }
      
      .status-connecting {
        color: orange;
      }
      
      .connection-controls {
        margin-bottom: 20px;
      }
      
      .btn {
        padding: 8px 16px;
        margin-right: 10px;
        background-color: #4caf50;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }
      
      .btn:hover {
        background-color: #45a049;
      }
      
      .btn:disabled {
        background-color: #cccccc;
        cursor: not-allowed;
      }
      
      .messages {
        border: 1px solid #ddd;
        padding: 10px;
        height: 200px;
        overflow-y: auto;
        margin-bottom: 10px;
        background-color: #f9f9f9;
      }
      
      .message {
        margin-bottom: 5px;
        padding: 5px;
        border-radius: 4px;
      }
      
      .message-received {
        background-color: #e3f2fd;
      }
      
      .message-sent {
        background-color: #e8f5e9;
        text-align: right;
      }
      
      .message-system {
        background-color: #fff3e0;
        font-style: italic;
      }
      
      .message-input {
        display: flex;
      }
      
      #messageInput {
        flex-grow: 1;
        padding: 8px;
        margin-right: 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
      }
    `;
  }
  
  /**
   * Called when the component is connected to the DOM
   */
  connectedCallback() {
    super.connectedCallback();
    
    // Get DOM elements
    this.statusElement = this.shadowRoot.getElementById('status');
    this.connectButton = this.shadowRoot.getElementById('connectBtn');
    this.disconnectButton = this.shadowRoot.getElementById('disconnectBtn');
    this.messageInput = this.shadowRoot.getElementById('messageInput');
    this.sendButton = this.shadowRoot.getElementById('sendBtn');
    this.messagesContainer = this.shadowRoot.getElementById('messages');
    
    // Add event listeners
    this.connectButton.addEventListener('click', this.handleConnect);
    this.disconnectButton.addEventListener('click', this.handleDisconnect);
    this.sendButton.addEventListener('click', this.handleSendMessage);
    this.messageInput.addEventListener('keypress', this.handleMessageInput);
  }
  
  /**
   * Called when the component is disconnected from the DOM
   */
  disconnectedCallback() {
    // Remove event listeners
    this.connectButton.removeEventListener('click', this.handleConnect);
    this.disconnectButton.removeEventListener('click', this.handleDisconnect);
    this.sendButton.removeEventListener('click', this.handleSendMessage);
    this.messageInput.removeEventListener('keypress', this.handleMessageInput);
    
    // Disconnect WebSocket
    this.wsClient.disconnect();
    
    // Remove WebSocket event listeners
    this.wsClient.off('message', this.handleWebSocketMessage);
    this.wsClient.off('open', this.handleWebSocketOpen);
    this.wsClient.off('close', this.handleWebSocketClose);
    this.wsClient.off('error', this.handleWebSocketError);
    this.wsClient.off('reconnect', this.handleWebSocketReconnect);
    this.wsClient.off('reconnectFailed', this.handleWebSocketReconnectFailed);
    
    super.disconnectedCallback();
  }
  
  /**
   * Handle connect button click
   */
  handleConnect() {
    this.updateStatus('Connecting...', 'status-connecting');
    this.addMessage('Connecting to WebSocket server...', 'system');
    
    this.wsClient.connect()
      .catch(error => {
        console.error('Failed to connect:', error);
        this.updateStatus('Connection failed', 'status-disconnected');
        this.addMessage(`Connection failed: ${error.message}`, 'system');
      });
  }
  
  /**
   * Handle disconnect button click
   */
  handleDisconnect() {
    this.wsClient.disconnect();
  }
  
  /**
   * Handle send button click
   */
  handleSendMessage() {
    const message = this.messageInput.value.trim();
    
    if (message && this.wsClient.isConnected()) {
      this.wsClient.send(message);
      this.addMessage(message, 'sent');
      this.messageInput.value = '';
    }
  }
  
  /**
   * Handle message input keypress
   */
  handleMessageInput(event) {
    if (event.key === 'Enter') {
      this.handleSendMessage();
    }
  }
  
  /**
   * Handle WebSocket message event
   */
  handleWebSocketMessage(data) {
    this.addMessage(data, 'received');
  }
  
  /**
   * Handle WebSocket open event
   */
  handleWebSocketOpen() {
    this.updateStatus('Connected', 'status-connected');
    this.addMessage('Connected to WebSocket server', 'system');
    
    // Update UI
    this.connectButton.disabled = true;
    this.disconnectButton.disabled = false;
    this.messageInput.disabled = false;
    this.sendButton.disabled = false;
  }
  
  /**
   * Handle WebSocket close event
   */
  handleWebSocketClose(event) {
    this.updateStatus('Disconnected', 'status-disconnected');
    this.addMessage(`Disconnected from server: ${event.reason || 'Connection closed'}`, 'system');
    
    // Update UI
    this.connectButton.disabled = false;
    this.disconnectButton.disabled = true;
    this.messageInput.disabled = true;
    this.sendButton.disabled = true;
  }
  
  /**
   * Handle WebSocket error event
   */
  handleWebSocketError() {
    this.addMessage('WebSocket error occurred', 'system');
  }
  
  /**
   * Handle WebSocket reconnect event
   */
  handleWebSocketReconnect(attempt) {
    this.updateStatus(`Reconnecting (${attempt})...`, 'status-connecting');
    this.addMessage(`Attempting to reconnect (${attempt})...`, 'system');
  }
  
  /**
   * Handle WebSocket reconnect failed event
   */
  handleWebSocketReconnectFailed() {
    this.updateStatus('Reconnection failed', 'status-disconnected');
    this.addMessage('Failed to reconnect after multiple attempts', 'system');
  }
  
  /**
   * Update the connection status
   */
  updateStatus(text, className) {
    this.statusElement.textContent = text;
    this.statusElement.className = className;
  }
  
  /**
   * Add a message to the messages container
   */
  addMessage(text, type) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', `message-${type}`);
    messageElement.textContent = text;
    this.messagesContainer.appendChild(messageElement);
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }
}

// Define the custom element
customElements.define('websocket-example', WebSocketExample);

export default WebSocketExample;