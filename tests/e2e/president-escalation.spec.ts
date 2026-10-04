import { test, expect } from '@playwright/test';

test.describe('President & Executive Dashboard Journeys', () => {
  test('Journey 3.1 - 3.3: President KPI Dashboard, Deadline Check & Ownership Breakdown', async ({ page }) => {
    // 1. Visit Sign-in Page
    await page.goto('/signin');

    // 2. Select President Persona (Ashwin Narayan)
    const councilTab = page.locator('button:has-text("Council (9)")');
    await councilTab.click();

    const presBtn = page.locator('button:has-text("President")');
    await expect(presBtn).toBeVisible();
    await presBtn.click();

    // 3. Confirm redirected to Home & Dashboard link available
    await expect(page).toHaveURL('/');
    await expect(page.locator('a:has-text("Dashboard")')).toBeVisible();

    // 4. Open Dashboard
    await page.click('a:has-text("Dashboard")');
    await expect(page).toHaveURL('/dashboard');

    // 5. Verify 5 KPI Metric Numbers
    await expect(page.locator('text=Open').first()).toBeVisible();
    await expect(page.locator('text=Escalated').first()).toBeVisible();
    await expect(page.locator('text=Late').first()).toBeVisible();
    await expect(page.locator('text=Priority').first()).toBeVisible();
    await expect(page.locator('text=Avg to resolve').first()).toBeVisible();

    // 6. Test "Run deadline check now"
    const deadlineBtn = page.locator('button:has-text("Run deadline check now")');
    await expect(deadlineBtn).toBeVisible();
    await deadlineBtn.click();

    // Verify response message
    await expect(page.locator('text=Deadline check executed')).toBeVisible({ timeout: 5000 });

    // 7. Verify "By owner" summary table
    await expect(page.locator('text=By owner')).toBeVisible();
    await expect(page.locator('text=Mess Secretary')).toBeVisible();
  });
});
