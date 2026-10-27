import { ApiError } from '../api-error.js';

const transitions = Object.freeze({
  draft: new Set(['scheduled', 'published', 'cancelled']),
  scheduled: new Set(['published', 'cancelled', 'expired']),
  published: new Set(['running', 'cancelled', 'expired']),
  running: new Set(['target-hit', 'stopped', 'cancelled', 'expired', 'completed']),
  'target-hit': new Set(['target-hit', 'stopped', 'cancelled', 'completed']),
  stopped: new Set(),
  cancelled: new Set(),
  expired: new Set(),
  completed: new Set(),
});

export function requireSignalTransition(from, to) {
  if (from === to) return;
  if (!transitions[from]?.has(to))
    throw new ApiError(
      409,
      'INVALID_SIGNAL_TRANSITION',
      `Signal cannot move from ${from} to ${to}`
    );
}

export function calculatePips({ direction, entry, exitPrice, pipSize }) {
  if (![entry, exitPrice, pipSize].every(Number.isFinite) || pipSize <= 0)
    throw new ApiError(
      400,
      'VALIDATION_ERROR',
      'A valid execution price is required to calculate pips'
    );
  const movement = direction === 'BUY' ? exitPrice - entry : entry - exitPrice;
  return Math.round((movement / pipSize) * 10) / 10;
}

export function signalOutcome(status, pips) {
  if (status === 'cancelled' || status === 'expired') return status;
  if (pips > 0) return 'win';
  if (pips < 0) return 'loss';
  return 'breakeven';
}
