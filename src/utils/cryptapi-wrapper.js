/**
 * CryptAPI wrapper with enhanced logging
 */
import cryptapi from 'cryptapi';
import util from 'util';

/**
 * Create a wrapped CryptAPI client with enhanced logging
 * @returns {Object} - Enhanced CryptAPI client
 */
export function createCryptAPIClient() {
  console.log('CryptAPI Wrapper: Creating CryptAPI client');
  
  // Create the original client
  const originalClient = cryptapi();
  
  // Get the original _createAddress method
  const originalCreateAddress = originalClient._createAddress;
  
  // Override the _createAddress method with our enhanced version
  originalClient._createAddress = function(coin, address, callback, options) {
    console.log('CryptAPI Wrapper: _createAddress called with:');
    console.log(`  - Coin: ${coin}`);
    console.log(`  - Address: ${address}`);
    console.log(`  - Callback URL: ${callback}`);
    console.log(`  - Options: ${util.inspect(options, { depth: null })}`);
    
    // Construct the full URL that will be called
    const baseURL = 'https://api.cryptapi.io/';
    const endpoint = `${coin}/create`;
    
    // Build query parameters
    const queryParams = new URLSearchParams();
    queryParams.append('address', address);
    queryParams.append('callback', callback);
    
    // Add any additional parameters from options
    if (options) {
      if (options.pending) {
        queryParams.append('pending', options.pending);
      }
      
      if (options.parameters) {
        for (const [key, value] of Object.entries(options.parameters)) {
          queryParams.append(`parameters[${key}]`, value);
        }
      }
    }
    
    const fullURL = `${baseURL}${endpoint}?${queryParams.toString()}`;
    console.log(`CryptAPI Wrapper: Full URL that will be called: ${fullURL}`);
    
    // Generate a curl command for manual testing
    const curlCommand = `curl -v "${fullURL}"`;
    console.log(`CryptAPI Wrapper: Equivalent curl command for testing:`);
    console.log(curlCommand);
    
    try {
      // Call the original method
      const result = originalCreateAddress.call(originalClient, coin, address, callback, options);
      
      // Log the result
      console.log('CryptAPI Wrapper: _createAddress result:');
      console.log(util.inspect(result, { depth: null }));
      
      // Return the result
      return result;
    } catch (error) {
      console.error('CryptAPI Wrapper: Error in _createAddress:');
      console.error(error);
      
      // Log detailed error information
      if (error.response) {
        console.error('CryptAPI Wrapper: Error response status:', error.response.status);
        console.error('CryptAPI Wrapper: Error response headers:', JSON.stringify(error.response.headers));
        console.error('CryptAPI Wrapper: Error response data:', JSON.stringify(error.response.data));
      } else if (error.request) {
        console.error('CryptAPI Wrapper: Error request sent but no response received');
        console.error('CryptAPI Wrapper: Error request details:', JSON.stringify(error.request));
      } else {
        console.error('CryptAPI Wrapper: Error message:', error.message);
      }
      
      // Rethrow the error
      throw error;
    }
  };
  
  // Add a new method to convert USD to cryptocurrency
  originalClient.convertUsdToCrypto = async function(coin, amount) {
    console.log(`CryptAPI Wrapper: Converting USD to ${coin}, amount: ${amount}`);
    
    try {
      // Construct the URL for the convert endpoint
      const baseURL = 'https://api.cryptapi.io/';
      const endpoint = `convert`;
      
      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.append('from', 'USD');
      queryParams.append('to', coin);
      queryParams.append('value', amount);
      
      const fullURL = `${baseURL}${endpoint}?${queryParams.toString()}`;
      console.log(`CryptAPI Wrapper: Convert URL: ${fullURL}`);
      
      // Generate a curl command for manual testing
      const curlCommand = `curl -v "${fullURL}"`;
      console.log(`CryptAPI Wrapper: Equivalent curl command for testing:`);
      console.log(curlCommand);
      
      // Make the request
      const response = await fetch(fullURL);
      
      if (!response.ok) {
        throw new Error(`CryptAPI convert request failed with status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('CryptAPI Wrapper: Convert response:', data);
      
      if (!data.success) {
        throw new Error(`CryptAPI convert failed: ${data.error || 'Unknown error'}`);
      }
      
      return {
        value: data.value,
        rate: data.rate
      };
    } catch (error) {
      console.error('CryptAPI Wrapper: Error in convertUsdToCrypto:', error);
      throw error;
    }
  };
  
  return originalClient;
}