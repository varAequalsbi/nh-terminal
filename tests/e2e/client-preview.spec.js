import { expect, test } from '@playwright/test';

test.skip(
  process.env.VITE_DEMO_PREVIEW !== 'true',
  'Runs only for the database-free client preview'
);

test('client can explore the preview without a backend database', async ({ page }) => {
  const backendRequests = [];
  page.on('request', (request) => {
    if (request.url().includes('127.0.0.1:3188')) backendRequests.push(request.url());
  });
  await page.goto('/login');
  await expect(page.locator('.client-preview-banner')).toContainText('Client preview');
  await page.getByRole('button', { name: 'Use Demo Account' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText('Illustrative sample sentiment')).toBeVisible();

  await page.getByRole('button', { name: 'Signal', exact: true }).click();
  await page.getByRole('button', { name: 'TEAM EXPERT' }).click();
  await expect(page.getByRole('heading', { name: 'SIGNALS', exact: true })).toBeVisible();
  await expect(page.locator('.signal-card').first()).toBeVisible();
  await page.getByRole('button', { name: /add signal/i }).click();
  await page.getByLabel('Symbol').selectOption('EURUSD');
  await page.getByLabel('Entry').fill('1.1000');
  await page.getByLabel('Stop Loss').fill('1.0900');
  await page.getByLabel('TP 1').fill('1.1100');
  await page.getByLabel('Analysis').fill('Client preview signal');
  await page.getByRole('button', { name: /review signal/i }).click();
  await page.getByRole('button', { name: /confirm publish/i }).click();
  await expect(page.getByText('Signal published.')).toBeVisible();

  await page.getByRole('button', { name: 'Market', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'MARKET', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Community', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'COMMUNITY', exact: true })).toBeVisible();
  expect(backendRequests).toEqual([]);
});
