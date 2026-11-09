import { ApiError } from '../api-error.js';

export async function verifyTurnstile(token, action, fetchImpl = fetch) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    if (['local', 'test'].includes(process.env.APP_ENV)) return;
    throw new ApiError(503, 'BOT_CHECK_NOT_CONFIGURED', 'Bot verification is not configured');
  }
  if (!token)
    throw new ApiError(400, 'BOT_CHECK_REQUIRED', 'Complete the bot verification and try again');
  let result;
  try {
    const response = await fetchImpl('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, response: token }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) throw new Error('Siteverify unavailable');
    result = await response.json();
  } catch {
    throw new ApiError(503, 'BOT_CHECK_UNAVAILABLE', 'Bot verification is unavailable. Try again');
  }
  const expectedHost = new URL(process.env.APP_ORIGIN || 'http://127.0.0.1:5174').hostname;
  if (!result.success || result.action !== action || result.hostname !== expectedHost)
    throw new ApiError(400, 'BOT_CHECK_FAILED', 'Bot verification failed. Please try again');
}
