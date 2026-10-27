import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);
const keyLength = 64;

export async function hashPassword(password) {
  if (typeof password !== 'string' || password.length < 12) {
    throw new Error('Password must contain at least 12 characters');
  }
  const salt = randomBytes(16).toString('base64url');
  const derived = await scrypt(password, salt, keyLength);
  return `scrypt$${salt}$${Buffer.from(derived).toString('base64url')}`;
}

export async function verifyPassword(password, encoded) {
  const [algorithm, salt, expectedValue] = String(encoded || '').split('$');
  if (algorithm !== 'scrypt' || !salt || !expectedValue) return false;
  const expected = Buffer.from(expectedValue, 'base64url');
  const actual = Buffer.from(await scrypt(password, salt, expected.length));
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
