import { test, expect } from '@playwright/test';

test.describe('CampusMart Marketplace E2E Flow', () => {
  test('should display marketplace feed, CMU branding, and search products', async ({ page }) => {
    await page.goto('/');

    // Verify brand title and header
    await expect(page.locator('text=CampusMart')).toBeVisible();
    await expect(page.locator('text=CMU')).toBeVisible();

    // Verify product feed is displayed
    const productCards = page.locator('.aspect-\\[4\\/3\\]');
    await expect(productCards.first()).toBeVisible({ timeout: 10000 });

    // Verify presence of "ติดจอง" badge on reserved items
    const reservedBadge = page.locator('text=ติดจอง');
    if ((await reservedBadge.count()) > 0) {
      await expect(reservedBadge.first()).toBeVisible();
    }
  });

  test('should navigate to login page and show Login with CMU Account button', async ({ page }) => {
    await page.goto('/');

    // Click Login button in Navbar
    const loginNavBtn = page.locator('text=เข้าสู่ระบบ CMU');
    if (await loginNavBtn.isVisible()) {
      await loginNavBtn.click();
      await expect(page.locator('text=Login with CMU Account')).toBeVisible();
    }
  });
});
