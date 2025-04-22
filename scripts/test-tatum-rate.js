import dotenv from 'dotenv-flow';
dotenv.config();

import { getCryptoFiatRate } from '../src/utils/tatum.js';

async function test() {
  try {
    const btcEur = await getCryptoFiatRate('BTC', 'EUR');
    console.log('BTC/EUR:', btcEur);
    const ethUsd = await getCryptoFiatRate('ETH', 'USD');
    console.log('ETH/USD:', ethUsd);
    const solUsd = await getCryptoFiatRate('SOL', 'USD');
    console.log('SOL/USD:', solUsd);
    const usdcUsd = await getCryptoFiatRate('USDC', 'USD');
    console.log('USDC/USD:', usdcUsd);
  } catch (e) {
    console.error('Rate Error:', e.message);
  }
}

test();
