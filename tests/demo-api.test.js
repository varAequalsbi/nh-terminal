import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { spawn } from 'node:child_process';
import { closeDatabase, database } from '../server/database/client.js';

const port = 3187;
const baseUrl = `http://127.0.0.1:${port}`;
let server;
let sessionCookie;
const cookieJar = new Map();

async function waitForServer() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/health`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('Demo API did not become ready');
}

async function requestWithJar(jar, path, options = {}) {
  const csrfToken = jar.get('nh_csrf');
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(jar.size
        ? { Cookie: [...jar].map(([name, value]) => `${name}=${value}`).join('; ') }
        : {}),
      ...(csrfToken && options.csrf !== false ? { 'X-CSRF-Token': csrfToken } : {}),
      ...options.headers,
    },
  });
  const setCookies =
    response.headers.getSetCookie?.() ||
    (response.headers.get('set-cookie') ? [response.headers.get('set-cookie')] : []);
  for (const value of setCookies) {
    const [pair] = value.split(';');
    const [name, ...cookieValue] = pair.split('=');
    if (/Max-Age=0/i.test(value)) jar.delete(name);
    else jar.set(name, cookieValue.join('='));
  }
  if (jar === cookieJar)
    sessionCookie = cookieJar.has('nh_session')
      ? `nh_session=${cookieJar.get('nh_session')}`
      : null;
  return { response, data: await response.json() };
}

const request = (path, options = {}) => requestWithJar(cookieJar, path, options);

beforeAll(async () => {
  server = spawn(process.execPath, ['server/index.js'], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: String(port) },
    stdio: 'ignore',
  });
  await waitForServer();
});

afterAll(async () => {
  server?.kill();
  await closeDatabase();
});

describe('demo account API', () => {
  test('registers a PostgreSQL-backed member account and signs it in', async () => {
    const email = `member-${Date.now()}@nhterminal.local`;
    const registered = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'Local Member', email, password: 'MemberPass123!' }),
    });
    expect(registered.response.status).toBe(201);
    expect(registered.data.user.email).toBe(email);
    expect(registered.data.user.role).toBe('member');
    expect(registered.data.requiresVerification).toBe(true);
    expect(sessionCookie).toBeNull();

    const pendingLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: 'MemberPass123!' }),
    });
    expect(pendingLogin.response.status).toBe(401);

    const duplicate = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'Duplicate Member', email, password: 'MemberPass123!' }),
    });
    expect(duplicate.response.status).toBe(409);
    expect(duplicate.data.code).toBe('PENDING_ACCOUNT_EXISTS');

    const verified = await request('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token: registered.data.developmentVerificationToken }),
    });
    expect(verified.response.status).toBe(200);
    const repeatedVerification = await request('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token: registered.data.developmentVerificationToken }),
    });
    expect(repeatedVerification.response.status).toBe(200);
    const initialLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: 'MemberPass123!' }),
    });
    expect(initialLogin.response.status).toBe(200);
    expect(sessionCookie).toMatch(/^nh_session=/);

    const sessions = await request('/auth/sessions');
    expect(sessions.response.status).toBe(200);
    expect(sessions.data.items.some((item) => item.current)).toBe(true);

    const missingCsrf = await request('/auth/logout', { method: 'POST', body: '{}', csrf: false });
    expect(missingCsrf.response.status).toBe(403);
    expect(missingCsrf.data.code).toBe('CSRF_VALIDATION_FAILED');

    const forgot = await request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    expect(forgot.response.status).toBe(202);
    expect(forgot.data.developmentResetToken).toBeTruthy();
    const reset = await request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        token: forgot.data.developmentResetToken,
        newPassword: 'MemberPass456!',
      }),
    });
    expect(reset.response.status).toBe(200);
    const relogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: 'MemberPass456!' }),
    });
    expect(relogin.response.status).toBe(200);

    const forbiddenSignal = await request('/signals', {
      method: 'POST',
      body: JSON.stringify({
        source: 'expert',
        symbol: 'EURUSD',
        direction: 'BUY',
        session: 'London',
        entry: 1.1,
        stopLoss: 1.09,
        targets: [1.11],
        analysis: 'Member must not publish',
      }),
    });
    expect(forbiddenSignal.response.status).toBe(403);
    expect(forbiddenSignal.data.code).toBe('FORBIDDEN');
  });

  test('accepts the documented demo administrator account', async () => {
    const { response, data } = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@nhterminal.local', password: 'NHAdmin1234!' }),
    });
    expect(response.status).toBe(200);
    expect(data.user.role).toBe('admin');
    expect(data.token).toBeUndefined();
    expect(sessionCookie).toMatch(/^nh_session=/);
  });

  test('rejects invalid credentials without exposing account details', async () => {
    const { response, data } = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@nhterminal.local', password: 'wrong-password' }),
    });
    expect(response.status).toBe(401);
    expect(data.code).toBe('INVALID_CREDENTIALS');
  });

  test('rate-limits repeated login failures', async () => {
    const statuses = [];
    const email = `rate-limit-${Date.now()}@invalid.local`;
    for (let attempt = 0; attempt < 9; attempt += 1) {
      const response = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'incorrect-password' }),
      });
      statuses.push(response.status);
    }
    expect(statuses.slice(0, 8).every((status) => status === 401)).toBe(true);
    expect(statuses[8]).toBe(429);
  });

  test('rejects protected data without a valid session', async () => {
    const response = await fetch(`${baseUrl}/signals`);
    const data = await response.json();
    expect(response.status).toBe(401);
    expect(data.code).toBe('UNAUTHENTICATED');
  });

  test('rejects requests from unapproved browser origins', async () => {
    const response = await fetch(`${baseUrl}/health`, {
      headers: { Origin: 'https://untrusted.example' },
    });
    const data = await response.json();
    expect(response.status).toBe(403);
    expect(data.code).toBe('ORIGIN_NOT_ALLOWED');
  });

  test('publishes OpenAPI and returns field validation with request IDs', async () => {
    const specification = await fetch(`${baseUrl}/openapi.json`);
    const document = await specification.json();
    expect(document.openapi).toBe('3.1.0');
    expect(document.paths['/signals']).toBeTruthy();

    const invalid = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Request-ID': 'validation-test-001' },
      body: JSON.stringify({
        name: 'Bad Input',
        email: 'not-an-email',
        password: 'short',
        role: 'admin',
      }),
    });
    const data = await invalid.json();
    expect(invalid.status).toBe(400);
    expect(invalid.headers.get('x-request-id')).toBe('validation-test-001');
    expect(data.requestId).toBe('validation-test-001');
    expect(data.details.length).toBeGreaterThan(0);
  });

  test('lists sessions and revokes other browser sessions', async () => {
    await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'Second test browser' },
      body: JSON.stringify({ email: 'admin@nhterminal.local', password: 'NHAdmin1234!' }),
    });
    const before = await request('/auth/sessions');
    expect(before.data.items.length).toBeGreaterThanOrEqual(2);
    const revoked = await request('/auth/sessions/others', { method: 'DELETE' });
    expect(revoked.response.status).toBe(200);
    expect(revoked.data.revoked).toBeGreaterThanOrEqual(1);
    const after = await request('/auth/sessions');
    expect(after.data.items).toHaveLength(1);
    expect(after.data.items[0].current).toBe(true);
  });

  test('rotates a session and revokes its family when the old token is replayed', async () => {
    const rotatingJar = new Map();
    const registered = await requestWithJar(rotatingJar, '/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Rotation Test',
        email: `rotation-${Date.now()}@nhterminal.local`,
        password: 'MemberPass123!',
      }),
    });
    expect(registered.response.status).toBe(201);
    await requestWithJar(rotatingJar, '/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token: registered.data.developmentVerificationToken }),
    });
    await requestWithJar(rotatingJar, '/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: registered.data.user.email, password: 'MemberPass123!' }),
    });
    const oldJar = new Map(rotatingJar);
    const oldToken = oldJar.get('nh_session');

    const refreshed = await requestWithJar(rotatingJar, '/auth/refresh', {
      method: 'POST',
      body: '{}',
    });
    expect(refreshed.response.status).toBe(200);
    expect(refreshed.data.rotated).toBe(true);
    expect(rotatingJar.get('nh_session')).not.toBe(oldToken);

    const current = await requestWithJar(rotatingJar, '/auth/me');
    expect(current.response.status).toBe(200);

    const replay = await requestWithJar(oldJar, '/auth/refresh', { method: 'POST', body: '{}' });
    expect(replay.response.status).toBe(401);
    expect(replay.data.code).toBe('SESSION_REUSE_DETECTED');

    const revokedReplacement = await requestWithJar(rotatingJar, '/auth/me');
    expect(revokedReplacement.response.status).toBe(401);
    expect(revokedReplacement.data.code).toBe('SESSION_EXPIRED');

    const sql = database();
    const [audit] = await sql`
      select action from audit_logs
      where actor_id = ${registered.data.user.id} and action = 'auth.session.reuse_detected'
      order by created_at desc limit 1
    `;
    expect(audit?.action).toBe('auth.session.reuse_detected');
  });

  test('reads and safely writes the current demo profile and preferences', async () => {
    const current = await request('/auth/me');
    const profile = current.data;
    const updated = await request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({
        name: profile.name,
        username: profile.username,
        email: profile.email,
        role: 'super-admin',
      }),
    });
    expect(updated.response.status).toBe(400);
    expect(updated.data.code).toBe('VALIDATION_ERROR');
    const safeUpdate = await request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({
        name: profile.name,
        username: profile.username,
        email: profile.email,
      }),
    });
    expect(safeUpdate.response.status).toBe(200);
    expect(safeUpdate.data.role).toBe('admin');

    const preferences = await request('/auth/preferences', {
      method: 'PUT',
      body: JSON.stringify(profile.preferences),
    });
    expect(preferences.response.status).toBe(200);
    expect(preferences.data.language).toBe(profile.preferences.language);
  });

  test('validates password changes and supports logout', async () => {
    const password = await request('/auth/password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword: 'incorrect', newPassword: 'NewDemo12345!' }),
    });
    expect(password.response.status).toBe(400);
    expect(password.data.code).toBe('INVALID_PASSWORD');

    const logout = await request('/auth/logout', { method: 'POST', body: '{}' });
    expect(logout.response.status).toBe(200);
    expect(logout.data.success).toBe(true);
    const login = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@nhterminal.local', password: 'NHAdmin1234!' }),
    });
    expect(login.response.status).toBe(200);
  });
});

describe('expert signal lifecycle API', () => {
  test('validates, creates, updates, filters, and archives a signal without erasing history', async () => {
    const seeded = await request('/signals?source=expert');
    const oldSample = seeded.data.items.find((item) =>
      item.analysis.startsWith('Price is testing the current intraday resistance area')
    );
    expect(oldSample).toMatchObject({ demo: true, historicalSample: true, status: 'running' });
    const invalid = await request('/signals', {
      method: 'POST',
      body: JSON.stringify({ symbol: 'XAUUSD', direction: 'BUY' }),
    });
    expect(invalid.response.status).toBe(400);
    expect(invalid.data.code).toBe('VALIDATION_ERROR');
    const forgedSource = await request('/signals', {
      method: 'POST',
      body: JSON.stringify({
        source: 'ai',
        symbol: 'EURUSD',
        direction: 'BUY',
        session: 'London',
        entry: 1.1,
        stopLoss: 1.09,
        targets: [1.11],
        analysis: 'Forged source',
      }),
    });
    expect(forgedSource.response.status).toBe(400);

    const created = await request('/signals', {
      method: 'POST',
      body: JSON.stringify({
        source: 'expert',
        symbol: 'EURUSD',
        direction: 'BUY',
        session: 'London',
        entry: 1.1,
        stopLoss: 1.09,
        targets: [1.11, 1.12],
        analysis: 'Automated test signal',
      }),
    });
    expect(created.response.status).toBe(201);
    expect(created.data.history[0].status).toBe('running');
    expect(created.data.demo).toBe(false);
    expect(created.data.authorName).toBeTruthy();
    expect(created.data.authorId).toBeTruthy();
    expect(created.data.source).toBe('expert');

    const activeArchive = await request(`/signals/${created.data.id}/archive`, {
      method: 'POST',
      body: JSON.stringify({ reason: 'Test archive before close' }),
    });
    expect(activeArchive.response.status).toBe(409);

    const updated = await request(`/signals/${created.data.id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'cancelled', note: 'Setup was invalidated' }),
    });
    expect(updated.response.status).toBe(200);
    expect(updated.data.status).toBe('cancelled');
    expect(updated.data.history.at(-1).status).toBe('cancelled');

    const history = await request('/signals?source=expert&history=true&result=cancelled');
    expect(history.data.items.some((item) => item.id === created.data.id)).toBe(true);

    const archived = await request(`/signals/${created.data.id}/archive`, {
      method: 'POST',
      body: JSON.stringify({ reason: 'Historical cleanup' }),
    });
    expect(archived.data.archived).toBe(true);
    const hidden = await request(`/signals/${created.data.id}`);
    expect(hidden.response.status).toBe(404);
    const archivedFeed = await request('/signals?source=expert&archived=true');
    const archivedItem = archivedFeed.data.items.find((item) => item.id === created.data.id);
    expect(archivedItem?.archived).toBe(true);
    expect(archivedItem?.history.at(-1).note).toContain('Historical cleanup');
    const sql = database();
    const [preserved] = await sql`
      select s.visibility, count(h.id)::int as events from signals s
      join signal_history h on h.signal_id = s.id where s.id = ${created.data.id}
      group by s.visibility
    `;
    expect(preserved).toMatchObject({ visibility: 'archived', events: 3 });
  });

  test('calculates pips from execution prices and rejects terminal-state rewrites', async () => {
    const created = await request('/signals', {
      method: 'POST',
      body: JSON.stringify({
        source: 'expert',
        symbol: 'EURUSD',
        direction: 'BUY',
        session: 'London',
        entry: 1.1,
        stopLoss: 1.09,
        targets: [1.11],
        analysis: 'Pip calculation test',
      }),
    });
    const completed = await request(`/signals/${created.data.id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'completed', exitPrice: 1.105 }),
    });
    expect(completed.response.status).toBe(200);
    expect(completed.data.pips).toBe(50);
    expect(completed.data.result).toBe('win');
    expect(completed.data.exitPrice).toBe(1.105);
    expect(completed.data.history.at(-1).actorName).toBeTruthy();

    const invalidTransition = await request(`/signals/${created.data.id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'cancelled' }),
    });
    expect(invalidTransition.response.status).toBe(409);
    expect(invalidTransition.data.code).toBe('INVALID_SIGNAL_TRANSITION');
    await request(`/signals/${created.data.id}/archive`, {
      method: 'POST',
      body: JSON.stringify({ reason: 'Test cleanup' }),
    });

    const lossSignal = await request('/signals', {
      method: 'POST',
      body: JSON.stringify({
        symbol: 'EURUSD',
        direction: 'BUY',
        session: 'London',
        entry: 1.1,
        stopLoss: 1.09,
        targets: [1.11],
        analysis: 'Loss outcome test',
      }),
    });
    const loss = await request(`/signals/${lossSignal.data.id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'completed', exitPrice: 1.095, note: 'Manual close' }),
    });
    expect(loss.data.result).toBe('loss');
    expect(loss.data.pips).toBe(-50);
    await request(`/signals/${lossSignal.data.id}/archive`, {
      method: 'POST',
      body: JSON.stringify({ reason: 'Test cleanup' }),
    });
  });
});

describe('market calendar API', () => {
  test('identifies seeded market commentary and illustrative sentiment', async () => {
    const outlook = await request('/market/outlook');
    const research = await request('/market/research');
    const sentiment = await request('/market/sentiment/XAUUSD');
    expect(outlook.data.demo).toBe(true);
    expect(research.data.demo).toBe(true);
    expect(sentiment.data).toMatchObject({
      demo: true,
      bullish: 68,
      bearish: 32,
      source: 'Illustrative sample sentiment',
      updatedAt: null,
    });
  });

  test('filters WIB periods, countries, impacts, and exposes freshness metadata', async () => {
    const today = await request('/market/calendar?period=Today');
    expect(today.response.status).toBe(200);
    expect(today.data.timezone).toBe('Asia/Jakarta');
    expect(today.data.updatedAt).toBeTruthy();
    expect(today.data.demoData).toBe(true);
    expect(today.data.countries).toContain('United States');

    const japan = await request('/market/calendar?country=Japan&impact=medium');
    expect(japan.response.status).toBe(200);
    expect(japan.data.items).toHaveLength(1);
    expect(japan.data.items[0].event).toBe('Tokyo Core CPI');
    expect(japan.data.items[0].source).toBe('Local sample data');

    const search = await request('/market/calendar?search=retail');
    expect(search.data.items.some((item) => item.event === 'Retail Sales')).toBe(true);
  });
});

describe('community demo API', () => {
  test('creates forum comments and replies with persisted parent relationships', async () => {
    const posts = await request('/community/forum');
    const postId = posts.data.items[0].id;
    const comment = await request(`/community/forum/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ body: 'Test comment' }),
    });
    expect(comment.response.status).toBe(201);
    const reply = await request(`/community/forum/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ body: 'Test reply', parentId: comment.data.id }),
    });
    expect(reply.response.status).toBe(201);
    expect(reply.data.parentId).toBe(comment.data.id);
    const thread = await request(`/community/forum/${postId}/comments`);
    expect(thread.data.items.some((item) => item.id === reply.data.id)).toBe(true);
  });

  test('enforces granular roles, ownership, reply integrity, and conversation membership', async () => {
    const suffix = Date.now();
    const ownerJar = new Map();
    const otherJar = new Map();
    const expertJar = new Map();
    const register = async (jar, name, email) => {
      const created = await requestWithJar(jar, '/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password: 'MemberPass123!' }),
      });
      await requestWithJar(jar, '/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ token: created.data.developmentVerificationToken }),
      });
      await requestWithJar(jar, '/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password: 'MemberPass123!' }),
      });
      return created;
    };

    const owner = await register(ownerJar, 'Forum Owner', `owner-${suffix}@nhterminal.local`);
    const other = await register(otherJar, 'Other Member', `other-${suffix}@nhterminal.local`);
    const expert = await register(expertJar, 'Signal Expert', `expert-${suffix}@nhterminal.local`);
    expect([owner.response.status, other.response.status, expert.response.status]).toEqual([
      201, 201, 201,
    ]);

    const sql = database();
    await sql`delete from user_roles where user_id = ${expert.data.user.id}`;
    await sql`insert into user_roles (user_id, role_id) select ${expert.data.user.id}, id from roles where code = 'expert'`;

    const noBroadcast = await request('/community/live-session');
    expect(noBroadcast.data).toMatchObject({ status: 'offline', playbackUrl: null });
    const memberBroadcast = await requestWithJar(ownerJar, '/community/live-session', {
      method: 'PUT',
      body: JSON.stringify({ inputId: '0123456789abcdef0123456789abcdef' }),
    });
    expect(memberBroadcast.response.status).toBe(403);
    const expertBroadcast = await requestWithJar(expertJar, '/community/live-session', {
      method: 'PUT',
      body: JSON.stringify({ inputId: '0123456789abcdef0123456789abcdef' }),
    });
    expect(expertBroadcast.response.status).toBe(403);
    const invalidBroadcast = await request('/community/live-session', {
      method: 'PUT',
      body: JSON.stringify({ inputId: 'not-a-cloudflare-id' }),
    });
    expect(invalidBroadcast.response.status).toBe(400);
    const memberView = await requestWithJar(ownerJar, '/community/live-session');
    expect(memberView.data).toMatchObject({ status: 'offline', inputId: null });
    const clearedBroadcast = await request('/community/live-session', {
      method: 'PUT',
      body: JSON.stringify({ inputId: '' }),
    });
    expect(clearedBroadcast.data).toMatchObject({ inputId: null });

    const adminSignals = await request('/signals');
    const forbiddenSignalEdit = await requestWithJar(
      expertJar,
      `/signals/${adminSignals.data.items[0].id}`,
      {
        method: 'PUT',
        body: JSON.stringify({ analysis: 'Must not overwrite another expert signal' }),
      }
    );
    expect(forbiddenSignalEdit.response.status).toBe(403);
    const forbiddenArchiveFeed = await requestWithJar(expertJar, '/signals?archived=true');
    expect(forbiddenArchiveFeed.response.status).toBe(403);

    const ownedSignal = await requestWithJar(expertJar, '/signals', {
      method: 'POST',
      body: JSON.stringify({
        source: 'expert',
        symbol: 'EURUSD',
        direction: 'BUY',
        session: 'London',
        entry: 1.1,
        stopLoss: 1.09,
        targets: [1.11],
        analysis: 'Expert-owned signal',
      }),
    });
    expect(ownedSignal.response.status).toBe(201);
    const ownedSignalEdit = await requestWithJar(expertJar, `/signals/${ownedSignal.data.id}`, {
      method: 'PUT',
      body: JSON.stringify({ analysis: 'Owner edit allowed' }),
    });
    expect(ownedSignalEdit.response.status).toBe(200);

    const firstPost = await requestWithJar(ownerJar, '/community/forum', {
      method: 'POST',
      body: JSON.stringify({ body: 'Owner post' }),
    });
    const secondPost = await requestWithJar(otherJar, '/community/forum', {
      method: 'POST',
      body: JSON.stringify({ body: 'Other post' }),
    });
    const foreignEdit = await requestWithJar(otherJar, `/community/forum/${firstPost.data.id}`, {
      method: 'PUT',
      body: JSON.stringify({ body: 'Unauthorized edit' }),
    });
    expect(foreignEdit.response.status).toBe(403);
    const ownerEdit = await requestWithJar(ownerJar, `/community/forum/${firstPost.data.id}`, {
      method: 'PUT',
      body: JSON.stringify({ body: 'Owner-edited post' }),
    });
    expect(ownerEdit.response.status).toBe(200);

    const firstComment = await requestWithJar(
      ownerJar,
      `/community/forum/${firstPost.data.id}/comments`,
      { method: 'POST', body: JSON.stringify({ body: 'First post comment' }) }
    );
    const crossPostReply = await requestWithJar(
      otherJar,
      `/community/forum/${secondPost.data.id}/comments`,
      {
        method: 'POST',
        body: JSON.stringify({ body: 'Invalid cross-post reply', parentId: firstComment.data.id }),
      }
    );
    expect(crossPostReply.response.status).toBe(400);
    expect(crossPostReply.data.code).toBe('INVALID_PARENT_COMMENT');
    const foreignCommentDelete = await requestWithJar(
      otherJar,
      `/community/forum/${firstPost.data.id}/comments/${firstComment.data.id}`,
      { method: 'DELETE' }
    );
    expect(foreignCommentDelete.response.status).toBe(403);
    const ownerCommentDelete = await requestWithJar(
      ownerJar,
      `/community/forum/${firstPost.data.id}/comments/${firstComment.data.id}`,
      { method: 'DELETE' }
    );
    expect(ownerCommentDelete.response.status).toBe(200);

    const memberAnnouncement = await requestWithJar(ownerJar, '/community/announcements', {
      method: 'POST',
      body: JSON.stringify({ title: 'No', body: 'Member cannot publish' }),
    });
    expect(memberAnnouncement.response.status).toBe(403);

    const adminConversations = await request('/conversations');
    const privateConversationId = adminConversations.data.items[0].id;
    const forbiddenMessages = await requestWithJar(
      ownerJar,
      `/conversations/${privateConversationId}/messages`
    );
    const forbiddenRead = await requestWithJar(
      ownerJar,
      `/conversations/${privateConversationId}/read`,
      { method: 'POST', body: '{}' }
    );
    expect(forbiddenMessages.response.status).toBe(403);
    expect(forbiddenRead.response.status).toBe(403);

    const moderatedDelete = await request(`/community/forum/${secondPost.data.id}`, {
      method: 'DELETE',
    });
    expect(moderatedDelete.response.status).toBe(200);
  });

  test('returns delivered messages and clears unread conversation state', async () => {
    const list = await request('/conversations');
    const conversationId = list.data.items[0].id;
    const sent = await request(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ body: 'Delivery test' }),
    });
    expect(sent.data.status).toBe('delivered');
    const read = await request(`/conversations/${conversationId}/read`, {
      method: 'POST',
      body: '{}',
    });
    expect(read.data.success).toBe(true);
    const conversations = await request('/conversations');
    expect(conversations.data.items.find((item) => item.id === conversationId).unreadCount).toBe(0);
  });

  test('validates, publishes, opens, and marks announcements as read', async () => {
    const invalid = await request('/community/announcements', {
      method: 'POST',
      body: JSON.stringify({ title: '', body: '' }),
    });
    expect(invalid.response.status).toBe(400);
    const created = await request('/community/announcements', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test notice', body: 'Community regression test' }),
    });
    expect(created.response.status).toBe(201);
    const detail = await request(`/community/announcements/${created.data.id}`);
    expect(detail.data.title).toBe('Test notice');
    const read = await request(`/community/announcements/${created.data.id}/read`, {
      method: 'POST',
      body: '{}',
    });
    expect(read.data.success).toBe(true);
  });
});
