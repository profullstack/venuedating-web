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
    
    // Build query parameters according to official documentation
    const queryParams = new URLSearchParams();
    queryParams.append('address', address);
    queryParams.append('callback', callback);
    queryParams.append('pending', options?.pending ? '1' : '0');
    queryParams.append('confirmations', '1');
    queryParams.append('json', '1'); // Always use JSON response format
    
    // Add any additional parameters from options
    if (options?.parameters) {
      for (const [key, value] of Object.entries(options.parameters)) {
        queryParams.append(`parameters[${key}]`, value);
      }
    }
    
    const fullURL = `${baseURL}${coin}/create/?${queryParams.toString()}`;
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
      // Construct the URL for the convert endpoint - using the ticker endpoint instead
      // CryptAPI doesn't have a direct USD conversion endpoint, but we can get the ticker
      // and calculate the conversion ourselves
      const baseURL = 'https://api.cryptapi.io/';
      const endpoint = `${coin}/info`;
      
      const fullURL = `${baseURL}${endpoint}`;
      console.log(`CryptAPI Wrapper: Info URL: ${fullURL}`);
      
      // Generate a curl command for manual testing
      const curlCommand = `curl -v "${fullURL}"`;
      console.log(`CryptAPI Wrapper: Equivalent curl command for testing:`);
      console.log(curlCommand);
      
      // Make the request to get the current ticker info
      const response = await fetch(fullURL);
      
      if (!response.ok) {
        throw new Error(`CryptAPI info request failed with status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('CryptAPI Wrapper: Info response:', JSON.stringify(data));
      
      // Check if the response contains the prices data
      if (!data.prices || !data.prices.USD) {
        console.error('CryptAPI Wrapper: Invalid response format:', JSON.stringify(data));
        throw new Error(`CryptAPI info response missing prices data`);
      }
      
      // Calculate the conversion
      const usdPrice = parseFloat(data.prices.USD);
      const rate = 1 / usdPrice; // This gives us the rate of 1 USD to the cryptocurrency
      const value = amount * rate;
      
      console.log(`CryptAPI Wrapper: Price of 1 ${coin.toUpperCase()} = $${usdPrice} USD`);
      console.log(`CryptAPI Wrapper: Conversion rate: 1 USD = ${rate} ${coin.toUpperCase()}`);
      console.log(`CryptAPI Wrapper: ${amount} USD = ${value} ${coin.toUpperCase()}`);
      
      return {
        value: value,
        rate: rate
      };
    } catch (error) {
      console.error('CryptAPI Wrapper: Error in convertUsdToCrypto:', error);
      console.error('CryptAPI Wrapper: Error details:', error.message);
      throw error;
    }
  };
  
  // Add a method to check payment logs
  originalClient.checkPaymentLogs = async function(coin, callbackUrl) {
    console.log(`CryptAPI Wrapper: Checking payment logs for ${coin} with callback URL: ${callbackUrl}`);
    
    try {
      // Construct the URL for the logs endpoint
      const baseURL = 'https://api.cryptapi.io/';
      
      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.append('callback', callbackUrl);
      
      const fullURL = `${baseURL}${coin}/logs/?${queryParams.toString()}`;
      console.log(`CryptAPI Wrapper: Logs URL: ${fullURL}`);
      
      // Generate a curl command for manual testing
      const curlCommand = `curl -v "${fullURL}"`;
      console.log(`CryptAPI Wrapper: Equivalent curl command for testing:`);
      console.log(curlCommand);
      
      // Make the request to get the logs
      const response = await fetch(fullURL);
      
      if (!response.ok) {
        throw new Error(`CryptAPI logs request failed with status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('CryptAPI Wrapper: Logs response:', JSON.stringify(data));
      
      return data;
    } catch (error) {
      console.error('CryptAPI Wrapper: Error in checkPaymentLogs:', error);
      console.error('CryptAPI Wrapper: Error details:', error.message);
      throw error;
    }
  };
  
  return originalClient;
}