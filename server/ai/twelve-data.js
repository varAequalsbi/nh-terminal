import { normalizeCandles } from './candles.js';

export async function fetchXauUsdCandles({
  outputsize = 5000,
  fetchImpl = fetch,
  now = Date.now(),
} = {}) {
  const key = process.env.TWELVE_DATA_API_KEY?.trim();
  if (!key) throw new Error('TWELVE_DATA_API_KEY is required for market data');
  if (!Number.isInteger(outputsize) || outputsize < 25 || outputsize > 5000)
    throw new Error('outputsize must be between 25 and 5000');
  const url = new URL('https://api.twelvedata.com/time_series');
  url.searchParams.set('symbol', 'XAU/USD');
  url.searchParams.set('interval', '1h');
  url.searchParams.set('outputsize', String(outputsize));
  url.searchParams.set('timezone', 'UTC');
  url.searchParams.set('apikey', key);
  let response;
  try {
    response = await fetchImpl(url, { signal: AbortSignal.timeout(15000) });
  } catch {
    // Never include the URL in errors: it contains the API key.
    throw new Error('Market data request failed or timed out');
  }
  if (!response.ok) throw new Error(`Market data request failed (HTTP ${response.status})`);
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error('Market provider returned invalid JSON');
  }
  if (data.status === 'error' || !Array.isArray(data.values))
    throw new Error(
      `Market provider rejected the request (code ${Number(data.code) || 'unknown'})`
    );
  if (data.meta?.symbol !== 'XAU/USD' || data.meta?.interval !== '1h')
    throw new Error('Market provider returned an unexpected symbol or interval');
  return normalizeCandles(
    data.values.map((bar) => ({
      ...bar,
      openedAt: `${bar.datetime.replace(' ', 'T')}Z`,
    })),
    now
  );
}
