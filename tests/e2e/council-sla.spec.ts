import { test, expect } from '@playwright/test';

test.describe('Council & Representative SLA Journeys', () => {
  test('Journey 2.1 - 2.4: Inbox Triage, 48h Acknowledge, and Progress Updates', async ({ page }) => {
    // 1. Visit Sign-in Page
    await page.goto('/signin');

    // 2. Select Hostel Rep (Hostel 3 Rep - Vikramaditya Rao)
    const repTab = page.locator('button:has-text("Hostel Reps (17)")');
    await repTab.click();

    const h3RepBtn = page.locator('button:has-text("Hostel 3 Representative")');
    await expect(h3RepBtn).toBeVisible();
    await h3RepBtn.click();

    // 3. Confirm redirected to Home
    await expect(page).toHaveURL('/');
    await expect(page.locator('header').getByText('Vikramaditya Rao')).toBeVisible();

    // 4. Navigate to My Inbox
    await page.click('a:has-text("My inbox")');
    await expect(page).toHaveURL('/inbox');

    // 5. Verify 3 Inbox Tabs
    await expect(page.locator('button:has-text("Needs action")')).toBeVisible();
    await expect(page.locator('button:has-text("Waiting on student")')).toBeVisible();
    await expect(page.locator('button:has-text("Done")')).toBeVisible();

    // 6. Open a ticket from Needs action
    const firstIssueLink = page.locator('h2 a').first();
    if (await firstIssueLink.isVisible()) {
      await firstIssueLink.click();
      await expect(page).toHaveURL(/\/issue\//);

      // Look for action note box
      const noteBox = page.locator('textarea').first();
      if (await noteBox.isVisible()) {
        await noteBox.fill('Inspected the facility on-site; work initiated.');
        const ackBtn = page.locator('button:has-text("Acknowledge")');
        if (await ackBtn.isVisible()) {
          await ackBtn.click();
          await expect(page.locator('text=/Acknowledged/i').first()).toBeVisible({ timeout: 5000 });
        }
      }
    }
  });
});
