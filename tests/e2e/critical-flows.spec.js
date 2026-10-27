import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }, testInfo) => {
  if (testInfo.title.includes('new member')) return;
  await page.goto('/login');
  await page.getByRole('button', { name: 'Use Demo Account' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
});

test('admin navigates core data areas and logs out', async ({ page }) => {
  await expect(page.getByText('No recent announcements.')).toBeVisible();
  await expect(page.getByText('Illustrative sample sentiment')).toBeVisible();
  await page.getByRole('button', { name: 'Signal', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'SIGNALS', exact: true })).toBeVisible();
  await expect(page.getByText(/Sample signals are historical examples/)).toBeVisible();
  await page.getByRole('button', { name: 'Market', exact: true }).click();
  await expect(page).toHaveURL(/\/market/);
  await expect(page.getByRole('heading', { name: 'MARKET', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Outlook' }).click();
  await expect(page.getByText(/Sample outlook and sentiment for preview/)).toBeVisible();
  await page.getByRole('button', { name: 'Research' }).click();
  await expect(page.getByText(/Sample market commentary for preview/)).toBeVisible();
  await page.getByRole('button', { name: 'Kalender' }).click();
  await expect(page.getByText(/Historical sample events for preview/)).toBeVisible();
  await page.getByRole('button', { name: 'Community', exact: true }).click();
  await expect(page).toHaveURL(/\/community/);
  await page.getByRole('button', { name: 'Profile', exact: true }).click();
  await expect(page).toHaveURL(/\/profile/);
  await page.getByRole('button', { name: /settings/i }).click();
  await expect(page).toHaveURL(/\/settings/);
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Logout' }).click();
  await expect(page).toHaveURL(/\/login$/);
});

test('admin publishes a signal with validated trade levels', async ({ page }) => {
  const analysis = `Playwright validated signal ${Date.now()}`;
  await page.goto('/signal');
  await page.getByRole('button', { name: /add signal/i }).click();
  await page.getByLabel('Symbol').selectOption('EURUSD');
  await page.getByLabel('Entry').fill('1.1000');
  await page.getByLabel('Stop Loss').fill('1.0900');
  await page.getByLabel('TP 1').fill('1.1100');
  await page.getByLabel('Analysis').fill(analysis);
  await page.getByRole('button', { name: /review signal/i }).click();
  await expect(page.getByText('Review before publishing')).toBeVisible();
  await page.getByRole('button', { name: /confirm publish/i }).click();
  await expect(page.getByText('Signal published.')).toBeVisible();
  await page.getByRole('button', { name: 'TEAM EXPERT' }).click();
  await page.locator('.signal-card').filter({ hasText: analysis }).click();
  await expect(page.getByText(/Published by/)).toBeVisible();
  await page.getByRole('button', { name: 'Close signal', exact: true }).click();
  await page.getByLabel('Executed exit price').fill('1.0950');
  await page.getByLabel('Reason or closing note').fill('Closed after setup changed');
  await page.getByRole('button', { name: 'Confirm', exact: true }).click();
  await expect(page.getByText('Result: loss · -50 Pips')).toBeVisible();
  await page.getByRole('button', { name: 'Archive', exact: true }).click();
  await page.getByLabel('Reason for archive').fill('Browser test cleanup');
  await page.getByRole('button', { name: 'Confirm', exact: true }).click();
  await expect(page.getByText('Signal archived. Its history was preserved.')).toBeVisible();
  await page.getByRole('button', { name: 'Archived', exact: true }).click();
  await page.locator('.signal-card').filter({ hasText: analysis }).click();
  await expect(page.getByText(/Archived: Browser test cleanup/)).toBeVisible();
});

test('admin can review an expert signal on a phone-sized screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/signal');
  await page.getByRole('button', { name: /add signal/i }).click();
  await page.getByLabel('Symbol').selectOption('EURUSD');
  await page.getByLabel('Entry').fill('1.1000');
  await page.getByLabel('Stop Loss').fill('1.0900');
  await page.getByLabel('TP 1').fill('1.1100');
  await page.getByLabel('Analysis').fill('Mobile review');
  await page.getByRole('button', { name: /review signal/i }).click();
  await expect(page.getByText('Review before publishing')).toBeVisible();
  const viewportFits = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth
  );
  expect(viewportFits).toBe(true);
  await expect(page.getByRole('button', { name: /confirm publish/i })).toBeVisible();
});

test('admin sees the pending Live Trade setup without technical controls', async ({ page }) => {
  await page.goto('/community?tab=live');
  await expect(page.getByRole('status')).toContainText('Live stream setup pending');
  await expect(page.getByText('No video is being shared right now')).toBeVisible();
  await expect(page.getByLabel('Cloudflare Stream Live Input ID')).toHaveCount(0);
});

test('new member verifies email and cannot see admin publishing controls', async ({ page }) => {
  const email = `browser-${Date.now()}@nhterminal.local`;
  await page.goto('/signup');
  await page.getByLabel('Name').fill('Browser Member');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill('BrowserPass123!');
  await page.getByLabel('Confirm password').fill('BrowserPass123!');
  const registrationResponse = page.waitForResponse((response) =>
    response.url().endsWith('/auth/register')
  );
  await page.getByRole('button', { name: 'Sign Up' }).click();
  const registration = await (await registrationResponse).json();
  await expect(page).toHaveURL(/\/verify-email/);
  await page.goto(
    `/verify-email?token=${encodeURIComponent(registration.developmentVerificationToken)}`
  );
  await expect(page.getByText('Email verified. You can now sign in.')).toBeVisible();
  await page.getByRole('link', { name: 'Continue to Login' }).click();
  await page.getByLabel('Email').fill(email);
  await page.locator('input[name="password"]').fill('BrowserPass123!');
  await page.getByRole('button', { name: 'Log In' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto('/signal');
  await expect(page.getByRole('button', { name: /add signal/i })).toHaveCount(0);
  await page.goto('/community?tab=info');
  await expect(page.getByRole('button', { name: /create announcement/i })).toHaveCount(0);
  await page.goto('/community?tab=live');
  await expect(page.getByLabel('Cloudflare Stream Live Input ID')).toHaveCount(0);
});

test('admin publishes a forum post and opens a conversation', async ({ page }) => {
  await page.goto('/community?tab=forum');
  const composer = page.locator('textarea').first();
  await composer.fill(`Playwright forum post ${Date.now()}`);
  await page.getByRole('button', { name: /send/i }).first().click();
  await expect(page.getByText(/Playwright forum post/).first()).toBeVisible();
  await page.getByRole('button', { name: 'Chat', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'CONVERSATIONS' })).toBeVisible();
});
