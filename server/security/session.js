import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

export const sessionCookieName = 'nh_session';
export const csrfCookieName = 'nh_csrf';
export const sessionDurationMs = 7 * 24 * 60 * 60 * 1000;

export function createSessionToken() {
  return randomBytes(32).toString('base64url');
}

export function hashSessionToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

export function createCsrfToken() {
  return randomBytes(24).toString('base64url');
}

export function readCookie(headers = {}, cookieName) {
  const cookie = headers.cookie || headers.Cookie || '';
  for (const part of cookie.split(';')) {
    const [name, ...value] = part.trim().split('=');
    if (name === cookieName) return decodeURIComponent(value.join('='));
  }
  return null;
}

export const readSessionToken = (headers = {}) => readCookie(headers, sessionCookieName);

export function validateCsrfToken(headers = {}) {
  const cookieToken = readCookie(headers, csrfCookieName);
  const headerToken = headers['x-csrf-token'] || headers['X-CSRF-Token'];
  if (!cookieToken || !headerToken) return false;
  const expected = Buffer.from(cookieToken);
  const actual = Buffer.from(String(headerToken));
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function sessionCookie(token, { clear = false } = {}) {
  const secure = process.env.SESSION_COOKIE_SECURE !== 'false';
  const parts = [
    `${sessionCookieName}=${clear ? '' : encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    clear ? 'Max-Age=0' : `Max-Age=${Math.floor(sessionDurationMs / 1000)}`,
  ];
  if (secure) parts.push('Secure');
  return parts.join('; ');
}

export function csrfCookie(token, { clear = false } = {}) {
  const secure = process.env.SESSION_COOKIE_SECURE !== 'false';
  const parts = [
    `${csrfCookieName}=${clear ? '' : encodeURIComponent(token)}`,
    'Path=/',
    'SameSite=Lax',
    clear ? 'Max-Age=0' : `Max-Age=${Math.floor(sessionDurationMs / 1000)}`,
  ];
  if (secure) parts.push('Secure');
  return parts.join('; ');
}

export function authenticationCookies(sessionToken, { clear = false } = {}) {
  const csrfToken = clear ? '' : createCsrfToken();
  return {
    csrfToken,
    cookies: [sessionCookie(sessionToken, { clear }), csrfCookie(csrfToken, { clear })],
  };
}
