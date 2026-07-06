import { test, expect } from '@playwright/test';

const EMAIL_SANDBOX_ENABLED = process.env.EMAIL_SANDBOX_ENABLED === 'true';

test.describe('User creation flow', () => {
  test.skip(!EMAIL_SANDBOX_ENABLED, 'EMAIL_SANDBOX_ENABLED != true');

  // Scaffold: selectors are placeholders and must be replaced with real UI selectors
  test('creates user and sends confirmation email @email', async ({ page }) => {
    const base = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
    await page.goto(`${base}/signup`);
    // TODO: implement user creation steps and mailbox verification
    await expect(page.locator('text=Check your email')).toBeVisible();
  });
});
