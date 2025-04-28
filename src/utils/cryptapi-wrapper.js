/**
 * DEPRECATED: CryptAPI integration has been removed
 * This file is kept as a placeholder to prevent import errors
 */

export function createCryptAPIClient() {
  console.warn('CryptAPI integration has been deprecated and removed');
  return {
    // Return a dummy object with empty methods to prevent errors
    _createAddress: () => {
      console.warn('CryptAPI._createAddress is deprecated');
      return Promise.reject(new Error('CryptAPI integration has been removed'));
    },
    convertUsdToCrypto: () => {
      console.warn('CryptAPI.convertUsdToCrypto is deprecated');
      return Promise.reject(new Error('CryptAPI integration has been removed'));
    },
    checkPaymentLogs: () => {
      console.warn('CryptAPI.checkPaymentLogs is deprecated');
      return Promise.reject(new Error('CryptAPI integration has been removed'));
    }
  };
}