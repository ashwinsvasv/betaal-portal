import { test, expect } from '@playwright/test';

test.describe('Privacy & Security Anonymity Journeys', () => {
  test('Journey 4.1 - 4.2: Public student anonymity vs Private issue scoping', async ({ page }) => {
    // 1. Visit All Issues as General Student Priya Nair
    await page.goto('/signin');
    const studentTab = page.locator('button:has-text("Students (20)")');
    await studentTab.click();

    // Select Priya Nair (H4)
    const studentBtn = page.locator('button:has-text("Priya Nair")');
    await expect(studentBtn).toBeVisible();
    await studentBtn.click();
    await expect(page).toHaveURL('/');

    // 2. Check public issue row text contains student attribution
    const studentAttribution = page.locator('text=/student/i').first();
    await expect(studentAttribution).toBeVisible();

    // 3. Verify that non-admin students cannot access /dashboard
    await page.goto('/dashboard');
    await expect(page.locator('text=Access restricted')).toBeVisible();
  });
});
