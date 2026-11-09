const json = (schema = { type: 'object' }) => ({ 'application/json': { schema } });
const response = (description) => ({ description, content: json() });
const operation = (summary, { auth = true, body = false } = {}) => ({
  summary,
  ...(auth ? { security: [{ sessionCookie: [], csrfToken: [] }] } : {}),
  ...(body ? { requestBody: { required: true, content: json() } } : {}),
  responses: {
    200: response('Success'),
    400: response('Validation error'),
    401: response('Authentication required'),
    403: response('Forbidden'),
  },
});

export const openApiDocument = {
  openapi: '3.1.0',
  info: {
    title: 'NH Terminal API',
    version: '1.0.0',
    description: 'Local PostgreSQL API contract. Market fixtures are not production-live data.',
  },
  servers: [{ url: '/api' }],
  components: {
    securitySchemes: {
      sessionCookie: { type: 'apiKey', in: 'cookie', name: 'nh_session' },
      csrfToken: { type: 'apiKey', in: 'header', name: 'X-CSRF-Token' },
    },
  },
  paths: {
    '/health': { get: operation('Database health', { auth: false }) },
    '/auth/login': { post: operation('Sign in', { auth: false, body: true }) },
    '/auth/register': { post: operation('Register pending account', { auth: false, body: true }) },
    '/auth/verify-email': { post: operation('Verify email', { auth: false, body: true }) },
    '/auth/resend-verification': {
      post: operation('Resend verification', { auth: false, body: true }),
    },
    '/auth/forgot-password': {
      post: operation('Request password reset', { auth: false, body: true }),
    },
    '/auth/reset-password': { post: operation('Reset password', { auth: false, body: true }) },
    '/auth/refresh': { post: operation('Rotate session', { body: true }) },
    '/auth/logout': { post: operation('Log out', { body: true }) },
    '/auth/me': { get: operation('Current profile') },
    '/auth/profile': { put: operation('Update current profile', { body: true }) },
    '/auth/preferences': { put: operation('Update preferences', { body: true }) },
    '/auth/password': { post: operation('Change password', { body: true }) },
    '/auth/sessions': { get: operation('Active sessions') },
    '/auth/sessions/others': { delete: operation('Revoke other sessions') },
    '/tiers': { get: operation('Reward tiers') },
    '/signals': {
      get: operation('List signals'),
      post: operation('Publish signal', { body: true }),
    },
    '/signals/{id}': {
      get: operation('Signal detail'),
      put: operation('Update signal', { body: true }),
    },
    '/signals/{id}/archive': { post: operation('Archive a terminal signal', { body: true }) },
    '/market/calendar': { get: operation('Economic calendar') },
    '/market/price/{symbol}': { get: operation('Latest stored quote') },
    '/market/candles/{symbol}': { get: operation('Derived local candles') },
    '/market/outlook': { get: operation('Market outlook') },
    '/market/research': { get: operation('Market research') },
    '/market/sentiment/{symbol}': { get: operation('Local sentiment fixture') },
    '/community/forum': {
      get: operation('Forum feed'),
      post: operation('Create post', { body: true }),
    },
    '/community/forum/{id}': {
      put: operation('Edit post', { body: true }),
      delete: operation('Delete post'),
    },
    '/community/forum/{id}/comments': {
      get: operation('Comments'),
      post: operation('Create comment', { body: true }),
    },
    '/community/forum/{id}/comments/{commentId}': {
      put: operation('Edit comment', { body: true }),
      delete: operation('Delete comment'),
    },
    '/conversations': { get: operation('Conversations') },
    '/conversations/{id}/messages': {
      get: operation('Messages'),
      post: operation('Send message', { body: true }),
    },
    '/conversations/{id}/read': { post: operation('Mark conversation read', { body: true }) },
    '/community/announcements': {
      get: operation('Announcements'),
      post: operation('Publish announcement', { body: true }),
    },
    '/community/announcements/{id}': { get: operation('Announcement detail') },
    '/community/announcements/{id}/read': {
      post: operation('Mark announcement read', { body: true }),
    },
    '/courses': { get: operation('Courses') },
    '/community/live-session': {
      get: operation('Current Live Trade video'),
      put: operation('Set or clear protected Cloudflare live input (admin only)', { body: true }),
    },
  },
};
