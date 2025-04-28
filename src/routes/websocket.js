/**
 * WebSocket route handler
 * This route provides information about the WebSocket server
 */
export const websocketRoute = {
  method: 'GET',
  path: '/api/1/ws',
  handler: async (c) => {
    // This route is just for information purposes
    // The actual WebSocket server is set up in src/index.js
    return c.json({
      status: 'ok',
      message: 'WebSocket server is running',
      endpoint: '/api/1/ws',
      info: 'Connect to this endpoint using a WebSocket client'
    });
  }
};