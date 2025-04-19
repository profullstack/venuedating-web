/**
 * HTTP debugging utilities
 */
import http from 'http';
import https from 'https';

/**
 * Enable detailed HTTP request and response logging
 * This patches the Node.js http and https modules to log all requests and responses
 */
export function enableHttpDebugging() {
  // Save original http.request
  http.__originalRequest = http.request;
  https.__originalRequest = https.request;
  
  const originalHttpRequest = http.__originalRequest;
  const originalHttpsRequest = https.__originalRequest;

  // Patch http.request
  http.request = function() {
    console.log('HTTP Debug: Making HTTP request:');
    console.log('HTTP Debug: Arguments:', JSON.stringify(Array.from(arguments), null, 2));
    
    // Generate curl command for testing
    try {
      const options = arguments[0];
      const method = options.method || 'GET';
      const hostname = options.hostname || options.host || 'localhost';
      const port = options.port ? `:${options.port}` : '';
      const path = options.path || '/';
      const protocol = 'http://';
      
      let curlCmd = `curl -v -X ${method} "${protocol}${hostname}${port}${path}"`;
      
      // Add headers if present
      if (options.headers) {
        for (const [key, value] of Object.entries(options.headers)) {
          curlCmd += ` -H "${key}: ${value}"`;
        }
      }
      
      // Add data if it's a POST/PUT request
      if ((method === 'POST' || method === 'PUT') && arguments[1]) {
        curlCmd += ` -d '${arguments[1]}'`;
      }
      
      console.log('HTTP Debug: Equivalent curl command:');
      console.log(curlCmd);
    } catch (error) {
      console.error('HTTP Debug: Error generating curl command:', error);
    }
    
    const req = originalHttpRequest.apply(this, arguments);
    
    req.on('response', (res) => {
      console.log(`HTTP Debug: Received HTTP response with status: ${res.statusCode}`);
      console.log('HTTP Debug: Response headers:', JSON.stringify(res.headers, null, 2));
      
      // Collect response body
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString();
        console.log('HTTP Debug: Response body:', body.substring(0, 1000) + (body.length > 1000 ? '...(truncated)' : ''));
      });
    });
    
    req.on('error', (error) => {
      console.error('HTTP Debug: Request error:', error);
    });
    
    return req;
  };
  
  // Patch https.request
  https.request = function() {
    console.log('HTTP Debug: Making HTTPS request:');
    console.log('HTTP Debug: Arguments:', JSON.stringify(Array.from(arguments), null, 2));
    
    // Generate curl command for testing
    try {
      const options = arguments[0];
      const method = options.method || 'GET';
      const hostname = options.hostname || options.host || 'localhost';
      const port = options.port ? `:${options.port}` : '';
      const path = options.path || '/';
      const protocol = 'https://';
      
      let curlCmd = `curl -v -X ${method} "${protocol}${hostname}${port}${path}"`;
      
      // Add headers if present
      if (options.headers) {
        for (const [key, value] of Object.entries(options.headers)) {
          curlCmd += ` -H "${key}: ${value}"`;
        }
      }
      
      // Add data if it's a POST/PUT request
      if ((method === 'POST' || method === 'PUT') && arguments[1]) {
        curlCmd += ` -d '${arguments[1]}'`;
      }
      
      console.log('HTTP Debug: Equivalent curl command:');
      console.log(curlCmd);
    } catch (error) {
      console.error('HTTP Debug: Error generating curl command:', error);
    }
    
    const req = originalHttpsRequest.apply(this, arguments);
    
    req.on('response', (res) => {
      console.log(`HTTP Debug: Received HTTPS response with status: ${res.statusCode}`);
      console.log('HTTP Debug: Response headers:', JSON.stringify(res.headers, null, 2));
      
      // Collect response body
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString();
        console.log('HTTP Debug: Response body:', body.substring(0, 1000) + (body.length > 1000 ? '...(truncated)' : ''));
      });
    });
    
    req.on('error', (error) => {
      console.error('HTTP Debug: Request error:', error);
    });
    
    return req;
  };
  
  console.log('HTTP Debug: HTTP debugging enabled');
}

/**
 * Disable HTTP debugging and restore original methods
 */
export function disableHttpDebugging() {
  http.request = http.__originalRequest;
  https.request = https.__originalRequest;
  console.log('HTTP Debug: HTTP debugging disabled');
}