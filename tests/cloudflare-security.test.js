import { afterEach, describe, expect, test } from 'vitest';
import { livePlayback, verifyLiveInput } from '../server/cloudflare/stream.js';
import { verifyTurnstile } from '../server/cloudflare/turnstile.js';
import { handleApiRequest } from '../server/api-application.js';

const original = { ...process.env };
afterEach(() => {
  for (const key of Object.keys(process.env)) if (!(key in original)) delete process.env[key];
  Object.assign(process.env, original);
});

const jsonResponse = (result) => ({ ok: true, json: async () => ({ success: true, result }) });

describe('Cloudflare protection', () => {
  test('rejects public live inputs and signs active playback only', async () => {
    process.env.CLOUDFLARE_ACCOUNT_ID = 'a'.repeat(32);
    process.env.CLOUDFLARE_STREAM_API_TOKEN = 'server-only-token';
    process.env.CLOUDFLARE_STREAM_CUSTOMER_CODE = 'testcustomer';
    process.env.APP_ORIGIN = 'https://nhterminal.com';
    const inputId = 'b'.repeat(32);
    const videoId = 'c'.repeat(32);
    const calls = [];
    const fetchImpl = async (url, options) => {
      calls.push({ url, options });
      if (url.endsWith(`/live_inputs/${inputId}`))
        return jsonResponse({
          recording: {
            mode: 'automatic',
            requireSignedURLs: calls.length > 1,
            allowedOrigins: ['nhterminal.com'],
          },
        });
      if (url.endsWith(`/live_inputs/${inputId}/videos`))
        return jsonResponse([{ uid: videoId, status: { state: 'live-inprogress' } }]);
      if (url.endsWith(`/${videoId}/token`))
        return jsonResponse({ token: 'signed-playback-token' });
      throw new Error(`Unexpected URL ${url}`);
    };
    await expect(verifyLiveInput(inputId, fetchImpl)).rejects.toMatchObject({
      code: 'STREAM_NOT_PRIVATE',
    });
    await expect(verifyLiveInput(inputId, fetchImpl)).resolves.toBeTruthy();
    const playback = await livePlayback(inputId, fetchImpl);
    expect(playback).toMatchObject({
      status: 'live',
      playbackUrl:
        'https://customer-testcustomer.cloudflarestream.com/signed-playback-token/iframe',
    });
    expect(calls.at(-1).options.headers.Authorization).toBe('Bearer server-only-token');
    expect(JSON.parse(calls.at(-1).options.body).downloadable).toBe(false);
  });

  test('requires a matching Turnstile action and website hostname', async () => {
    process.env.TURNSTILE_SECRET_KEY = 'server-only-secret';
    process.env.APP_ORIGIN = 'https://nhterminal.com';
    const token = 'verified-token';
    const fetchImpl = async (_url, options) => {
      expect(JSON.parse(options.body)).toEqual({ secret: 'server-only-secret', response: token });
      return {
        ok: true,
        json: async () => ({ success: true, action: 'login', hostname: 'nhterminal.com' }),
      };
    };
    await expect(verifyTurnstile(token, 'login', fetchImpl)).resolves.toBeUndefined();
    await expect(verifyTurnstile(token, 'register', fetchImpl)).rejects.toMatchObject({
      code: 'BOT_CHECK_FAILED',
    });
    await expect(verifyTurnstile('', 'login', fetchImpl)).rejects.toMatchObject({
      code: 'BOT_CHECK_REQUIRED',
    });
  });

  test('fails closed on production sign in without a Turnstile secret', async () => {
    process.env.APP_ENV = 'production';
    delete process.env.TURNSTILE_SECRET_KEY;
    const result = await handleApiRequest(
      {
        method: 'POST',
        path: '/auth/login',
        input: { email: 'member@example.com', password: 'MemberPass123!' },
      },
      { consumeAuthRateLimit: async () => {} }
    );
    expect(result).toMatchObject({
      status: 503,
      body: { code: 'BOT_CHECK_NOT_CONFIGURED' },
    });
  });

  test('serves signed playback to members without exposing the live input ID', async () => {
    const inputId = 'd'.repeat(32);
    process.env.CLOUDFLARE_ACCOUNT_ID = 'a'.repeat(32);
    process.env.CLOUDFLARE_STREAM_API_TOKEN = 'server-only-token';
    process.env.CLOUDFLARE_STREAM_CUSTOMER_CODE = 'testcustomer';
    process.env.CLOUDFLARE_STREAM_LIVE_INPUT_ID = inputId;
    const repository = {
      session: async () => ({ userId: 'member-id' }),
      getProfile: async () => ({ role: 'member' }),
      liveSession: async () => ({
        title: 'NH Live Trade',
        inputId: 'e'.repeat(32),
        updatedAt: null,
      }),
    };
    const result = await handleApiRequest(
      { method: 'GET', path: '/community/live-session', headers: { cookie: 'nh_session=test' } },
      repository,
      {
        livePlayback: async (receivedId) => {
          expect(receivedId).toBe(inputId);
          return {
            status: 'live',
            playbackUrl: 'https://customer-example.cloudflarestream.com/signed/iframe',
            expiresAt: '2026-10-26T16:00:00.000Z',
          };
        },
      }
    );
    expect(result).toMatchObject({
      status: 200,
      body: {
        status: 'live',
        inputId: null,
        setupReady: true,
        playbackUrl: 'https://customer-example.cloudflarestream.com/signed/iframe',
      },
    });
  });

  test('shows setup pending when no Cloudflare account is connected', async () => {
    delete process.env.CLOUDFLARE_ACCOUNT_ID;
    delete process.env.CLOUDFLARE_STREAM_API_TOKEN;
    delete process.env.CLOUDFLARE_STREAM_CUSTOMER_CODE;
    delete process.env.CLOUDFLARE_STREAM_LIVE_INPUT_ID;
    const result = await handleApiRequest(
      { method: 'GET', path: '/community/live-session', headers: { cookie: 'nh_session=test' } },
      {
        session: async () => ({ userId: 'admin-id' }),
        getProfile: async () => ({ role: 'admin' }),
        liveSession: async () => ({ title: 'NH Live Trade', inputId: null, updatedAt: null }),
      }
    );
    expect(result).toMatchObject({
      status: 200,
      body: { status: 'offline', setupReady: false, playbackUrl: null },
    });
  });
});
