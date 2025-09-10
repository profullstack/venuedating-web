import dotenv from 'dotenv-flow';
dotenv.config();

import {
  getBitcoinAddressBalance,
  getEthereumAddressBalance,
  getSolanaAddressBalance,
  getUsdcAddressBalance
} from '../src/utils/tatum.js';

async function test() {
  const btc = process.env.BITCOIN_ADDRESS;
  const eth = process.env.ETHEREUM_ADDRESS;
  const sol = process.env.SOLANA_ADDRESS;
  const usdc = process.env.ETHEREUM_ADDRESS; // USDC is ERC20, so ETH address

  try {
    console.log('BTC:', await getBitcoinAddressBalance(btc));
  } catch (e) {
    console.error('BTC Error:', e.message);
  }

  try {
    console.log('ETH:', await getEthereumAddressBalance(eth));
  } catch (e) {
    console.error('ETH Error:', e.message);
  }

  try {
    console.log('SOL:', await getSolanaAddressBalance(sol));
  } catch (e) {
    console.error('SOL Error:', e.message);
  }

  try {
    console.log('USDC:', await getUsdcAddressBalance(usdc));
  } catch (e) {
    console.error('USDC Error:', e.message);
  }
}

test();
