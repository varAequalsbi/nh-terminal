export const INTERVAL_MS = 60 * 60 * 1000;
export const HORIZON_BARS = 4;
export const FEATURE_NAMES = [
  'return_1_atr',
  'return_3_atr',
  'return_6_atr',
  'moving_average_gap_atr',
  'last_range_atr',
  'recent_volatility_atr',
];

export function normalizeCandles(input, now = Date.now()) {
  if (!Array.isArray(input)) throw new Error('Candle response must be an array');
  const candles = input.map((bar) => {
    const openedAt = Date.parse(bar.openedAt || bar.datetime);
    const open = Number(bar.open);
    const high = Number(bar.high);
    const low = Number(bar.low);
    const close = Number(bar.close);
    if (
      !Number.isFinite(openedAt) ||
      ![open, high, low, close].every((value) => Number.isFinite(value) && value > 0) ||
      high < Math.max(open, close, low) ||
      low > Math.min(open, close, high)
    )
      throw new Error('Market provider returned an invalid candle');
    return { openedAt, open, high, low, close };
  });
  candles.sort((a, b) => a.openedAt - b.openedAt);
  for (let i = 1; i < candles.length; i += 1) {
    if (candles[i].openedAt === candles[i - 1].openedAt)
      throw new Error('Market provider returned duplicate candle timestamps');
  }
  return candles.filter((bar) => bar.openedAt + INTERVAL_MS <= now);
}

const mean = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;

function hasContinuousWindow(candles, start, end) {
  for (let i = start + 1; i <= end; i += 1) {
    if (candles[i].openedAt - candles[i - 1].openedAt !== INTERVAL_MS) return false;
  }
  return true;
}

export function featuresAt(candles, index) {
  if (index < 24 || !hasContinuousWindow(candles, index - 24, index)) return null;
  const recent = candles.slice(index - 13, index + 1);
  const trueRanges = recent.map((bar, offset) => {
    const previousClose = candles[index - 14 + offset].close;
    return Math.max(
      bar.high - bar.low,
      Math.abs(bar.high - previousClose),
      Math.abs(bar.low - previousClose)
    );
  });
  const atr = mean(trueRanges);
  if (!Number.isFinite(atr) || atr <= 0) return null;
  const close = candles[index].close;
  const recentCloses = candles.slice(index - 5, index + 1).map((bar) => bar.close);
  const longerCloses = candles.slice(index - 23, index + 1).map((bar) => bar.close);
  const changes = recentCloses.slice(1).map((value, offset) => value - recentCloses[offset]);
  const volatility = Math.sqrt(mean(changes.map((value) => value ** 2)));
  return {
    values: [
      (close - candles[index - 1].close) / atr,
      (close - candles[index - 3].close) / atr,
      (close - candles[index - 6].close) / atr,
      (mean(recentCloses) - mean(longerCloses)) / atr,
      (candles[index].high - candles[index].low) / atr,
      volatility / atr,
    ],
    atr,
  };
}

export function makeSamples(candles) {
  const samples = [];
  for (let index = 24; index < candles.length - HORIZON_BARS; index += 1) {
    const feature = featuresAt(candles, index);
    if (!feature || !hasContinuousWindow(candles, index, index + HORIZON_BARS)) continue;
    const move = candles[index + HORIZON_BARS].close - candles[index].close;
    // Neutral includes a buffer for price noise and trading friction. It is not a profit calculation.
    const threshold = feature.atr * 0.75;
    const label = move > threshold ? 2 : move < -threshold ? 0 : 1;
    samples.push({ index, labelEndIndex: index + HORIZON_BARS, values: feature.values, label });
  }
  return samples;
}
