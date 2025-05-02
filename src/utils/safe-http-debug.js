/**
 * Safe HTTP debugging utilities
 * Version with improved response body handling
 */
import http from 'http';
import https from 'https';

/**
 * Enable detailed HTTP request and response logging
 * This patches the Node.js http and https modules to log all requests and responses
 * Designed to safely handle large responses
 */
export function enableSafeHttpDebugging() {
  // Save original http.request
  http.__originalRequest = http.request;
  https.__originalRequest = https.request;
  
  const originalHttpRequest = http.__originalRequest;
  const originalHttpsRequest = https.__originalRequest;

  // Helper function to safely handle response bodies
  const safelyHandleResponseBody = (res, protocol) => {
    const contentType = res.headers['content-type'] || '';
    
    // Only try to log text-based content
    if (contentType.includes('json') || 
        contentType.includes('text') || 
        contentType.includes('form-urlencoded')) {
      
      let size = 0;
      const maxSize = 5000; // Limit size to prevent memory issues
      const chunks = [];
      
      res.on('data', (chunk) => {
        size += chunk.length;
        if (size <= maxSize) chunks.push(chunk);
      });
      
      res.on('end', () => {
        try {
          if (chunks.length === 0) {
            console.log(`HTTP Debug: ${protocol} response body exceeds size limit, not shown`);
            return;
          }
          
          const body = Buffer.concat(chunks).toString('utf8');
          const preview = body.substring(0, 500);
          const truncated = size > maxSize || body.length > 500 ? '...(truncated)' : '';
          
          // Try to parse JSON for better display
          if (contentType.includes('json')) {
            try {
              const parsed = JSON.parse(body);
              console.log(`HTTP Debug: ${protocol} response body (JSON):`, 
                JSON.stringify(parsed, null, 2).substring(0, 500) + truncated);
            } catch {
              // If JSON parsing fails, fall back to plain text
              console.log(`HTTP Debug: ${protocol} response body:`, preview + truncated);
            }
          } else {
            console.log(`HTTP Debug: ${protocol} response body:`, preview + truncated);
          }
        } catch (error) {
          console.error(`HTTP Debug: Error processing ${protocol} response:`, error.message);
        }
      });
    } else {
      // For binary content, just log the type and size
      let size = 0;
      res.on('data', (chunk) => { size += chunk.length; });
      res.on('end', () => {
        console.log(`HTTP Debug: ${protocol} binary response (${contentType}, ${size} bytes)`);
      });
    }
  };

  // Patch http.request
  http.request = function() {
    console.log('HTTP Debug: Making HTTP request:');
    
    // Generate curl command for testing
    try {
      const options = arguments[0];
      const method = options.method || 'GET';
      const hostname = options.hostname || options.host || 'localhost';
      const port = options.port ? `:${options.port}` : '';
      const path = options.path || '/';
      const protocol = 'http://';
      
      let curlCmd = `curl -v -X ${method} "${protocol}${hostname}${port}${path}"`;
      
      // Add headers
      if (options.headers) {
        for (const [key, value] of Object.entries(options.headers)) {
          curlCmd += ` -H "${key}: ${value}"`;
        }
      }
      
      console.log('HTTP Debug: Equivalent curl command:', curlCmd);
    } catch (error) {
      console.error('HTTP Debug: Error generating curl command:', error);
    }
    
    const req = originalHttpRequest.apply(this, arguments);
    
    req.on('response', (res) => {
      console.log(`HTTP Debug: Received HTTP response with status: ${res.statusCode}`);
      safelyHandleResponseBody(res, 'HTTP');
    });
    
    req.on('error', (error) => {
      console.error('HTTP Debug: Request error:', error);
    });
    
    return req;
  };
  
  // Patch https.request
  https.request = function() {
    console.log('HTTP Debug: Making HTTPS request:');
    
    // Generate curl command for testing
    try {
      const options = arguments[0];
      const method = options.method || 'GET';
      const hostname = options.hostname || options.host || 'localhost';
      const port = options.port ? `:${options.port}` : '';
      const path = options.path || '/';
      const protocol = 'https://';
      
      let curlCmd = `curl -v -X ${method} "${protocol}${hostname}${port}${path}"`;
      
      // Add headers
      if (options.headers) {
        for (const [key, value] of Object.entries(options.headers)) {
          curlCmd += ` -H "${key}: ${value}"`;
        }
      }
      
      console.log('HTTP Debug: Equivalent curl command:', curlCmd);
    } catch (error) {
      console.error('HTTP Debug: Error generating curl command:', error);
    }
    
    const req = originalHttpsRequest.apply(this, arguments);
    
    req.on('response', (res) => {
      console.log(`HTTP Debug: Received HTTPS response with status: ${res.statusCode}`);
      safelyHandleResponseBody(res, 'HTTPS');
    });
    
    req.on('error', (error) => {
      console.error('HTTP Debug: Request error:', error);
    });
    
    return req;
  };
  
  console.log('HTTP Debug: Safe HTTP debugging enabled');
}

/**
 * Disable HTTP debugging and restore original methods
 */
export function disableSafeHttpDebugging() {
  http.request = http.__originalRequest;
  https.request = https.__originalRequest;
  console.log('HTTP Debug: HTTP debugging disabled');
}
