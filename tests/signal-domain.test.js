import { describe, expect, test } from 'vitest';
import { calculatePips, requireSignalTransition, signalOutcome } from '../server/domain/signals.js';

describe('signal lifecycle rules', () => {
  test('calculates BUY and SELL pips using instrument pip size', () => {
    expect(calculatePips({ direction: 'BUY', entry: 1.1, exitPrice: 1.105, pipSize: 0.0001 })).toBe(
      50
    );
    expect(calculatePips({ direction: 'SELL', entry: 150, exitPrice: 149.5, pipSize: 0.01 })).toBe(
      50
    );
    expect(signalOutcome('completed', -12)).toBe('loss');
  });

  test('allows defined progress and blocks terminal rewrites', () => {
    expect(() => requireSignalTransition('running', 'completed')).not.toThrow();
    expect(() => requireSignalTransition('completed', 'running')).toThrow(/cannot move/);
  });
});
