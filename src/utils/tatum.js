import fetch from 'node-fetch';

const getApiKey = () => {
  const apiKey = process.env.TATUM_API_KEY;
  if (!apiKey) throw new Error('TATUM_API_KEY not set in environment variables');
  return apiKey;
};

/**
 * Get the Bitcoin address balance using Tatum API
 */
export async function getBitcoinAddressBalance(address) {
  const apiKey = getApiKey();
  const url = `https://api.tatum.io/v3/bitcoin/address/balance/${address}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'x-api-key': apiKey }
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Tatum API error: ${res.status} ${errText}`);
  }
  return res.json();
}

/**
 * Get the Ethereum address balance using Tatum API
 */
export async function getEthereumAddressBalance(address) {
  const apiKey = getApiKey();
  const url = `https://api.tatum.io/v3/ethereum/account/balance/${address}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'x-api-key': apiKey }
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Tatum API error: ${res.status} ${errText}`);
  }
  return res.json();
}

/**
 * Get the Solana address balance using Tatum API
 */
export async function getSolanaAddressBalance(address) {
  const apiKey = getApiKey();
  const url = `https://api.tatum.io/v3/solana/account/balance/${address}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'x-api-key': apiKey }
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Tatum API error: ${res.status} ${errText}`);
  }
  return res.json();
}

/**
 * Get the USDC (ERC20) address balance using Tatum API (Ethereum mainnet)
 */
export async function getUsdcAddressBalance(address) {
  const apiKey = getApiKey();
  // USDC contract address on Ethereum mainnet
  const contractAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
  const url = `https://api.tatum.io/v3/ethereum/account/balance/${address}?contractAddress=${contractAddress}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'x-api-key': apiKey }
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Tatum API error: ${res.status} ${errText}`);
  }
  return res.json();
}

/**
 * Get the current exchange rate for a crypto/fiat pair using Tatum REST API
 * @param {string} crypto - Crypto symbol (e.g., 'BTC', 'ETH')
 * @param {string} fiat - Fiat currency symbol (e.g., 'USD', 'EUR')
 * @returns {Promise<number>} - The exchange rate (e.g., 88375.98)
 */
export async function getTatumExchangeRateRest(crypto, fiat) {
  const apiKey = getApiKey();
  const url = `https://api.tatum.io/v3/tatum/rate/${crypto}?basePair=${fiat}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'x-api-key': apiKey }
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Tatum API error: ${res.status} ${errText}`);
  }
  const data = await res.json();
  if (!data.value) throw new Error('Tatum API response missing value');
  return parseFloat(data.value);
}
