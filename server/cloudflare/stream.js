import { ApiError } from '../api-error.js';

const idPattern = /^[a-f0-9]{32}$/i;
const customerPattern = /^[a-z0-9-]+$/i;
const apiBase = 'https://api.cloudflare.com/client/v4/accounts';
const activeVideoCache = new Map();
const signedPlaybackCache = new Map();
const verifiedInputCache = new Map();

export function streamConfigured() {
  return (
    idPattern.test(process.env.CLOUDFLARE_ACCOUNT_ID || '') &&
    Boolean(process.env.CLOUDFLARE_STREAM_API_TOKEN) &&
    customerPattern.test(process.env.CLOUDFLARE_STREAM_CUSTOMER_CODE || '')
  );
}

function credentials() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_STREAM_API_TOKEN;
  const customerCode = process.env.CLOUDFLARE_STREAM_CUSTOMER_CODE;
  if (!idPattern.test(accountId || '') || !apiToken || !customerPattern.test(customerCode || ''))
    throw new ApiError(503, 'STREAM_NOT_CONFIGURED', 'Cloudflare Stream is not configured');
  return { accountId, apiToken, customerCode };
}

async function cloudflareRequest(path, options = {}, fetchImpl = fetch) {
  const { accountId, apiToken } = credentials();
  let response;
  try {
    response = await fetchImpl(`${apiBase}/${accountId}/stream/${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
      signal: AbortSignal.timeout(8_000),
    });
  } catch {
    throw new ApiError(503, 'STREAM_UNAVAILABLE', 'Cloudflare Stream is temporarily unavailable');
  }
  if (!response.ok)
    throw new ApiError(503, 'STREAM_UNAVAILABLE', 'Cloudflare Stream is temporarily unavailable');
  const data = await response.json();
  if (!data.success)
    throw new ApiError(503, 'STREAM_UNAVAILABLE', 'Cloudflare Stream is temporarily unavailable');
  return data.result;
}

export async function verifyLiveInput(inputId, fetchImpl = fetch) {
  if (!idPattern.test(inputId || ''))
    throw new ApiError(400, 'VALIDATION_ERROR', 'Enter a valid Cloudflare live input ID');
  const input = await cloudflareRequest(`live_inputs/${inputId}`, {}, fetchImpl);
  const allowedOrigins = input?.recording?.allowedOrigins || [];
  const websiteHost = new URL(process.env.APP_ORIGIN || 'http://127.0.0.1:5174').hostname;
  if (
    input?.recording?.mode !== 'automatic' ||
    input?.recording?.requireSignedURLs !== true ||
    !allowedOrigins.includes(websiteHost)
  )
    throw new ApiError(
      400,
      'STREAM_NOT_PRIVATE',
      `Set recording to automatic, require signed URLs, and allow ${websiteHost} in Cloudflare Stream`
    );
  verifiedInputCache.set(inputId, Date.now() + 60_000);
  return input;
}

export async function livePlayback(inputId, fetchImpl = fetch) {
  const { customerCode } = credentials();
  if ((verifiedInputCache.get(inputId) || 0) <= Date.now())
    await verifyLiveInput(inputId, fetchImpl);
  const cached = activeVideoCache.get(inputId);
  let activeId = cached?.until > Date.now() ? cached.id : undefined;
  if (activeId === undefined) {
    const videos = await cloudflareRequest(`live_inputs/${inputId}/videos`, {}, fetchImpl);
    activeId = videos.find((video) => video.status?.state === 'live-inprogress')?.uid || null;
    activeVideoCache.set(inputId, { id: activeId, until: Date.now() + 10_000 });
  }
  if (!activeId) return { status: 'offline', playbackUrl: null, expiresAt: null };
  const existing = signedPlaybackCache.get(activeId);
  if (existing?.refreshAfter > Date.now()) return existing.value;
  const expiresAt = Math.floor(Date.now() / 1000) + 2 * 60 * 60;
  const signed = await cloudflareRequest(
    `${activeId}/token`,
    { method: 'POST', body: JSON.stringify({ exp: expiresAt, downloadable: false }) },
    fetchImpl
  );
  if (!signed?.token)
    throw new ApiError(503, 'STREAM_UNAVAILABLE', 'Cloudflare Stream is temporarily unavailable');
  const value = {
    status: 'live',
    playbackUrl: `https://customer-${customerCode}.cloudflarestream.com/${signed.token}/iframe`,
    expiresAt: new Date(expiresAt * 1000).toISOString(),
  };
  signedPlaybackCache.set(activeId, { value, refreshAfter: Date.now() + 90 * 60_000 });
  return value;
}
