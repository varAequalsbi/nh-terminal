import seed from '../../server/data/db.json';

const storageKey = 'nh.client-preview.v1';
const demoEmail = 'admin@nhterminal.local';
const demoPassword = 'NHAdmin1234!';

const readState = () => {
  try {
    return JSON.parse(sessionStorage.getItem(storageKey)) || structuredClone(seed);
  } catch {
    return structuredClone(seed);
  }
};

const saveState = (state) => sessionStorage.setItem(storageKey, JSON.stringify(state));
const inputOf = (config) => {
  if (typeof config.data === 'string') {
    try {
      return JSON.parse(config.data);
    } catch {
      return {};
    }
  }
  return config.data || {};
};
const page = (items, params = {}) => {
  const offset = Number(params.cursor || 0);
  const limit = Number(params.limit || 50);
  return {
    items: items.slice(offset, offset + limit),
    total: items.length,
    nextCursor: offset + limit < items.length ? String(offset + limit) : null,
  };
};
const response = (config, data, status = 200) => ({
  data,
  status,
  statusText: status === 201 ? 'Created' : 'OK',
  headers: {},
  config,
});
const reject = (config, status, message) =>
  Promise.reject({
    config,
    response: { status, data: { code: 'PREVIEW_ONLY', message } },
    message,
  });
const id = (prefix) => `${prefix}-preview-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const now = () => new Date().toISOString();

export async function previewAdapter(config) {
  const state = readState();
  const method = (config.method || 'get').toUpperCase();
  const url = new URL(config.url || '/', window.location.origin);
  const path = url.pathname;
  const params = { ...Object.fromEntries(url.searchParams), ...config.params };
  const input = inputOf(config);
  const reply = (data, status) => response(config, data, status);
  const save = (data, status) => {
    saveState(state);
    return reply(data, status);
  };

  if (path === '/auth/login' && method === 'POST') {
    if (input.email !== demoEmail || input.password !== demoPassword)
      return reject(config, 401, 'Use the Demo Account button for this client preview.');
    sessionStorage.setItem('nh.client-preview.signed-in', 'true');
    return reply({ user: state.profile });
  }
  if (path === '/auth/logout' && method === 'POST') {
    sessionStorage.removeItem('nh.client-preview.signed-in');
    return reply({ success: true });
  }
  if (path === '/auth/me' || path === '/profile') return reply(state.profile);
  if (path === '/auth/refresh' && method === 'POST') return reply({ user: state.profile });
  if (path === '/auth/profile' && method === 'PUT') {
    state.profile = { ...state.profile, ...input };
    return save(state.profile);
  }
  if (path === '/auth/preferences' && method === 'PUT') {
    state.profile.preferences = { ...state.profile.preferences, ...input };
    return save(state.profile);
  }
  if (path.startsWith('/auth/'))
    return reject(config, 403, 'Account changes are unavailable in this client preview.');

  if (path === '/tiers') return reply(page(state.tiers, params));
  if (path === '/signals' && method === 'GET') {
    let items = [...state.signals];
    if (params.source) items = items.filter((item) => item.source === params.source);
    if (params.archived === 'true' || params.archived === true)
      items = items.filter((item) => item.archived);
    else items = items.filter((item) => !item.archived);
    if (params.history === 'true' || params.history === true)
      items = items.filter((item) => item.status !== 'running');
    else if (!params.status && !params.history)
      items = items.filter((item) => item.status === 'running');
    if (params.status) items = items.filter((item) => item.status === params.status);
    if (params.result) items = items.filter((item) => item.result === params.result);
    if (params.session) items = items.filter((item) => item.session === params.session);
    if (params.search)
      items = items.filter((item) =>
        `${item.symbol} ${item.analysis}`
          .toLowerCase()
          .includes(String(params.search).toLowerCase())
      );
    return reply(page(items, params));
  }
  if (path === '/signals' && method === 'POST') {
    const signal = {
      ...input,
      id: id('sig'),
      source: 'expert',
      authorId: state.profile.id,
      authorName: state.profile.name,
      status: 'running',
      result: 'open',
      pips: 0,
      createdAt: now(),
      publishedAt: now(),
      demo: true,
    };
    state.signals.unshift(signal);
    return save(signal, 201);
  }
  const signalArchive = path.match(/^\/signals\/([^/]+)\/archive$/);
  if (signalArchive && method === 'POST') {
    const signal = state.signals.find((item) => item.id === signalArchive[1]);
    if (!signal) return reject(config, 404, 'Signal not found.');
    signal.archived = true;
    signal.archiveReason = input.reason;
    signal.archivedAt = now();
    return save({ id: signal.id, archived: true });
  }
  const signalMatch = path.match(/^\/signals\/([^/]+)$/);
  if (signalMatch) {
    const signal = state.signals.find((item) => item.id === signalMatch[1]);
    if (!signal) return reject(config, 404, 'Signal not found.');
    if (method === 'GET') return reply(signal);
    if (method === 'PUT') {
      Object.assign(signal, input);
      if (input.status === 'completed' && Number.isFinite(Number(input.exitPrice))) {
        const direction = signal.direction === 'SELL' ? -1 : 1;
        const multiplier = signal.symbol?.includes('JPY')
          ? 100
          : signal.symbol?.includes('XAU')
            ? 10
            : 10_000;
        signal.pips = Math.round((Number(input.exitPrice) - signal.entry) * direction * multiplier);
        signal.result = signal.pips > 0 ? 'win' : signal.pips < 0 ? 'loss' : 'cancelled';
      }
      return save(signal);
    }
  }

  const priceMatch = path.match(/^\/market\/price\/([^/]+)$/);
  if (priceMatch) return reply(state.market[priceMatch[1]] || state.market.XAUUSD);
  const candleMatch = path.match(/^\/market\/candles\/([^/]+)$/);
  if (candleMatch) {
    const quote = state.market[candleMatch[1]] || state.market.XAUUSD;
    return reply(
      Array.from({ length: 48 }, (_, index) => ({
        timestamp: new Date(Date.now() - (47 - index) * 300_000).toISOString(),
        open: quote.price,
        high: quote.price * 1.0004,
        low: quote.price * 0.9996,
        close: quote.price,
      }))
    );
  }
  if (path === '/market/calendar') {
    let items = state.calendar.map((item, index) => ({
      ...item,
      date: new Date(Date.now() + (index % 3) * 86_400_000).toISOString(),
      demo: true,
      source: 'Sample event',
    }));
    if (params.impact) items = items.filter((item) => item.impact === params.impact);
    if (params.country) items = items.filter((item) => item.country === params.country);
    if (params.search)
      items = items.filter((item) =>
        item.event.toLowerCase().includes(String(params.search).toLowerCase())
      );
    if (params.period === 'Today') items = items.filter((_, index) => index < 2);
    if (params.period === 'Tomorrow') items = items.filter((_, index) => index === 2);
    return reply({
      ...page(items, params),
      demoData: true,
      updatedAt: null,
      timezone: 'Asia/Jakarta',
      countries: [...new Set(state.calendar.map((item) => item.country))].sort(),
    });
  }
  if (path === '/market/outlook') return reply({ ...state.marketOutlook, demo: true });
  if (path === '/market/research') return reply({ ...state.marketResearch, demo: true });
  if (path.startsWith('/market/sentiment/'))
    return reply({
      symbol: path.split('/').at(-1),
      bullish: 68,
      bearish: 32,
      demo: true,
      source: 'Illustrative sample sentiment',
      updatedAt: null,
    });

  if (path === '/community/forum' && method === 'GET') return reply(page(state.posts, params));
  if (path === '/community/forum' && method === 'POST') {
    const post = {
      id: id('post'),
      author: state.profile.name,
      tier: state.profile.tier,
      body: input.body,
      reactions: 0,
      comments: 0,
      createdAt: now(),
    };
    state.posts.unshift(post);
    return save(post, 201);
  }
  const commentsMatch = path.match(/^\/community\/forum\/([^/]+)\/comments$/);
  if (commentsMatch && method === 'GET')
    return reply(
      page(
        state.comments.filter((item) => item.postId === commentsMatch[1]),
        params
      )
    );
  if (commentsMatch && method === 'POST') {
    const comment = {
      id: id('comment'),
      postId: commentsMatch[1],
      parentId: input.parentId || null,
      author: state.profile.name,
      role: state.profile.role,
      body: input.body,
      createdAt: now(),
    };
    state.comments.push(comment);
    return save(comment, 201);
  }
  if (path === '/conversations') return reply(page(state.conversations, params));
  const messagesMatch = path.match(/^\/conversations\/([^/]+)\/messages$/);
  if (messagesMatch && method === 'GET')
    return reply(
      page(
        state.messages.filter((item) => item.conversationId === messagesMatch[1]),
        params
      )
    );
  if (messagesMatch && method === 'POST') {
    const message = {
      id: id('message'),
      conversationId: messagesMatch[1],
      senderId: state.profile.id,
      body: input.body,
      createdAt: now(),
      status: 'sent',
    };
    state.messages.push(message);
    return save(message, 201);
  }
  if (path.match(/^\/conversations\/[^/]+\/read$/)) return reply({ success: true });
  if (path === '/community/announcements' && method === 'GET')
    return reply(page(state.announcements, params));
  if (path === '/community/announcements' && method === 'POST') {
    const announcement = {
      id: id('announcement'),
      author: state.profile.name,
      publishedAt: now(),
      pinned: false,
      readBy: [],
      ...input,
    };
    state.announcements.unshift(announcement);
    return save(announcement, 201);
  }
  const announcementMatch = path.match(/^\/community\/announcements\/([^/]+)$/);
  if (announcementMatch) {
    const announcement = state.announcements.find((item) => item.id === announcementMatch[1]);
    if (!announcement) return reject(config, 404, 'Announcement not found.');
    return reply(announcement);
  }
  if (path.match(/^\/community\/announcements\/[^/]+\/read$/)) return reply({ success: true });
  if (path === '/courses') return reply(page(state.courses, params));
  if (path === '/community/live-session' && method === 'GET')
    return reply({
      title: 'NH Live Trade',
      status: 'offline',
      playbackUrl: null,
      inputId: null,
      setupReady: false,
      updatedAt: null,
    });

  return reject(config, 404, 'This feature is unavailable in the client preview.');
}
