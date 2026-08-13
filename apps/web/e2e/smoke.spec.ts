import { test, expect } from '@playwright/test';

test.describe('marketing', () => {
  test('home loads Timely positioning', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Invoice\./i })).toBeVisible();
    await expect(page.getByText(/Collect\./i).first()).toBeVisible();
  });

  test('pricing shows Pro R 299', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page.getByRole('heading', { name: /Simple ZAR pricing/i })).toBeVisible();
    await expect(page.getByText('R 299').first()).toBeVisible();
  });
});

test.describe('authenticated (optional)', () => {
  test('login → dashboard when E2E credentials set', async ({ page }) => {
    const email = process.env.E2E_USER_EMAIL;
    const password = process.env.E2E_USER_PASSWORD;
    test.skip(!email || !password, 'Set E2E_USER_EMAIL and E2E_USER_PASSWORD');

    await page.goto('/login');
    await page.getByLabel(/email/i).fill(email!);
    await page.getByLabel(/password/i).fill(password!);
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await page.waitForURL(/dashboard/, { timeout: 30_000 });
    await expect(page.getByText(/Good (morning|afternoon|evening)/i)).toBeVisible({ timeout: 15_000 });
  });

  test('collections page loads when authenticated', async ({ page }) => {
    const email = process.env.E2E_USER_EMAIL;
    const password = process.env.E2E_USER_PASSWORD;
    test.skip(!email || !password, 'Set E2E_USER_EMAIL and E2E_USER_PASSWORD');

    await page.goto('/login');
    await page.getByLabel(/email/i).fill(email!);
    await page.getByLabel(/password/i).fill(password!);
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await page.waitForURL(/dashboard/, { timeout: 30_000 });
    await page.goto('/reminders');
    await expect(page.getByRole('heading', { name: /Collections/i })).toBeVisible();
  });
});

test.describe('public quote (optional)', () => {
  test('public quote page renders for fixture share id', async ({ page }) => {
    const shareId = process.env.E2E_QUOTE_SHARE_ID;
    test.skip(!shareId, 'Set E2E_QUOTE_SHARE_ID');
    await page.goto(`/quote/${shareId}`);
    await expect(page.getByText(/Quote from/i)).toBeVisible();
  });
});
