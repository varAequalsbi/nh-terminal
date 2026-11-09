import { createHash } from 'node:crypto';
import { ApiError } from './api-error.js';
import { authenticationCookies, readSessionToken, validateCsrfToken } from './security/session.js';
import { sendVerificationEmail } from './email/mailer.js';
import { logEvent } from './logging.js';
import { openApiDocument } from './openapi.js';
import { validateListQuery, validateRequestInput } from './validation.js';
import { livePlayback, streamConfigured } from './cloudflare/stream.js';
import { verifyTurnstile } from './cloudflare/turnstile.js';

const page = (items, query = {}) => {
  const offset = Number(query.cursor || 0);
  const limit = Number(query.limit || 50);
  const sliced = items.slice(offset, offset + limit);
  return {
    items: sliced,
    total: items.length,
    nextCursor: offset + limit < items.length ? String(offset + limit) : null,
  };
};

const validateSignal = (input) => {
  const required = ['symbol', 'direction', 'entry', 'stopLoss', 'session', 'analysis'];
  if (required.some((key) => input[key] === undefined || input[key] === ''))
    return 'Complete all required signal fields';
  if (!['BUY', 'SELL'].includes(input.direction)) return 'Direction must be BUY or SELL';
  if (![input.entry, input.stopLoss, ...(input.targets || [])].every(Number.isFinite))
    return 'Entry, stop loss, and targets must be valid numbers';
  if (!input.targets?.length) return 'At least TP1 is required';
  if (
    input.direction === 'BUY' &&
    !(input.stopLoss < input.entry && input.targets.every((value) => value > input.entry))
  )
    return 'BUY signals require stop loss below entry and targets above entry';
  if (
    input.direction === 'SELL' &&
    !(input.stopLoss > input.entry && input.targets.every((value) => value < input.entry))
  )
    return 'SELL signals require stop loss above entry and targets below entry';
  return null;
};

const liveQuote = (quote) => {
  const tick = Math.floor(Date.now() / 60_000);
  const movement =
    Math.sin(tick / 3) * quote.price * 0.00045 + Math.sin(tick / 7) * quote.price * 0.0002;
  const price = quote.price + movement;
  return {
    ...quote,
    price,
    change: price - quote.open,
    high: Math.max(quote.high, price),
    low: Math.min(quote.low, price),
    updatedAt: new Date().toISOString(),
  };
};

const candles = (quote, count = 64) =>
  Array.from({ length: count }, (_, index) => {
    const tick = Math.floor(Date.now() / 60_000) - (count - 1 - index);
    const wave =
      (Math.sin(tick / 3) * 0.00045 + Math.sin(tick / 7) * 0.0002 + Math.sin(index / 5) * 0.001) *
      quote.price;
    const close = quote.open + (quote.price - quote.open) * (index / (count - 1)) + wave;
    const spread = Math.max(quote.price * 0.00035, 0.0001);
    return {
      timestamp: new Date(Date.now() - (count - 1 - index) * 60_000).toISOString(),
      open: close - spread / 3,
      high: close + spread,
      low: close - spread,
      close,
    };
  });

const ok = (status, body, headers = {}) => ({ status, body, headers });
const ipHash = (headers) => {
  const value = headers['x-forwarded-for'] || headers['X-Forwarded-For'];
  return value
    ? createHash('sha256').update(String(value).split(',')[0].trim()).digest('hex')
    : null;
};
const rateKey = (scope, headers, identity = '') =>
  createHash('sha256')
    .update(`${scope}|${ipHash(headers) || 'local'}|${String(identity).trim().toLowerCase()}`)
    .digest('hex');
const requireCsrf = (headers) => {
  if (!validateCsrfToken(headers))
    throw new ApiError(
      403,
      'CSRF_VALIDATION_FAILED',
      'Security token validation failed. Refresh the page and try again'
    );
};

export async function handleApiRequest(request, repository, dependencies = {}) {
  const { method, path, headers = {}, requestId } = request;
  const deliverVerificationEmail = dependencies.sendVerificationEmail || sendVerificationEmail;
  const botCheck = dependencies.verifyTurnstile || verifyTurnstile;
  const streamPlayback = dependencies.livePlayback || livePlayback;
  let query = request.query || {};
  let input = request.input || {};
  const token = readSessionToken(headers);
  try {
    if (path === '/health')
      return ok(200, {
        status: 'ok',
        ...(await repository.health()),
        timestamp: new Date().toISOString(),
      });
    if (path === '/openapi.json' && method === 'GET') return ok(200, openApiDocument);
    input = validateRequestInput(method, path, input);
    query = validateListQuery(path, query);
    if (path === '/auth/login' && method === 'POST') {
      if (!input.email || !input.password)
        throw new ApiError(400, 'VALIDATION_ERROR', 'Email and password are required');
      const key = rateKey('login', headers, input.email);
      await repository.consumeAuthRateLimit('login', key, 8, 15 * 60);
      await botCheck(input.turnstileToken, 'login');
      try {
        const result = await repository.login(input.email, input.password, {
          userAgent: headers['user-agent'],
          ipHash: ipHash(headers),
        });
        await repository.clearAuthRateLimit('login', key);
        await repository.recordAuthEvent('auth.login.succeeded', {
          actorId: result.user.id,
          ipHash: ipHash(headers),
        });
        return ok(
          200,
          { user: result.user },
          { 'Set-Cookie': authenticationCookies(result.token).cookies }
        );
      } catch (error) {
        await repository.recordAuthEvent('auth.login.failed', {
          ipHash: ipHash(headers),
          metadata: {
            identityHash: createHash('sha256')
              .update(input.email.trim().toLowerCase())
              .digest('hex'),
          },
        });
        throw error;
      }
    }
    if (path === '/auth/register' && method === 'POST') {
      if (!input.name?.trim() || !input.email?.trim() || !input.password)
        throw new ApiError(400, 'VALIDATION_ERROR', 'Name, email, and password are required');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim()))
        throw new ApiError(400, 'VALIDATION_ERROR', 'Enter a valid email address');
      if (input.password.length < 12)
        throw new ApiError(400, 'VALIDATION_ERROR', 'Password must contain at least 12 characters');
      const key = rateKey('register', headers, input.email);
      await repository.consumeAuthRateLimit('register', key, 5, 60 * 60);
      await botCheck(input.turnstileToken, 'register');
      const result = await repository.register(input, {
        userAgent: headers['user-agent'],
        ipHash: ipHash(headers),
      });
      await repository.clearAuthRateLimit('register', key);
      await repository.recordAuthEvent('auth.registration.succeeded', {
        actorId: result.user.id,
        ipHash: ipHash(headers),
      });
      let verificationEmailDelivered = true;
      try {
        await deliverVerificationEmail({
          email: result.user.email,
          name: result.user.name,
          token: result.verificationToken,
        });
      } catch (error) {
        verificationEmailDelivered = false;
        logEvent('error', 'email.verification.delivery_failed', {
          requestId,
          userId: result.user.id,
          error: error?.message || String(error),
        });
      }
      return ok(201, {
        user: result.user,
        requiresVerification: true,
        verificationEmailDelivered,
        message: verificationEmailDelivered
          ? 'Check your email to activate your account.'
          : 'Account created, but the verification email could not be delivered. Start the local email service and resend verification.',
        ...(process.env.APP_ENV === 'test'
          ? { developmentVerificationToken: result.verificationToken }
          : {}),
      });
    }
    if (path === '/auth/verify-email' && method === 'POST')
      return ok(200, {
        success: true,
        user: await repository.verifyEmail(input.token),
        message: 'Email verified. You can now sign in.',
      });
    if (path === '/auth/resend-verification' && method === 'POST') {
      const key = rateKey('email-verification', headers, input.email);
      await repository.consumeAuthRateLimit('email-verification', key, 5, 60 * 60);
      await botCheck(input.turnstileToken, 'resend_verification');
      const verification = await repository.requestEmailVerification(input.email);
      if (verification) {
        try {
          await deliverVerificationEmail({
            email: verification.email,
            name: 'NH Terminal member',
            token: verification.token,
          });
        } catch (error) {
          logEvent('error', 'email.verification.delivery_failed', {
            requestId,
            userId: verification.userId,
            error: error?.message || String(error),
          });
          throw new ApiError(
            503,
            'EMAIL_DELIVERY_UNAVAILABLE',
            'Verification email service is temporarily unavailable. Please try again.'
          );
        }
      }
      return ok(202, {
        message: 'If that pending account exists, a new verification email has been sent.',
        ...(process.env.APP_ENV === 'test' && verification
          ? { developmentVerificationToken: verification.token }
          : {}),
      });
    }
    if (path === '/auth/forgot-password' && method === 'POST') {
      if (!input.email?.trim()) throw new ApiError(400, 'VALIDATION_ERROR', 'Email is required');
      const key = rateKey('password-reset', headers, input.email);
      await repository.consumeAuthRateLimit('password-reset', key, 5, 60 * 60);
      await botCheck(input.turnstileToken, 'forgot_password');
      if (!['local', 'test'].includes(process.env.APP_ENV))
        throw new ApiError(503, 'RECOVERY_NOT_CONFIGURED', 'Password recovery is not configured');
      const developmentResetToken = await repository.requestPasswordReset(input.email.trim());
      return ok(202, {
        message: 'If that account exists, password reset instructions are available.',
        ...(developmentResetToken ? { developmentResetToken } : {}),
      });
    }
    if (path === '/auth/reset-password' && method === 'POST') {
      if (!input.token || !input.newPassword)
        throw new ApiError(400, 'VALIDATION_ERROR', 'Reset token and new password are required');
      if (input.newPassword.length < 12)
        throw new ApiError(400, 'VALIDATION_ERROR', 'Password must contain at least 12 characters');
      await repository.resetPassword(input.token, input.newPassword);
      return ok(
        200,
        { success: true, message: 'Password reset. Sign in with your new password.' },
        { 'Set-Cookie': authenticationCookies('', { clear: true }).cookies }
      );
    }
    if (path === '/auth/refresh' && method === 'POST') {
      requireCsrf(headers);
      const result = await repository.rotateSession(token, {
        userAgent: headers['user-agent'],
        ipHash: ipHash(headers),
      });
      return ok(
        200,
        { user: result.user, rotated: true },
        { 'Set-Cookie': authenticationCookies(result.token).cookies }
      );
    }
    if (path === '/auth/logout' && method === 'POST') {
      requireCsrf(headers);
      await repository.logout(token);
      return ok(
        200,
        { success: true },
        { 'Set-Cookie': authenticationCookies('', { clear: true }).cookies }
      );
    }
    if (path === '/auth/sessions' && method === 'GET')
      return ok(200, { items: await repository.listSessions(token) });
    if (path === '/auth/sessions/others' && method === 'DELETE') {
      requireCsrf(headers);
      return ok(200, { success: true, revoked: await repository.revokeOtherSessions(token) });
    }
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) requireCsrf(headers);
    await repository.session(token);
    if (path === '/auth/me' || path === '/profile')
      return ok(200, await repository.getProfile(token));
    if (path === '/auth/profile' && method === 'PUT')
      return ok(200, await repository.updateProfile(token, input));
    if (path === '/auth/preferences' && method === 'PUT')
      return ok(200, await repository.updatePreferences(token, input));
    if (path === '/auth/password' && method === 'POST') {
      await repository.changePassword(token, input.currentPassword, input.newPassword);
      return ok(
        200,
        { success: true, message: 'Password updated; sign in again on every device' },
        { 'Set-Cookie': authenticationCookies('', { clear: true }).cookies }
      );
    }
    if (path === '/tiers') return ok(200, page(await repository.tiers()));

    if (path === '/signals' && method === 'GET') {
      if (query.archived === 'true') {
        const profile = await repository.getProfile(token);
        if (!['admin', 'super-admin'].includes(profile.role))
          throw new ApiError(403, 'FORBIDDEN', 'Only administrators may view archived signals');
      }
      return ok(200, page(await repository.signals(query), query));
    }
    if (path === '/signals' && method === 'POST') {
      const validationError = validateSignal(input);
      if (validationError) throw new ApiError(400, 'VALIDATION_ERROR', validationError);
      return ok(201, await repository.createSignal(token, input));
    }
    const archiveSignalId = path.match(/^\/signals\/([^/]+)\/archive$/)?.[1];
    if (archiveSignalId && method === 'POST')
      return ok(200, await repository.archiveSignal(token, archiveSignalId, input.reason));
    const signalId = path.match(/^\/signals\/([^/]+)$/)?.[1];
    if (signalId && method === 'GET') return ok(200, await repository.signal(signalId));
    if (signalId && method === 'PUT') {
      const current = await repository.signal(signalId);
      if (
        input.entry !== undefined ||
        input.stopLoss !== undefined ||
        input.targets !== undefined
      ) {
        const validationError = validateSignal({ ...current, ...input });
        if (validationError) throw new ApiError(400, 'VALIDATION_ERROR', validationError);
      }
      return ok(200, await repository.updateSignal(token, signalId, input));
    }
    if (signalId && method === 'DELETE')
      throw new ApiError(405, 'METHOD_NOT_ALLOWED', 'Archive a completed signal instead');

    const priceSymbol = path.match(/^\/market\/price\/([^/]+)$/)?.[1];
    if (priceSymbol) return ok(200, liveQuote(await repository.quote(priceSymbol)));
    const candleSymbol = path.match(/^\/market\/candles\/([^/]+)$/)?.[1];
    if (candleSymbol) return ok(200, candles(liveQuote(await repository.quote(candleSymbol))));
    if (path === '/market/calendar') {
      const allItems = await repository.calendar();
      let items = allItems;
      if (query.impact) items = items.filter((item) => item.impact === query.impact);
      if (query.search)
        items = items.filter((item) =>
          item.event.toLowerCase().includes(String(query.search).toLowerCase())
        );
      if (query.country) items = items.filter((item) => item.country === query.country);
      if (query.period) {
        const offset = 7 * 60 * 60 * 1000;
        const now = new Date(Date.now() + offset);
        const dayKey = (date) =>
          new Date(new Date(date).getTime() + offset).toISOString().slice(0, 10);
        const today = now.toISOString().slice(0, 10);
        const tomorrow = new Date(now.getTime() + 86_400_000).toISOString().slice(0, 10);
        const weekEnd = new Date(now.getTime() + 6 * 86_400_000).toISOString().slice(0, 10);
        if (query.period === 'Today') items = items.filter((item) => dayKey(item.date) === today);
        if (query.period === 'Tomorrow')
          items = items.filter((item) => dayKey(item.date) === tomorrow);
        if (query.period === 'This Week')
          items = items.filter(
            (item) => dayKey(item.date) >= today && dayKey(item.date) <= weekEnd
          );
      }
      return ok(200, {
        ...page(items, query),
        updatedAt: allItems.reduce(
          (latest, item) => (!latest || item.receivedAt > latest ? item.receivedAt : latest),
          null
        ),
        demoData: allItems.length > 0 && allItems.every((item) => item.demo),
        timezone: 'Asia/Jakarta',
        countries: [...new Set(allItems.map((item) => item.country))].sort(),
      });
    }
    if (path === '/market/outlook') return ok(200, await repository.marketContent('outlook'));
    if (path === '/market/research') return ok(200, await repository.marketContent('research'));
    if (path.startsWith('/market/sentiment/')) {
      return ok(200, {
        symbol: path.split('/').at(-1),
        bullish: 68,
        bearish: 32,
        demo: true,
        source: 'Illustrative sample sentiment',
        updatedAt: null,
      });
    }

    if (path === '/community/forum' && method === 'GET')
      return ok(200, page(await repository.forumPosts(), query));
    if (path === '/community/forum' && method === 'POST') {
      if (!input.body?.trim()) throw new ApiError(400, 'VALIDATION_ERROR', 'Post cannot be empty');
      return ok(201, await repository.createForumPost(token, input));
    }
    const forumPostId = path.match(/^\/community\/forum\/([^/]+)$/)?.[1];
    if (forumPostId && method === 'PUT') {
      if (!input.body?.trim()) throw new ApiError(400, 'VALIDATION_ERROR', 'Post cannot be empty');
      return ok(200, await repository.updateForumPost(token, forumPostId, input));
    }
    if (forumPostId && method === 'DELETE') {
      await repository.deleteForumPost(token, forumPostId);
      return ok(200, { success: true });
    }
    const postCommentsId = path.match(/^\/community\/forum\/([^/]+)\/comments$/)?.[1];
    if (postCommentsId && method === 'GET')
      return ok(200, page(await repository.comments(postCommentsId), query));
    if (postCommentsId && method === 'POST') {
      if (!input.body?.trim())
        throw new ApiError(400, 'VALIDATION_ERROR', 'Comment cannot be empty');
      return ok(201, await repository.createComment(token, postCommentsId, input));
    }
    const commentMatch = path.match(/^\/community\/forum\/([^/]+)\/comments\/([^/]+)$/);
    if (commentMatch && method === 'PUT') {
      if (!input.body?.trim())
        throw new ApiError(400, 'VALIDATION_ERROR', 'Comment cannot be empty');
      return ok(
        200,
        await repository.updateComment(token, commentMatch[1], commentMatch[2], input)
      );
    }
    if (commentMatch && method === 'DELETE') {
      await repository.deleteComment(token, commentMatch[1], commentMatch[2]);
      return ok(200, { success: true });
    }

    if (path === '/conversations')
      return ok(200, page(await repository.conversations(token), query));
    const readConversationId = path.match(/^\/conversations\/([^/]+)\/read$/)?.[1];
    if (readConversationId && method === 'POST') {
      await repository.markConversationRead(token, readConversationId);
      return ok(200, { success: true });
    }
    const conversationId = path.match(/^\/conversations\/([^/]+)\/messages$/)?.[1];
    if (conversationId && method === 'GET')
      return ok(200, page(await repository.messages(token, conversationId), query));
    if (conversationId && method === 'POST')
      return ok(201, await repository.createMessage(token, conversationId, input));

    if (path === '/community/announcements' && method === 'GET')
      return ok(200, page(await repository.announcements(), query));
    if (path === '/community/announcements' && method === 'POST') {
      if (!input.title?.trim() || !input.body?.trim())
        throw new ApiError(400, 'VALIDATION_ERROR', 'Title and body are required');
      return ok(201, await repository.createAnnouncement(token, input));
    }
    const announcementId = path.match(/^\/community\/announcements\/([^/]+)$/)?.[1];
    if (announcementId && method === 'GET')
      return ok(200, await repository.announcement(announcementId));
    const readAnnouncementId = path.match(/^\/community\/announcements\/([^/]+)\/read$/)?.[1];
    if (readAnnouncementId && method === 'POST') {
      await repository.markAnnouncementRead(token, readAnnouncementId);
      return ok(200, { success: true });
    }
    if (path === '/courses') return ok(200, page(await repository.courses(token), query));
    if (path === '/community/live-session' && method === 'GET') {
      const live = await repository.liveSession();
      const profile = await repository.getProfile(token);
      const configuredInputId = process.env.CLOUDFLARE_STREAM_LIVE_INPUT_ID?.trim();
      const inputId = configuredInputId || live.inputId;
      const setupReady = Boolean(inputId) && streamConfigured();
      const playback = setupReady
        ? await streamPlayback(inputId)
        : { status: 'offline', playbackUrl: null, expiresAt: null };
      return ok(200, {
        title: live.title,
        status: playback.status,
        playbackUrl: playback.playbackUrl,
        expiresAt: playback.expiresAt,
        inputId: ['admin', 'super-admin'].includes(profile.role) ? inputId : null,
        setupReady,
        updatedAt: live.updatedAt,
      });
    }
    if (path === '/community/live-session' && method === 'PUT')
      return ok(200, await repository.updateLiveSession(token, input.inputId));
    throw new ApiError(404, 'NOT_FOUND', `No route for ${method} ${path}`);
  } catch (error) {
    if (error instanceof ApiError)
      return ok(
        error.status,
        {
          code: error.code,
          message: error.message,
          ...(error.details ? { details: error.details } : {}),
          ...(requestId ? { requestId } : {}),
        },
        error.retryAfter ? { 'Retry-After': String(error.retryAfter) } : {}
      );
    logEvent('error', 'api.request.failed', {
      requestId,
      method,
      path,
      error: error?.message || String(error),
    });
    return ok(500, {
      code: 'INTERNAL_ERROR',
      message: 'API request failed',
      ...(requestId ? { requestId } : {}),
    });
  }
}
