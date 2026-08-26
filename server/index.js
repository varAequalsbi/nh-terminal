import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { readDb, updateDb } from './repository.js';

const port = Number(process.env.PORT || 3000);
const demoEmail = process.env.DEMO_ACCOUNT_EMAIL || 'admin@nhterminal.local';
let demoPassword = process.env.DEMO_ACCOUNT_PASSWORD || 'NHAdmin123!';
const json = (res, status, body) => {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(JSON.stringify(body));
};
const body = (req) =>
  new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (x) => (raw += x));
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
const page = (items) => ({ items, total: items.length });
const validateSignal = (input) => {
  const required = ['symbol', 'direction', 'entry', 'stopLoss', 'session', 'analysis'];
  if (required.some((key) => input[key] === undefined || input[key] === '')) return 'Complete all required signal fields';
  if (!['BUY', 'SELL'].includes(input.direction)) return 'Direction must be BUY or SELL';
  if (![input.entry, input.stopLoss, ...(input.targets || [])].every(Number.isFinite)) return 'Entry, stop loss, and targets must be valid numbers';
  if (!input.targets?.length) return 'At least TP1 is required';
  if (input.direction === 'BUY' && !(input.stopLoss < input.entry && input.targets.every((x) => x > input.entry))) return 'BUY signals require stop loss below entry and targets above entry';
  if (input.direction === 'SELL' && !(input.stopLoss > input.entry && input.targets.every((x) => x < input.entry))) return 'SELL signals require stop loss above entry and targets below entry';
};
const withLivePips = (item) => item.status === 'running'
  ? { ...item, pips: item.pips + Math.round(Math.sin(Date.now() / 60_000 + item.entry) * 3), updatedAt: new Date().toISOString() }
  : item;
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
  Array.from({ length: count }, (_, i) => {
    const tick = Math.floor(Date.now() / 60_000) - (count - 1 - i);
    const wave =
      (Math.sin(tick / 3) * 0.00045 + Math.sin(tick / 7) * 0.0002 + Math.sin(i / 5) * 0.001) *
      quote.price;
    const close = quote.open + (quote.price - quote.open) * (i / (count - 1)) + wave;
    const spread = Math.max(quote.price * 0.00035, 0.0001);
    return {
      timestamp: new Date(Date.now() - (count - 1 - i) * 60_000).toISOString(),
      open: close - spread / 3,
      high: close + spread,
      low: close - spread,
      close,
    };
  });

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    });
    return res.end();
  }
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname.replace(/^\/api/, '');
  try {
    const db = await readDb();
    if (path === '/health')
      return json(res, 200, {
        status: 'ok',
        storage: 'local-json',
        timestamp: new Date().toISOString(),
      });
    if (path === '/auth/login' && req.method === 'POST') {
      const input = await body(req);
      if (!input.email || !input.password)
        return json(res, 400, {
          code: 'VALIDATION_ERROR',
          message: 'Email and password are required',
        });
      if (input.email.toLowerCase() !== demoEmail.toLowerCase() || input.password !== demoPassword)
        return json(res, 401, {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        });
      return json(res, 200, {
        token: 'local-development-session',
        user: { ...db.profile, email: demoEmail },
      });
    }
    if (path === '/auth/logout' && req.method === 'POST')
      return json(res, 200, { success: true });
    if (path === '/auth/profile' && req.method === 'PUT') {
      const input = await body(req);
      const allowed = ['name', 'username', 'email'];
      await updateDb((x) => {
        for (const key of allowed) if (typeof input[key] === 'string') x.profile[key] = input[key].trim();
      });
      return json(res, 200, (await readDb()).profile);
    }
    if (path === '/auth/preferences' && req.method === 'PUT') {
      const input = await body(req);
      await updateDb((x) => {
        x.profile.preferences = { ...x.profile.preferences, ...input };
      });
      return json(res, 200, (await readDb()).profile.preferences);
    }
    if (path === '/auth/password' && req.method === 'POST') {
      const input = await body(req);
      if (input.currentPassword !== demoPassword)
        return json(res, 400, { code: 'INVALID_PASSWORD', message: 'Current password is incorrect' });
      if (typeof input.newPassword !== 'string' || input.newPassword.length < 8)
        return json(res, 400, { code: 'WEAK_PASSWORD', message: 'New password must be at least 8 characters' });
      demoPassword = input.newPassword;
      return json(res, 200, { success: true, message: 'Demo password updated for this server session' });
    }
    if (path === '/auth/me' || path === '/profile') return json(res, 200, db.profile);
    if (path === '/tiers') return json(res, 200, page(db.tiers));
    if (path === '/signals' && req.method === 'GET') {
      let items = db.signals;
      for (const key of ['source', 'status', 'session', 'result'])
        if (url.searchParams.get(key))
          items = items.filter(
            (x) => x[key].toLowerCase() === url.searchParams.get(key).toLowerCase()
          );
      const search = url.searchParams.get('search');
      if (search)
        items = items.filter((x) =>
          `${x.symbol} ${x.analysis}`.toLowerCase().includes(search.toLowerCase())
        );
      if (url.searchParams.get('history') === 'true')
        items = items.filter((x) => ['completed', 'cancelled', 'expired'].includes(x.status));
      const result = url.searchParams.get('result');
      if (result) items = items.filter((x) => x.result === result);
      return json(
        res,
        200,
        page(items.map(withLivePips).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
      );
    }
    if (path === '/signals' && req.method === 'POST') {
      const input = await body(req);
      const validationError = validateSignal(input);
      if (validationError) return json(res, 400, { code: 'VALIDATION_ERROR', message: validationError });
      const created = {
        id: randomUUID(),
        status: 'running',
        result: 'open',
        pips: 0,
        createdAt: new Date().toISOString(),
        history: [{ status: 'running', at: new Date().toISOString(), note: 'Signal published' }],
        ...input,
      };
      await updateDb((x) => {
        x.signals.unshift(created);
      });
      return json(res, 201, created);
    }
    const signalId = path.match(/^\/signals\/([^/]+)$/)?.[1];
    if (signalId) {
      const item = db.signals.find((x) => x.id === signalId);
      if (!item) return json(res, 404, { code: 'NOT_FOUND', message: 'Signal not found' });
      if (req.method === 'GET') return json(res, 200, withLivePips(item));
      if (req.method === 'PUT') {
        const input = await body(req);
        const next = { ...item, ...input };
        if (input.entry !== undefined || input.stopLoss !== undefined || input.targets !== undefined) {
          const validationError = validateSignal(next);
          if (validationError) return json(res, 400, { code: 'VALIDATION_ERROR', message: validationError });
        }
        await updateDb((x) => {
          const target = x.signals.find((signal) => signal.id === signalId);
          Object.assign(target, input, { updatedAt: new Date().toISOString() });
          if (input.status) {
            target.result = input.status === 'completed' ? (input.result || 'win') : input.status === 'cancelled' ? 'cancelled' : target.result;
            target.history = [...(target.history || []), { status: input.status, at: new Date().toISOString(), note: input.note || `Signal ${input.status}` }];
          }
        });
        return json(res, 200, (await readDb()).signals.find((x) => x.id === signalId));
      }
      if (req.method === 'DELETE') {
        await updateDb((x) => { x.signals = x.signals.filter((signal) => signal.id !== signalId); });
        return json(res, 200, { success: true });
      }
    }
    const priceSymbol = path.match(/^\/market\/price\/([^/]+)$/)?.[1];
    if (priceSymbol) {
      const item = db.market[priceSymbol.toUpperCase()];
      return item
        ? json(res, 200, liveQuote(item))
        : json(res, 404, { code: 'NOT_FOUND', message: 'Symbol not found' });
    }
    const candleSymbol = path.match(/^\/market\/candles\/([^/]+)$/)?.[1];
    if (candleSymbol) {
      const item = db.market[candleSymbol.toUpperCase()];
      return item
        ? json(res, 200, candles(item))
        : json(res, 404, { code: 'NOT_FOUND', message: 'Symbol not found' });
    }
    if (path === '/market/calendar') {
      let items = db.calendar;
      const impact = url.searchParams.get('impact');
      const search = url.searchParams.get('search');
      const country = url.searchParams.get('country');
      const period = url.searchParams.get('period');
      if (impact) items = items.filter((x) => x.impact === impact);
      if (search) items = items.filter((x) => x.event.toLowerCase().includes(search.toLowerCase()));
      if (country) items = items.filter((x) => x.country === country);
      if (period) {
        const wibNow = new Date(Date.now() + 7 * 60 * 60 * 1000);
        const dayKey = (date) => new Date(new Date(date).getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
        const today = wibNow.toISOString().slice(0, 10);
        const tomorrow = new Date(wibNow.getTime() + 86_400_000).toISOString().slice(0, 10);
        const weekEnd = new Date(wibNow.getTime() + 6 * 86_400_000).toISOString().slice(0, 10);
        if (period === 'Today') items = items.filter((x) => dayKey(x.date) === today);
        if (period === 'Tomorrow') items = items.filter((x) => dayKey(x.date) === tomorrow);
        if (period === 'This Week') items = items.filter((x) => dayKey(x.date) >= today && dayKey(x.date) <= weekEnd);
      }
      return json(res, 200, { ...page(items), updatedAt: new Date().toISOString(), timezone: 'Asia/Jakarta', countries: [...new Set(db.calendar.map((x) => x.country))].sort() });
    }
    if (path === '/market/outlook') return json(res, 200, db.marketOutlook);
    if (path === '/market/research') return json(res, 200, db.marketResearch);
    if (path.startsWith('/market/sentiment/')) {
      const swing = Math.round(Math.sin(Date.now() / 30000) * 4);
      return json(res, 200, {
        symbol: path.split('/').at(-1),
        bullish: 68 + swing,
        bearish: 32 - swing,
        source: 'NH local aggregate',
        updatedAt: new Date().toISOString(),
      });
    }
    if (path === '/community/forum' && req.method === 'GET') return json(res, 200, page(db.posts));
    if (path === '/community/forum' && req.method === 'POST') {
      const input = await body(req);
      const created = {
        id: randomUUID(),
        author: db.profile.name,
        tier: db.profile.tier,
        reactions: 0,
        comments: 0,
        createdAt: new Date().toISOString(),
        ...input,
      };
      await updateDb((x) => x.posts.unshift(created));
      return json(res, 201, created);
    }
    const postCommentsId = path.match(/^\/community\/forum\/([^/]+)\/comments$/)?.[1];
    if (postCommentsId && req.method === 'GET')
      return json(res, 200, page((db.comments || []).filter((x) => x.postId === postCommentsId)));
    if (postCommentsId && req.method === 'POST') {
      const input = await body(req);
      if (!input.body?.trim()) return json(res, 400, { code: 'VALIDATION_ERROR', message: 'Comment cannot be empty' });
      const created = { id: randomUUID(), postId: postCommentsId, parentId: input.parentId || null, author: db.profile.name, role: db.profile.role, body: input.body.trim(), createdAt: new Date().toISOString() };
      await updateDb((x) => { x.comments ||= []; x.comments.push(created); const post = x.posts.find((item) => item.id === postCommentsId); if (post) post.comments = (post.comments || 0) + 1; });
      return json(res, 201, created);
    }
    if (path === '/conversations') return json(res, 200, page(db.conversations));
    const readConversationId = path.match(/^\/conversations\/([^/]+)\/read$/)?.[1];
    if (readConversationId && req.method === 'POST') {
      await updateDb((x) => { const conversation = x.conversations.find((item) => item.id === readConversationId); if (conversation) conversation.unreadCount = 0; x.messages.filter((item) => item.conversationId === readConversationId && item.senderId !== x.profile.id).forEach((item) => { item.status = 'read'; }); });
      return json(res, 200, { success: true });
    }
    const conversationId = path.match(/^\/conversations\/([^/]+)\/messages$/)?.[1];
    if (conversationId && req.method === 'GET')
      return json(res, 200, page(db.messages.filter((x) => x.conversationId === conversationId)));
    if (conversationId && req.method === 'POST') {
      const input = await body(req);
      const created = {
        id: randomUUID(),
        conversationId,
        senderId: db.profile.id,
        createdAt: new Date().toISOString(),
        status: 'delivered',
        ...input,
      };
      await updateDb((x) => x.messages.push(created));
      return json(res, 201, created);
    }
    if (path === '/community/announcements' && req.method === 'GET')
      return json(res, 200, page(db.announcements));
    if (path === '/community/announcements' && req.method === 'POST') {
      if (!['admin', 'super-admin'].includes(db.profile.role)) return json(res, 403, { code: 'FORBIDDEN', message: 'Administrator access required' });
      const input = await body(req);
      if (!input.title?.trim() || !input.body?.trim()) return json(res, 400, { code: 'VALIDATION_ERROR', message: 'Title and body are required' });
      const created = {
        id: randomUUID(),
        author: db.profile.name,
        publishedAt: new Date().toISOString(),
        pinned: false,
        readBy: [],
        ...input,
      };
      await updateDb((x) => x.announcements.unshift(created));
      return json(res, 201, created);
    }
    const announcementId = path.match(/^\/community\/announcements\/([^/]+)$/)?.[1];
    if (announcementId && req.method === 'GET') {
      const item = db.announcements.find((x) => x.id === announcementId);
      return item ? json(res, 200, item) : json(res, 404, { code: 'NOT_FOUND', message: 'Announcement not found' });
    }
    const readAnnouncementId = path.match(/^\/community\/announcements\/([^/]+)\/read$/)?.[1];
    if (readAnnouncementId && req.method === 'POST') {
      await updateDb((x) => { const item = x.announcements.find((announcement) => announcement.id === readAnnouncementId); if (item && !(item.readBy || []).includes(x.profile.id)) item.readBy = [...(item.readBy || []), x.profile.id]; });
      return json(res, 200, { success: true });
    }
    if (path === '/courses') return json(res, 200, page(db.courses));
    if (path === '/community/live-session') return json(res, 200, db.liveSession);
    return json(res, 404, { code: 'NOT_FOUND', message: `No route for ${req.method} ${path}` });
  } catch (error) {
    console.error(error);
    return json(res, 500, { code: 'INTERNAL_ERROR', message: 'Local API request failed' });
  }
});
server.listen(port, '0.0.0.0', () => console.log(`NH local API ready at http://localhost:${port}`));
