/**
 * CryptAPI wrapper with enhanced logging
 */
// PATCH: Force all CryptAPI requests to use the correct base URL (https://api.cryptapi.io/)
// This override ensures that even if the underlying cryptapi package is outdated or buggy, we always hit the right endpoint.
import cryptapi from 'cryptapi';
import util from 'util';

const FORCED_CRYPTAPI_BASE_URL = 'https://api.cryptapi.io/';

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
  
  // Override the _createAddress method to use fetch directly instead of the cryptapi package
  // This guarantees we always hit the correct endpoint and avoid any package bugs or hardcoded URLs
  originalClient._createAddress = async function(coin, address, callback, options) {
    console.log('CryptAPI Wrapper: _createAddress called with:');
    console.log(`  - Coin: ${coin}`);
    console.log(`  - Address: ${address}`);
    console.log(`  - Callback URL: ${callback}`);
    console.log(`  - Options: ${util.inspect(options, { depth: null })}`);

    const baseURL = FORCED_CRYPTAPI_BASE_URL;
    const queryParams = new URLSearchParams();
    queryParams.append('address', address);
    queryParams.append('callback', callback);
    queryParams.append('pending', options?.pending ? '1' : '0');
    queryParams.append('confirmations', '1');
    queryParams.append('json', '1');
    if (options?.parameters) {
      for (const [key, value] of Object.entries(options.parameters)) {
        queryParams.append(`parameters[${key}]`, value);
      }
    }
    const fullURL = `${baseURL}${coin}/create/?${queryParams.toString()}`;
    console.log(`CryptAPI Wrapper: Full URL that will be called: ${fullURL}`);
    const curlCommand = `curl -v "${fullURL}"`;
    console.log(`CryptAPI Wrapper: Equivalent curl command for testing:`);
    console.log(curlCommand);
    try {
      const response = await fetch(fullURL);
      if (!response.ok) {
        const text = await response.text();
        console.error('CryptAPI Wrapper: Error response from fetch:', text);
        throw new Error(`CryptAPI create address failed: ${response.status}`);
      }
      const result = await response.json();
      console.log('CryptAPI Wrapper: _createAddress result:');
      console.log(util.inspect(result, { depth: null }));
      return result;
    } catch (error) {
      console.error('CryptAPI Wrapper: Error in _createAddress:');
      console.error(error);
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
      const baseURL = FORCED_CRYPTAPI_BASE_URL;
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
      const baseURL = FORCED_CRYPTAPI_BASE_URL;
      
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