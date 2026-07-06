import { test, expect } from '@playwright/test';

// Scaffold: selectors are placeholders and must be replaced with real UI selectors
test('Login flow', async ({ page }) => {
  const base = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
  await page.goto(base);
  // TODO: replace selectors with real app selectors
  await expect(page).toHaveTitle(/DANI|Login/);
});
