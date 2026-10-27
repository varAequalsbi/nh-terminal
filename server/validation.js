import { z } from 'zod';
import { ApiError } from './api-error.js';

const text = (min = 1, max = 500) => z.string().trim().min(min).max(max);
const email = z.string().trim().email().max(320);
const password = z.string().min(12).max(256);
const body = z.object({ body: text(1, 5_000) }).strict();
const turnstileToken = z.string().min(1).max(2048).optional();

const schemas = [
  [
    'POST',
    /^\/auth\/login$/,
    z.object({ email, password: z.string().min(1).max(256), turnstileToken }).strict(),
  ],
  [
    'POST',
    /^\/auth\/register$/,
    z
      .object({
        name: text(1, 120),
        email,
        username: text(1, 50).optional(),
        password,
        turnstileToken,
      })
      .strict(),
  ],
  ['POST', /^\/auth\/forgot-password$/, z.object({ email, turnstileToken }).strict()],
  [
    'POST',
    /^\/auth\/reset-password$/,
    z.object({ token: text(20, 500), newPassword: password }).strict(),
  ],
  ['POST', /^\/auth\/verify-email$/, z.object({ token: text(20, 500) }).strict()],
  ['POST', /^\/auth\/resend-verification$/, z.object({ email, turnstileToken }).strict()],
  ['POST', /^\/auth\/(refresh|logout)$/, z.object({}).strict()],
  [
    'POST',
    /^\/auth\/password$/,
    z.object({ currentPassword: z.string().min(1).max(256), newPassword: password }).strict(),
  ],
  [
    'PUT',
    /^\/auth\/profile$/,
    z
      .object({
        name: text(1, 120).optional(),
        email: email.optional(),
        username: text(1, 50).nullable().optional(),
      })
      .strict(),
  ],
  [
    'PUT',
    /^\/auth\/preferences$/,
    z
      .object({
        language: text(2, 10),
        timezone: z.literal('Asia/Jakarta').optional(),
        theme: z.enum(['dark', 'light']),
        emailNotifications: z.boolean(),
        pushNotifications: z.boolean(),
      })
      .strict(),
  ],
  [
    'POST',
    /^\/signals$/,
    z
      .object({
        source: z.literal('expert').optional(),
        symbol: text(3, 20),
        direction: z.enum(['BUY', 'SELL']),
        entry: z.number().finite().positive(),
        stopLoss: z.number().finite().positive(),
        targets: z.array(z.number().finite().positive()).min(1).max(5),
        session: z.enum(['Asia', 'London', 'New York']),
        analysis: text(1, 2_000),
      })
      .strict(),
  ],
  [
    'PUT',
    /^\/signals\/[^/]+$/,
    z
      .object({
        status: z.enum(['target-hit', 'stopped', 'cancelled', 'expired', 'completed']).optional(),
        exitPrice: z.number().finite().positive().optional(),
        entry: z.number().finite().positive().optional(),
        stopLoss: z.number().finite().positive().optional(),
        targets: z.array(z.number().finite().positive()).min(1).max(5).optional(),
        session: z.enum(['Asia', 'London', 'New York']).optional(),
        analysis: text(1, 2_000).optional(),
        note: text(1, 500).optional(),
      })
      .strict(),
  ],
  ['POST', /^\/signals\/[^/]+\/archive$/, z.object({ reason: text(3, 500) }).strict()],
  ['POST', /^\/community\/forum$/, body],
  ['PUT', /^\/community\/forum\/[^/]+$/, body],
  [
    'POST',
    /^\/community\/forum\/[^/]+\/comments$/,
    z.object({ body: text(1, 5_000), parentId: z.string().uuid().optional() }).strict(),
  ],
  ['PUT', /^\/community\/forum\/[^/]+\/comments\/[^/]+$/, body],
  [
    'POST',
    /^\/conversations\/[^/]+\/messages$/,
    z.object({ body: text(1, 5_000), clientRequestId: text(1, 200).optional() }).strict(),
  ],
  ['POST', /^\/conversations\/[^/]+\/read$/, z.object({}).strict()],
  [
    'POST',
    /^\/community\/announcements$/,
    z
      .object({ title: text(1, 200), body: text(1, 10_000), pinned: z.boolean().optional() })
      .strict(),
  ],
  ['POST', /^\/community\/announcements\/[^/]+\/read$/, z.object({}).strict()],
  ['PUT', /^\/community\/live-session$/, z.object({ inputId: z.string().trim().max(32) }).strict()],
];

export function validateRequestInput(method, path, input) {
  const entry = schemas.find(
    ([expectedMethod, pattern]) => expectedMethod === method && pattern.test(path)
  );
  if (!entry) return input;
  const result = entry[2].safeParse(input);
  if (result.success) return result.data;
  const details = result.error.issues.map((issue) => ({
    field: issue.path.join('.') || 'body',
    message: issue.message,
  }));
  throw new ApiError(400, 'VALIDATION_ERROR', 'Request validation failed', details);
}

export function validateListQuery(path, query) {
  const common = {
    limit: z.coerce.number().int().min(1).max(100).optional(),
    cursor: z.string().regex(/^\d+$/).optional(),
  };
  let schema;
  if (path === '/signals')
    schema = z
      .object({
        ...common,
        archived: z.enum(['true', 'false']).optional(),
        source: z.enum(['expert', 'ai']).optional(),
        status: z
          .enum(['running', 'target-hit', 'stopped', 'cancelled', 'expired', 'completed'])
          .optional(),
        session: z.enum(['Asia', 'London', 'New York']).optional(),
        result: z.enum(['open', 'win', 'loss', 'breakeven', 'cancelled', 'expired']).optional(),
        search: text(1, 100).optional(),
        history: z.enum(['true', 'false']).optional(),
      })
      .strict();
  else if (path === '/market/calendar')
    schema = z
      .object({
        ...common,
        impact: z.enum(['low', 'medium', 'high']).optional(),
        search: text(1, 100).optional(),
        country: text(1, 100).optional(),
        period: z.enum(['Today', 'Tomorrow', 'This Week']).optional(),
      })
      .strict();
  else if (
    path === '/community/forum' ||
    path === '/conversations' ||
    path === '/community/announcements' ||
    path === '/courses' ||
    /^\/community\/forum\/[^/]+\/comments$/.test(path) ||
    /^\/conversations\/[^/]+\/messages$/.test(path)
  )
    schema = z.object(common).strict();
  else return query;
  const result = schema.safeParse(query);
  if (result.success) return result.data;
  throw new ApiError(
    400,
    'VALIDATION_ERROR',
    'Query validation failed',
    result.error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message }))
  );
}

const errorResponse = z
  .object({
    code: z.string(),
    message: z.string(),
    requestId: z.string().optional(),
    details: z.array(z.object({ field: z.string(), message: z.string() })).optional(),
  })
  .strict();
const listResponse = z
  .object({
    items: z.array(z.unknown()),
    total: z.number().int().nonnegative(),
    nextCursor: z.string().nullable(),
  })
  .passthrough();

export function assertApiResponse(method, path, result) {
  if (!Number.isInteger(result?.status) || result.status < 100 || result.status > 599)
    throw new Error(`Invalid response status for ${path}`);
  if (result.status >= 400) {
    const parsed = errorResponse.safeParse(result.body);
    if (!parsed.success) throw new Error(`Invalid error response contract for ${path}`);
    return;
  }
  const listPath =
    method === 'GET' &&
    ([
      '/signals',
      '/market/calendar',
      '/community/forum',
      '/conversations',
      '/community/announcements',
      '/courses',
    ].includes(path) ||
      /^\/community\/forum\/[^/]+\/comments$/.test(path) ||
      /^\/conversations\/[^/]+\/messages$/.test(path));
  if (listPath && !listResponse.safeParse(result.body).success)
    throw new Error(`Invalid list response contract for ${path}`);
  if (
    !listPath &&
    result.body !== null &&
    (typeof result.body !== 'object' || Array.isArray(result.body))
  )
    throw new Error(`Invalid response body for ${path}`);
}
