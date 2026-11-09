import { handleApiRequest } from '../server/api-application.js';
import { PostgresRepository } from '../server/database/postgres-repository.js';
import { randomUUID } from 'node:crypto';
import { logEvent, requestIdPattern } from '../server/logging.js';
import { assertApiResponse } from '../server/validation.js';

const repository = new PostgresRepository();

export default async function handler(req, res) {
  const startedAt = Date.now();
  const suppliedRequestId = String(req.headers['x-request-id'] || '');
  const requestId = requestIdPattern.test(suppliedRequestId) ? suppliedRequestId : randomUUID();
  res.setHeader('X-Request-ID', requestId);
  const requestOrigin = req.headers.origin || '';
  let sameOrigin = false;
  try {
    sameOrigin = Boolean(requestOrigin && new URL(requestOrigin).host === req.headers.host);
  } catch {}
  const configuredOrigin = process.env.API_ALLOWED_ORIGIN || '';
  const allowedOrigin = sameOrigin
    ? requestOrigin
    : configuredOrigin && requestOrigin === configuredOrigin
      ? requestOrigin
      : '';
  if (requestOrigin && !allowedOrigin)
    return res
      .status(403)
      .json({ code: 'ORIGIN_NOT_ALLOWED', message: 'Request origin is not allowed', requestId });
  if (allowedOrigin) res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-CSRF-Token');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Vary', 'Origin');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const query = { ...req.query };
  delete query.path;
  const path = `/${Array.isArray(req.query.path) ? req.query.path.join('/') : req.query.path || ''}`;
  const result = await handleApiRequest(
    { method: req.method, path, query, headers: req.headers, input: req.body || {}, requestId },
    repository
  );
  assertApiResponse(req.method, path, result);
  for (const [name, value] of Object.entries(result.headers || {})) res.setHeader(name, value);
  logEvent(
    result.status >= 500 ? 'error' : result.status >= 400 ? 'warn' : 'info',
    'api.request.completed',
    {
      requestId,
      method: req.method,
      path,
      status: result.status,
      durationMs: Date.now() - startedAt,
    }
  );
  return res.status(result.status).json(result.body);
}
