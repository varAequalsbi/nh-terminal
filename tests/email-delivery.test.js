import { describe, expect, test } from 'vitest';
import { handleApiRequest } from '../server/api-application.js';

const request = (path, input) => ({
  method: 'POST',
  path,
  input,
  headers: {},
  requestId: 'email-delivery-test',
});

describe('verification email delivery failures', () => {
  test('keeps a successfully created account recoverable', async () => {
    const repository = {
      consumeAuthRateLimit: async () => {},
      clearAuthRateLimit: async () => {},
      recordAuthEvent: async () => {},
      register: async () => ({
        user: { id: 'member-1', name: 'Local Member', email: 'member@example.test' },
        verificationToken: 'verification-token',
      }),
    };

    const result = await handleApiRequest(
      request('/auth/register', {
        name: 'Local Member',
        email: 'member@example.test',
        password: 'MemberPass123!',
      }),
      repository,
      {
        sendVerificationEmail: async () => {
          throw new Error('SMTP offline');
        },
      }
    );

    expect(result.status).toBe(201);
    expect(result.body.requiresVerification).toBe(true);
    expect(result.body.verificationEmailDelivered).toBe(false);
    expect(result.body.message).toContain('Account created');
  });

  test('returns a specific retryable error when resend delivery fails', async () => {
    const repository = {
      consumeAuthRateLimit: async () => {},
      requestEmailVerification: async () => ({
        userId: 'member-1',
        email: 'member@example.test',
        token: 'new-token',
      }),
    };

    const result = await handleApiRequest(
      request('/auth/resend-verification', { email: 'member@example.test' }),
      repository,
      {
        sendVerificationEmail: async () => {
          throw new Error('SMTP offline');
        },
      }
    );

    expect(result.status).toBe(503);
    expect(result.body.code).toBe('EMAIL_DELIVERY_UNAVAILABLE');
  });
});
