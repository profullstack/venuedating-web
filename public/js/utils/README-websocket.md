# WebSocket Integration Guide

This guide explains how to use the WebSocket functionality in the application.

## Overview

The application includes a WebSocket server that allows real-time communication between the client and server. This can be used for features like:

- Real-time notifications
- Live updates
- Chat functionality
- Collaborative editing
- Data streaming

## WebSocket Server

The WebSocket server is implemented as a standalone server in `src/index.js` and runs on port 8100. It's separate from the main HTTP server to avoid conflicts with the Hono framework.

### Server Implementation

```javascript
// Create a separate WebSocket server on a different port
const wsPort = parseInt(port) + 1;
const wss = new WebSocketServer({ port: wsPort });

// Handle WebSocket connections
wss.on('connection', (ws) => {
  console.log('WebSocket connection established');
  
  // Send a welcome message
  ws.send('Connected to WebSocket server');
  
  // Handle messages
  ws.on('message', (message) => {
    console.log(`Received message: ${message}`);
    ws.send(`Echo: ${message}`);
  });
  
  // Handle connection close
  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });
  
  // Handle errors
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

console.log(`WebSocket server running at ws://localhost:${wsPort}`);
```

## WebSocket Client

The application includes a WebSocketClient utility (`public/js/utils/websocket-client.js`) that provides a simple interface for connecting to the WebSocket server and handling WebSocket events.

### Client Usage

```javascript
import WebSocketClient from '../utils/websocket-client.js';

// Create a new WebSocketClient instance
const wsClient = new WebSocketClient({
  port: 8100,                      // WebSocket server port
  endpoint: '',                     // WebSocket endpoint path
  reconnectInterval: 5000,          // Reconnection interval in milliseconds
  maxReconnectAttempts: 5           // Maximum number of reconnection attempts
});

// Connect to the WebSocket server
wsClient.connect(true)  // true enables auto-reconnect
  .then(() => {
    console.log('Connected to WebSocket server');
  })
  .catch(error => {
    console.error('Failed to connect:', error);
  });

// Register event listeners
wsClient.on('message', (data) => {
  console.log('Received message:', data);
});

wsClient.on('open', () => {
  console.log('Connection established');
});

wsClient.on('close', () => {
  console.log('Connection closed');
});

// Send a message
wsClient.send('Hello, WebSocket!');

// Disconnect
wsClient.disconnect();
```

### Available Methods

- `connect(autoReconnect)` - Connect to the WebSocket server
- `disconnect()` - Disconnect from the WebSocket server
- `send(data)` - Send a message to the WebSocket server
- `on(event, callback)` - Register an event listener
- `off(event, callback)` - Remove an event listener
- `isConnected()` - Check if the WebSocket is connected

### Available Events

- `message` - Fired when a message is received
- `open` - Fired when the connection is established
- `close` - Fired when the connection is closed
- `error` - Fired when an error occurs
- `reconnect` - Fired when attempting to reconnect
- `reconnectFailed` - Fired when reconnection fails

## WebSocket Component Example

The application includes a WebSocket component example (`public/js/components/websocket-example.js`) that demonstrates how to use the WebSocketClient utility in a web component.

### Component Usage

```html
<!-- Import the component -->
<script type="module" src="/js/components/websocket-example.js"></script>

<!-- Use the component -->
<websocket-example></websocket-example>
```

## Demo Pages

The application includes two demo pages that demonstrate the WebSocket functionality:

1. **Basic WebSocket Demo**: `/websocket-demo.html`
   - A simple HTML page that demonstrates how to connect to the WebSocket server using the native WebSocket API

2. **WebSocket Component Demo**: `/views/websocket-component-demo.html`
   - A page that demonstrates how to use the WebSocket component

## Extending the WebSocket Server

To extend the WebSocket server with additional functionality:

1. Modify the WebSocket server implementation in `src/index.js`
2. Add event handlers for different message types
3. Implement business logic for processing messages
4. Send responses back to the client

Example of handling different message types:

```javascript
ws.on('message', (message) => {
  try {
    const data = JSON.parse(message);
    
    // Handle different message types
    switch (data.type) {
      case 'subscribe':
        handleSubscribe(ws, data);
        break;
      case 'unsubscribe':
        handleUnsubscribe(ws, data);
        break;
      case 'message':
        handleMessage(ws, data);
        break;
      default:
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Unknown message type'
        }));
    }
  } catch (error) {
    // Handle non-JSON messages
    ws.send(`Echo: ${message}`);
  }
});
```

## Best Practices

1. **Message Format**: Use JSON for structured messages
2. **Error Handling**: Implement proper error handling on both client and server
3. **Reconnection**: Use the auto-reconnect feature for better user experience
4. **Authentication**: Implement authentication for secure WebSocket connections
5. **Heartbeat**: Implement a heartbeat mechanism to detect disconnections
6. **Scaling**: Consider using a message broker for scaling WebSocket servers

## Conclusion

The WebSocket integration provides a foundation for implementing real-time features in the application. By using the WebSocketClient utility and following the examples, you can easily add WebSocket functionality to your components.