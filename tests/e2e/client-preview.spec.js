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
  await page.getByRole('button', { name: 'Admin', exact: true }).click();
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

for (const [role, label] of [
  ['member', 'Member'],
  ['expert', 'Expert'],
  ['moderator', 'Moderator'],
  ['admin', 'Admin'],
  ['super-admin', 'Super Admin'],
]) {
  test(`preview role ${role} persists and shows appropriate signal controls`, async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: label, exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.reload();
    await expect(page).toHaveURL(/\/dashboard$/);
    const session = await page.evaluate(() => JSON.parse(localStorage.getItem('nh.session')));
    expect(session.user.role).toBe(role);
    await page.getByRole('button', { name: 'Signal', exact: true }).click();
    await page.getByRole('button', { name: 'TEAM EXPERT' }).click();
    const publish = page.getByRole('button', { name: /add signal/i });
    if (['expert', 'admin', 'super-admin'].includes(role)) await expect(publish).toBeVisible();
    else await expect(publish).toHaveCount(0);
    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Logout', exact: true }).click();
    await expect(page).toHaveURL(/\/login$/);
    await page.getByRole('button', { name: 'Member', exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.locator('.client-preview-banner')).toContainText('Role: member');
  });
}
