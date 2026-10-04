import { test, expect } from '@playwright/test';

test.describe('Privacy & Security Anonymity Journeys', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

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

  test('Journey 4.3: Unauthenticated guests cannot view issues without logging in', async ({ page }) => {
    // 1. Visit homepage unauthenticated
    await page.goto('/');
    await expect(page.locator('text=Betaal keeps the Student Council accountable.')).toBeVisible();
    await expect(page.locator('main').getByText('Sign in with IIML Google')).toBeVisible();
    await expect(page.locator('text=Browse by Category')).not.toBeVisible();

    // 2. Direct issue URL requires sign-in
    await page.goto('/issue/issue-hot-water');
    await expect(page.locator('text=Please sign in')).toBeVisible();
  });
});
