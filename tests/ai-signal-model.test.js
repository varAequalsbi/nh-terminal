import { describe, expect, test, vi } from 'vitest';
import { INTERVAL_MS, featuresAt, makeSamples, normalizeCandles } from '../server/ai/candles.js';
import { decide, trainModel } from '../server/ai/model.js';
import { fetchXauUsdCandles } from '../server/ai/twelve-data.js';

function history(length = 900) {
  const start = Date.parse('2025-01-01T00:00:00Z');
  return Array.from({ length }, (_, index) => {
    const close = 2600 + index * 0.015 + Math.sin(index / 10) * 5 + Math.sin(index / 3) * 1.5;
    return {
      openedAt: new Date(start + index * INTERVAL_MS).toISOString(),
      open: close - 0.4,
      high: close + 1.2,
      low: close - 1.3,
      close,
    };
  });
}

describe('private AI signal model', () => {
  test('uses only closed, valid, ordered candles', () => {
    const bars = history(3);
    expect(
      normalizeCandles([...bars].reverse(), Date.parse(bars[2].openedAt) + 30 * 60_000)
    ).toHaveLength(2);
    expect(() => normalizeCandles([bars[0], bars[0]])).toThrow(/duplicate/);
    expect(() => normalizeCandles([{ ...bars[0], high: 1 }])).toThrow(/invalid/);
  });

  test('features cannot see future candles and labels do not bridge missing hours', () => {
    const bars = normalizeCandles(history(70));
    const before = featuresAt(bars, 30);
    bars[35].close += 1000;
    expect(featuresAt(bars, 30)).toEqual(before);
    bars[35].openedAt += INTERVAL_MS;
    expect(makeSamples(bars).some((sample) => sample.index === 32)).toBe(false);
  });

  test('trains on chronological splits and refuses stale inference', () => {
    const bars = normalizeCandles(history(), Date.parse('2026-01-01T00:00:00Z'));
    const model = trainModel(bars);
    expect(model.evaluation.training.samples).toBeGreaterThan(50);
    expect(model.evaluation.validation.samples).toBeGreaterThan(50);
    expect(model.evaluation.test.samples).toBeGreaterThan(50);
    expect(model.evaluation.split.training[1] < model.evaluation.split.validation[0]).toBe(true);
    expect(model.evaluation.split.validation[1] < model.evaluation.split.test[0]).toBe(true);
    expect(decide(model, bars, bars.at(-1).openedAt + 4 * INTERVAL_MS).decision).toBe('NO SIGNAL');
    const current = decide(model, bars, bars.at(-1).openedAt + INTERVAL_MS);
    expect(['BUY', 'SELL', 'NO SIGNAL']).toContain(current.decision);
    if (current.probabilities)
      expect(
        Object.values(current.probabilities).reduce((sum, value) => sum + value, 0)
      ).toBeCloseTo(1);
  });

  test('keeps provider key out of request errors', async () => {
    vi.stubEnv('TWELVE_DATA_API_KEY', 'secret-test-key');
    const fetchImpl = vi.fn().mockRejectedValue(new Error('URL contains secret-test-key'));
    await expect(fetchXauUsdCandles({ fetchImpl })).rejects.toThrow('Market data request failed');
    await expect(fetchXauUsdCandles({ fetchImpl })).rejects.not.toThrow('secret-test-key');
    expect(fetchImpl.mock.calls[0][0].searchParams.get('symbol')).toBe('XAU/USD');
    vi.unstubAllEnvs();
  });

  test('parses UTC provider candles and excludes the unfinished bar', async () => {
    vi.stubEnv('TWELVE_DATA_API_KEY', 'secret-test-key');
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'ok',
        meta: { symbol: 'XAU/USD', interval: '1h' },
        values: [
          {
            datetime: '2025-01-01 01:00:00',
            open: '2600',
            high: '2602',
            low: '2599',
            close: '2601',
          },
          {
            datetime: '2025-01-01 00:00:00',
            open: '2600',
            high: '2601',
            low: '2599',
            close: '2600',
          },
        ],
      }),
    });
    const bars = await fetchXauUsdCandles({ fetchImpl, now: Date.parse('2025-01-01T01:30:00Z') });
    expect(bars[0].openedAt).toBe(Date.parse('2025-01-01T00:00:00Z'));
    expect(bars).toHaveLength(1);
    vi.unstubAllEnvs();
  });
});
