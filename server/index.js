import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { handleApiRequest } from './api-application.js';
import { PostgresRepository } from './database/postgres-repository.js';
import { logEvent, requestIdPattern } from './logging.js';
import { assertApiResponse } from './validation.js';

const port = Number(process.env.PORT || 3000);
const allowedOrigin = process.env.API_ALLOWED_ORIGIN || 'http://127.0.0.1:5174';
const repository = new PostgresRepository();

const readBody = (req) =>
  new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) reject(new Error('Request body is too large'));
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });

const server = http.createServer(async (req, res) => {
  const startedAt = Date.now();
  const suppliedRequestId = String(req.headers['x-request-id'] || '');
  const requestId = requestIdPattern.test(suppliedRequestId) ? suppliedRequestId : randomUUID();
  const requestOrigin = req.headers.origin || '';
  const corsHeaders = {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'Content-Type, X-CSRF-Token',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    Vary: 'Origin',
  };
  if (requestOrigin && requestOrigin !== allowedOrigin) {
    res.writeHead(403, {
      'Content-Type': 'application/json; charset=utf-8',
      Vary: 'Origin',
      'X-Request-ID': requestId,
    });
    logEvent('warn', 'api.request.rejected', {
      requestId,
      method: req.method,
      path: req.url,
      status: 403,
      durationMs: Date.now() - startedAt,
    });
    return res.end(
      JSON.stringify({
        code: 'ORIGIN_NOT_ALLOWED',
        message: 'Request origin is not allowed',
        requestId,
      })
    );
  }
  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders);
    return res.end();
  }
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const input = ['POST', 'PUT', 'PATCH'].includes(req.method) ? await readBody(req) : {};
    const result = await handleApiRequest(
      {
        method: req.method,
        path: url.pathname.replace(/^\/api/, '') || '/',
        query: Object.fromEntries(url.searchParams),
        headers: req.headers,
        input,
        requestId,
      },
      repository
    );
    assertApiResponse(req.method, url.pathname.replace(/^\/api/, '') || '/', result);
    res.writeHead(result.status, {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders,
      'X-Request-ID': requestId,
      ...result.headers,
    });
    res.end(JSON.stringify(result.body));
    logEvent(
      result.status >= 500 ? 'error' : result.status >= 400 ? 'warn' : 'info',
      'api.request.completed',
      {
        requestId,
        method: req.method,
        path: req.url,
        status: result.status,
        durationMs: Date.now() - startedAt,
      }
    );
  } catch (error) {
    const status = error instanceof SyntaxError ? 400 : 500;
    res.writeHead(status, {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders,
      'X-Request-ID': requestId,
    });
    res.end(
      JSON.stringify({
        code: status === 400 ? 'INVALID_JSON' : 'INTERNAL_ERROR',
        message: status === 400 ? 'Request body must be valid JSON' : 'API request failed',
        requestId,
      })
    );
    logEvent('error', 'api.request.failed', {
      requestId,
      method: req.method,
      path: req.url,
      status,
      durationMs: Date.now() - startedAt,
      error: error?.message || String(error),
    });
  }
});

server.listen(port, '0.0.0.0', () =>
  logEvent('info', 'api.server.ready', { port, database: 'postgresql' })
);
