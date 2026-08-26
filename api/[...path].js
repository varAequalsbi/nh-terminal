import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const seedPath = fileURLToPath(new URL('../server/data/db.json', import.meta.url));
const demoEmail = process.env.DEMO_ACCOUNT_EMAIL || 'admin@nhterminal.local';
let demoPassword = process.env.DEMO_ACCOUNT_PASSWORD || 'NHAdmin123!';
let database;
const db = async () => (database ||= JSON.parse(await readFile(seedPath, 'utf8')));
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

export default async function handler(req, res) {
  const data = await db();
  const path = `/${Array.isArray(req.query.path) ? req.query.path.join('/') : req.query.path || ''}`;
  res.setHeader(
    'Cache-Control',
    req.method === 'GET' ? 's-maxage=15, stale-while-revalidate=60' : 'no-store'
  );
  if (path === '/health')
    return res
      .status(200)
      .json({ status: 'ok', storage: 'vercel-seed-adapter', timestamp: new Date().toISOString() });
  if (path === '/auth/login' && req.method === 'POST') {
    if (!req.body?.email || !req.body?.password)
      return res
        .status(400)
        .json({ code: 'VALIDATION_ERROR', message: 'Email and password are required' });
    if (
      String(req.body.email).toLowerCase() !== demoEmail.toLowerCase() ||
      req.body.password !== demoPassword
    )
      return res
        .status(401)
        .json({ code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' });
    return res
      .status(200)
      .json({ token: 'vercel-preview-session', user: { ...data.profile, email: demoEmail } });
  }
  if (path === '/auth/logout' && req.method === 'POST')
    return res.status(200).json({ success: true });
  if (path === '/auth/profile' && req.method === 'PUT') {
    for (const key of ['name', 'username', 'email'])
      if (typeof req.body?.[key] === 'string') data.profile[key] = req.body[key].trim();
    return res.status(200).json(data.profile);
  }
  if (path === '/auth/preferences' && req.method === 'PUT') {
    data.profile.preferences = { ...data.profile.preferences, ...req.body };
    return res.status(200).json(data.profile.preferences);
  }
  if (path === '/auth/password' && req.method === 'POST') {
    if (req.body?.currentPassword !== demoPassword)
      return res.status(400).json({ code: 'INVALID_PASSWORD', message: 'Current password is incorrect' });
    if (typeof req.body?.newPassword !== 'string' || req.body.newPassword.length < 8)
      return res.status(400).json({ code: 'WEAK_PASSWORD', message: 'New password must be at least 8 characters' });
    demoPassword = req.body.newPassword;
    return res.status(200).json({ success: true, message: 'Demo password updated for this preview instance' });
  }
  if (path === '/auth/me' || path === '/profile') return res.status(200).json(data.profile);
  if (path === '/tiers') return res.status(200).json(page(data.tiers));
  if (path === '/signals' && req.method === 'GET') {
    let items = data.signals;
    for (const key of ['source', 'status', 'session', 'result'])
      if (req.query[key])
        items = items.filter((x) => x[key].toLowerCase() === String(req.query[key]).toLowerCase());
    if (req.query.search)
      items = items.filter((x) =>
        `${x.symbol} ${x.analysis}`.toLowerCase().includes(String(req.query.search).toLowerCase())
      );
    if (req.query.history === 'true') items = items.filter((x) => ['completed', 'cancelled', 'expired'].includes(x.status));
    if (req.query.result) items = items.filter((x) => x.result === req.query.result);
    return res.status(200).json(page(items.map(withLivePips)));
  }
  if (path === '/signals' && req.method === 'POST') {
    const validationError = validateSignal(req.body || {});
    if (validationError) return res.status(400).json({ code: 'VALIDATION_ERROR', message: validationError });
    const created = {
      id: randomUUID(),
      status: 'running',
      result: 'open',
      pips: 0,
      createdAt: new Date().toISOString(),
      history: [{ status: 'running', at: new Date().toISOString(), note: 'Signal published' }],
      ...req.body,
    };
    data.signals.unshift(created);
    return res.status(201).json(created);
  }
  const signalId = path.match(/^\/signals\/([^/]+)$/)?.[1];
  if (signalId) {
    const item = data.signals.find((x) => x.id === signalId);
    if (!item) return res.status(404).json({ code: 'NOT_FOUND', message: 'Signal not found' });
    if (req.method === 'GET') return res.status(200).json(withLivePips(item));
    if (req.method === 'PUT') {
      const next = { ...item, ...req.body };
      if (req.body.entry !== undefined || req.body.stopLoss !== undefined || req.body.targets !== undefined) {
        const validationError = validateSignal(next);
        if (validationError) return res.status(400).json({ code: 'VALIDATION_ERROR', message: validationError });
      }
      Object.assign(item, req.body, { updatedAt: new Date().toISOString() });
      if (req.body.status) {
        item.result = req.body.status === 'completed' ? (req.body.result || 'win') : req.body.status === 'cancelled' ? 'cancelled' : item.result;
        item.history = [...(item.history || []), { status: req.body.status, at: new Date().toISOString(), note: req.body.note || `Signal ${req.body.status}` }];
      }
      return res.status(200).json(item);
    }
    if (req.method === 'DELETE') {
      data.signals = data.signals.filter((x) => x.id !== signalId);
      return res.status(200).json({ success: true });
    }
  }
  const symbol = path.match(/^\/market\/price\/([^/]+)$/)?.[1];
  if (symbol) {
    const item = data.market[symbol.toUpperCase()];
    return item
      ? res.status(200).json(liveQuote(item))
      : res.status(404).json({ code: 'NOT_FOUND' });
  }
  const candleSymbol = path.match(/^\/market\/candles\/([^/]+)$/)?.[1];
  if (candleSymbol) {
    const item = data.market[candleSymbol.toUpperCase()];
    return item ? res.status(200).json(candles(item)) : res.status(404).json({ code: 'NOT_FOUND' });
  }
  if (path === '/market/calendar') {
    let items = data.calendar;
    if (req.query.impact) items = items.filter((x) => x.impact === req.query.impact);
    if (req.query.search)
      items = items.filter((x) =>
        x.event.toLowerCase().includes(String(req.query.search).toLowerCase())
      );
    if (req.query.country) items = items.filter((x) => x.country === req.query.country);
    if (req.query.period) {
      const wibNow = new Date(Date.now() + 7 * 60 * 60 * 1000);
      const dayKey = (date) => new Date(new Date(date).getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const today = wibNow.toISOString().slice(0, 10);
      const tomorrow = new Date(wibNow.getTime() + 86_400_000).toISOString().slice(0, 10);
      const weekEnd = new Date(wibNow.getTime() + 6 * 86_400_000).toISOString().slice(0, 10);
      if (req.query.period === 'Today') items = items.filter((x) => dayKey(x.date) === today);
      if (req.query.period === 'Tomorrow') items = items.filter((x) => dayKey(x.date) === tomorrow);
      if (req.query.period === 'This Week') items = items.filter((x) => dayKey(x.date) >= today && dayKey(x.date) <= weekEnd);
    }
    return res.status(200).json({ ...page(items), updatedAt: new Date().toISOString(), timezone: 'Asia/Jakarta', countries: [...new Set(data.calendar.map((x) => x.country))].sort() });
  }
  if (path === '/market/outlook') return res.status(200).json(data.marketOutlook);
  if (path === '/market/research') return res.status(200).json(data.marketResearch);
  if (path.startsWith('/market/sentiment/')) {
    const swing = Math.round(Math.sin(Date.now() / 30000) * 4);
    return res
      .status(200)
      .json({
        symbol: path.split('/').at(-1),
        bullish: 68 + swing,
        bearish: 32 - swing,
        source: 'NH preview aggregate',
        updatedAt: new Date().toISOString(),
      });
  }
  if (path === '/community/forum' && req.method === 'GET')
    return res.status(200).json(page(data.posts));
  if (path === '/community/forum' && req.method === 'POST') {
    const created = {
      id: randomUUID(),
      author: data.profile.name,
      tier: data.profile.tier,
      reactions: 0,
      comments: 0,
      createdAt: new Date().toISOString(),
      ...req.body,
    };
    data.posts.unshift(created);
    return res.status(201).json(created);
  }
  const postCommentsId = path.match(/^\/community\/forum\/([^/]+)\/comments$/)?.[1];
  if (postCommentsId && req.method === 'GET')
    return res.status(200).json(page((data.comments || []).filter((x) => x.postId === postCommentsId)));
  if (postCommentsId && req.method === 'POST') {
    if (!req.body?.body?.trim()) return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Comment cannot be empty' });
    const created = { id: randomUUID(), postId: postCommentsId, parentId: req.body.parentId || null, author: data.profile.name, role: data.profile.role, body: req.body.body.trim(), createdAt: new Date().toISOString() };
    data.comments ||= []; data.comments.push(created); const post = data.posts.find((item) => item.id === postCommentsId); if (post) post.comments = (post.comments || 0) + 1;
    return res.status(201).json(created);
  }
  if (path === '/conversations') return res.status(200).json(page(data.conversations));
  const readConversationId = path.match(/^\/conversations\/([^/]+)\/read$/)?.[1];
  if (readConversationId && req.method === 'POST') {
    const conversation = data.conversations.find((item) => item.id === readConversationId); if (conversation) conversation.unreadCount = 0;
    data.messages.filter((item) => item.conversationId === readConversationId && item.senderId !== data.profile.id).forEach((item) => { item.status = 'read'; });
    return res.status(200).json({ success: true });
  }
  const conversationId = path.match(/^\/conversations\/([^/]+)\/messages$/)?.[1];
  if (conversationId && req.method === 'GET')
    return res
      .status(200)
      .json(page(data.messages.filter((x) => x.conversationId === conversationId)));
  if (conversationId && req.method === 'POST') {
    const created = {
      id: randomUUID(),
      conversationId,
      senderId: data.profile.id,
      createdAt: new Date().toISOString(),
      status: 'delivered',
      ...req.body,
    };
    data.messages.push(created);
    return res.status(201).json(created);
  }
  if (path === '/community/announcements' && req.method === 'GET')
    return res.status(200).json(page(data.announcements));
  if (path === '/community/announcements' && req.method === 'POST') {
    if (!['admin', 'super-admin'].includes(data.profile.role)) return res.status(403).json({ code: 'FORBIDDEN', message: 'Administrator access required' });
    if (!req.body?.title?.trim() || !req.body?.body?.trim()) return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Title and body are required' });
    const created = {
      id: randomUUID(),
      author: data.profile.name,
      publishedAt: new Date().toISOString(),
      pinned: false,
      readBy: [],
      ...req.body,
    };
    data.announcements.unshift(created);
    return res.status(201).json(created);
  }
  const announcementId = path.match(/^\/community\/announcements\/([^/]+)$/)?.[1];
  if (announcementId && req.method === 'GET') {
    const item = data.announcements.find((x) => x.id === announcementId);
    return item ? res.status(200).json(item) : res.status(404).json({ code: 'NOT_FOUND', message: 'Announcement not found' });
  }
  const readAnnouncementId = path.match(/^\/community\/announcements\/([^/]+)\/read$/)?.[1];
  if (readAnnouncementId && req.method === 'POST') {
    const item = data.announcements.find((announcement) => announcement.id === readAnnouncementId); if (item && !(item.readBy || []).includes(data.profile.id)) item.readBy = [...(item.readBy || []), data.profile.id];
    return res.status(200).json({ success: true });
  }
  if (path === '/courses') return res.status(200).json(page(data.courses));
  if (path === '/community/live-session') return res.status(200).json(data.liveSession);
  return res.status(404).json({ code: 'NOT_FOUND', message: `No route for ${req.method} ${path}` });
}
