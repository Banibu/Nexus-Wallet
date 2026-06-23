import axios from 'axios';
import { env } from '../config/env';
import { redis } from '../config/redis';
import Decimal from 'decimal.js';

const CG = axios.create({
  baseURL: env.COINGECKO_BASE_URL,
  timeout: 15000,
  headers: {
    'x-cg-demo-api-key': env.COINGECKO_API_KEY,
    accept: 'application/json',
  },
});

const TOKEN_TO_CG_ID: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  USDT: 'tether',
  // BRL is a fiat — not a coingecko id; handled separately
};

const FIAT_VS_CURRENCIES = new Set(['BRL', 'USD', 'EUR']);

const CACHE_TTL_SECONDS = 30;

export interface QuoteData {
  // 1 fromToken = rate (toToken)
  rate: Decimal;
  source: string; // 'cache' | 'coingecko'
  fetchedAt: string;
}

/**
 * Returns rate such that: 1 unit of `from` = rate units of `to`.
 * Supports crypto<->BRL and crypto<->crypto.
 */
export async function getRate(from: string, to: string): Promise<QuoteData> {
  if (from === to) {
    return { rate: new Decimal(1), source: 'identity', fetchedAt: new Date().toISOString() };
  }

  const cacheKey = `nexus:quote:${from}:${to}`;
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      return {
        rate: new Decimal(parsed.rate),
        source: 'cache',
        fetchedAt: parsed.fetchedAt,
      };
    }
  } catch {
    // ignore cache failure
  }

  // Determine fetch strategy
  let rate: Decimal;
  const fromIsFiat = FIAT_VS_CURRENCIES.has(from);
  const toIsFiat = FIAT_VS_CURRENCIES.has(to);

  if (!fromIsFiat && toIsFiat) {
    // crypto -> fiat (direct CoinGecko simple/price)
    const id = TOKEN_TO_CG_ID[from];
    if (!id) throw new Error(`Unsupported token: ${from}`);
    const res = await CG.get('/simple/price', {
      params: { ids: id, vs_currencies: to.toLowerCase() },
    });
    const price = res.data?.[id]?.[to.toLowerCase()];
    if (price === undefined) throw new Error(`No price for ${from}/${to}`);
    rate = new Decimal(price);
  } else if (fromIsFiat && !toIsFiat) {
    // fiat -> crypto: invert the crypto->fiat
    const id = TOKEN_TO_CG_ID[to];
    if (!id) throw new Error(`Unsupported token: ${to}`);
    const res = await CG.get('/simple/price', {
      params: { ids: id, vs_currencies: from.toLowerCase() },
    });
    const price = res.data?.[id]?.[from.toLowerCase()];
    if (price === undefined) throw new Error(`No price for ${to}/${from}`);
    rate = new Decimal(1).dividedBy(price);
  } else if (!fromIsFiat && !toIsFiat) {
    // crypto -> crypto (cross via USD)
    const idFrom = TOKEN_TO_CG_ID[from];
    const idTo = TOKEN_TO_CG_ID[to];
    if (!idFrom || !idTo) throw new Error(`Unsupported pair: ${from}/${to}`);
    const res = await CG.get('/simple/price', {
      params: { ids: `${idFrom},${idTo}`, vs_currencies: 'usd' },
    });
    const pFrom = res.data?.[idFrom]?.usd;
    const pTo = res.data?.[idTo]?.usd;
    if (!pFrom || !pTo) throw new Error(`No cross prices for ${from}/${to}`);
    rate = new Decimal(pFrom).dividedBy(pTo);
  } else {
    throw new Error(`Unsupported pair: ${from}/${to}`);
  }

  const fetchedAt = new Date().toISOString();
  try {
    await redis.set(
      cacheKey,
      JSON.stringify({ rate: rate.toString(), fetchedAt }),
      'EX',
      CACHE_TTL_SECONDS,
    );
  } catch {
    // ignore cache failure
  }

  return { rate, source: 'coingecko', fetchedAt };
}
