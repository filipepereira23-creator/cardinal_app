/**
 * Live crypto prices from Coinbase's public exchange-rates endpoint: free, no key, CORS: *.
 * One request returns every listed coin against the US dollar. Cached for 10 minutes.
 * A coin inside a crypto account is valued live when it has a symbol (BTC, ETH…) and a quantity.
 */
export interface CryptoPrices {
  /** USD per coin, keyed by upper-case symbol. */
  usd: Record<string, number>;
  fetchedAt: string;
  source: string;
  sourceUrl: string;
}

const KEY = 'cardinal.crypto.v1';
const MAX_AGE_MS = 10 * 60 * 1000;

export function readCachedCrypto(): CryptoPrices | null {
  try {
    const c = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (c && c.usd && c.usd.BTC) return c;
  } catch {
    /* ignore */
  }
  return null;
}

export const cryptoIsFresh = (c: CryptoPrices | null) => !!c && Date.now() - new Date(c.fetchedAt).getTime() < MAX_AGE_MS;

export async function loadCrypto(): Promise<CryptoPrices | null> {
  try {
    const res = await fetch('https://api.coinbase.com/v2/exchange-rates?currency=USD');
    if (!res.ok) return null;
    const rates = (await res.json())?.data?.rates as Record<string, string> | undefined;
    if (!rates) return null;
    const usd: Record<string, number> = {};
    for (const [sym, r] of Object.entries(rates)) {
      const n = Number(r);
      if (n > 0) usd[sym.toUpperCase()] = 1 / n;
    }
    if (!usd.BTC) return null;
    const c: CryptoPrices = { usd, fetchedAt: new Date().toISOString(), source: 'Coinbase', sourceUrl: 'https://www.coinbase.com/price' };
    localStorage.setItem(KEY, JSON.stringify(c));
    return c;
  } catch {
    return null;
  }
}

export function coinPriceUsd(symbol: string | undefined, c: CryptoPrices | null): number | null {
  const s = (symbol || '').trim().toUpperCase();
  return s && c?.usd[s] ? c.usd[s] : null;
}
