import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { spawn } from 'node:child_process';
import { copyFile, mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const port = 3187;
const baseUrl = `http://127.0.0.1:${port}`;
let server;
let testDirectory;

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

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  return { response, data: await response.json() };
}

beforeAll(async () => {
  testDirectory = await mkdtemp(join(tmpdir(), 'nh-terminal-test-'));
  const testDb = join(testDirectory, 'db.json');
  await copyFile('server/data/db.json', testDb);
  server = spawn(process.execPath, ['server/index.js'], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: String(port), NH_DB_PATH: testDb },
    stdio: 'ignore',
  });
  await waitForServer();
});

afterAll(async () => { server?.kill(); await rm(testDirectory, { recursive: true, force: true }); });

describe('demo account API', () => {
  test('accepts the documented demo administrator account', async () => {
    const { response, data } = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@nhterminal.local', password: 'NHAdmin123!' }),
    });
    expect(response.status).toBe(200);
    expect(data.user.role).toBe('admin');
    expect(data.token).toBeTruthy();
  });

  test('rejects invalid credentials without exposing account details', async () => {
    const { response, data } = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@nhterminal.local', password: 'wrong-password' }),
    });
    expect(response.status).toBe(401);
    expect(data.code).toBe('INVALID_CREDENTIALS');
  });

  test('reads and safely writes the current demo profile and preferences', async () => {
    const current = await request('/auth/me');
    const profile = current.data;
    const updated = await request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({ name: profile.name, username: profile.username, email: profile.email, role: 'super-admin' }),
    });
    expect(updated.response.status).toBe(200);
    expect(updated.data.role).toBe('admin');

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
      body: JSON.stringify({ currentPassword: 'incorrect', newPassword: 'NewDemo123!' }),
    });
    expect(password.response.status).toBe(400);
    expect(password.data.code).toBe('INVALID_PASSWORD');

    const logout = await request('/auth/logout', { method: 'POST', body: '{}' });
    expect(logout.response.status).toBe(200);
    expect(logout.data.success).toBe(true);
  });
});

describe('demo signal lifecycle API', () => {
  test('validates, creates, updates, filters, and deletes a signal', async () => {
    const invalid = await request('/signals', {
      method: 'POST',
      body: JSON.stringify({ symbol: 'XAUUSD', direction: 'BUY' }),
    });
    expect(invalid.response.status).toBe(400);
    expect(invalid.data.code).toBe('VALIDATION_ERROR');

    const created = await request('/signals', {
      method: 'POST',
      body: JSON.stringify({
        source: 'expert', symbol: 'EURUSD', direction: 'BUY', session: 'London',
        entry: 1.1, stopLoss: 1.09, targets: [1.11, 1.12], analysis: 'Automated test signal',
      }),
    });
    expect(created.response.status).toBe(201);
    expect(created.data.history[0].status).toBe('running');

    const updated = await request(`/signals/${created.data.id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'cancelled', result: 'cancelled' }),
    });
    expect(updated.response.status).toBe(200);
    expect(updated.data.status).toBe('cancelled');
    expect(updated.data.history.at(-1).status).toBe('cancelled');

    const history = await request('/signals?source=expert&history=true&result=cancelled');
    expect(history.data.items.some((item) => item.id === created.data.id)).toBe(true);

    const removed = await request(`/signals/${created.data.id}`, { method: 'DELETE' });
    expect(removed.data.success).toBe(true);
  });
});

describe('market calendar API', () => {
  test('filters WIB periods, countries, impacts, and exposes freshness metadata', async () => {
    const today = await request('/market/calendar?period=Today');
    expect(today.response.status).toBe(200);
    expect(today.data.timezone).toBe('Asia/Jakarta');
    expect(today.data.updatedAt).toBeTruthy();
    expect(today.data.countries).toContain('United States');

    const japan = await request('/market/calendar?country=Japan&impact=medium');
    expect(japan.response.status).toBe(200);
    expect(japan.data.items).toHaveLength(1);
    expect(japan.data.items[0].id).toBe('evt-4');

    const search = await request('/market/calendar?period=This%20Week&search=retail');
    expect(search.data.items.some((item) => item.id === 'evt-5')).toBe(true);
  });
});

describe('community demo API', () => {
  test('creates forum comments and replies with persisted parent relationships', async () => {
    const comment = await request('/community/forum/post-1/comments', { method: 'POST', body: JSON.stringify({ body: 'Test comment' }) });
    expect(comment.response.status).toBe(201);
    const reply = await request('/community/forum/post-1/comments', { method: 'POST', body: JSON.stringify({ body: 'Test reply', parentId: comment.data.id }) });
    expect(reply.response.status).toBe(201);
    expect(reply.data.parentId).toBe(comment.data.id);
    const thread = await request('/community/forum/post-1/comments');
    expect(thread.data.items.some((item) => item.id === reply.data.id)).toBe(true);
  });

  test('returns delivered messages and clears unread conversation state', async () => {
    const sent = await request('/conversations/conv-admin/messages', { method: 'POST', body: JSON.stringify({ body: 'Delivery test' }) });
    expect(sent.data.status).toBe('delivered');
    const read = await request('/conversations/conv-admin/read', { method: 'POST', body: '{}' });
    expect(read.data.success).toBe(true);
    const conversations = await request('/conversations');
    expect(conversations.data.items.find((item) => item.id === 'conv-admin').unreadCount).toBe(0);
  });

  test('validates, publishes, opens, and marks announcements as read', async () => {
    const invalid = await request('/community/announcements', { method: 'POST', body: JSON.stringify({ title: '', body: '' }) });
    expect(invalid.response.status).toBe(400);
    const created = await request('/community/announcements', { method: 'POST', body: JSON.stringify({ title: 'Test notice', body: 'Community regression test' }) });
    expect(created.response.status).toBe(201);
    const detail = await request(`/community/announcements/${created.data.id}`);
    expect(detail.data.title).toBe('Test notice');
    const read = await request(`/community/announcements/${created.data.id}/read`, { method: 'POST', body: '{}' });
    expect(read.data.success).toBe(true);
  });
});
