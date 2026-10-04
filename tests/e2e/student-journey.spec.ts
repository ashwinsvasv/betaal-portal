import { test, expect } from '@playwright/test';

test.describe('Student User Journeys', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('Journey 1.1 - 1.3: Sign in, Duplicate Check, Upvote Instead & 2-Step Issue Creation', async ({ page }) => {
    // 1. Visit Sign-in Page
    await page.goto('/signin');
    await expect(page).toHaveTitle(/Sunwai/);

    // 2. Select Demo Student Persona (Rahul Sharma - H3, PGP41)
    const studentTab = page.locator('button:has-text("Students (20)")');
    await studentTab.click();

    const studentBtn = page.locator('button:has-text("Rahul Sharma")');
    await expect(studentBtn).toBeVisible();
    await studentBtn.click();

    // 3. Confirm redirected to Home Feed & header shows user
    await expect(page).toHaveURL('/');
    await expect(page.locator('header').getByText('Rahul Sharma')).toBeVisible();

    // 4. Navigate to Raise Issue Page
    await page.click('text=Raise issue');
    await expect(page).toHaveURL('/raise');

    // 5. Test Real-time Duplicate Detection & "Upvote Instead"
    const titleInput = page.locator('input[placeholder*="Wi-Fi router on 2nd floor"]');
    await titleInput.fill('Wi-Fi router on 2nd floor Hostel 3 keeps dropping');

    // Verify duplicate panel pops up
    const duplicatePanel = page.locator('text=Similar open issues already reported');
    await expect(duplicatePanel).toBeVisible({ timeout: 5000 });

    // Verify "Upvote instead" button exists
    const upvoteBtn = page.locator('button:has-text("Upvote instead")').first();
    await expect(upvoteBtn).toBeVisible();
    await upvoteBtn.click();
    await expect(page.locator('button:has-text("Voted")').first()).toBeVisible();

    // 6. Fill a new distinct issue
    await titleInput.fill('Noisy exhaust fan in Room 312 Hostel 3');
    await page.selectOption('select >> nth=0', 'Hostel life');
    await page.selectOption('select >> nth=1', 'my hostel');
    await page.locator('textarea').fill('The exhaust fan is rattling excessively and making loud buzzing noise during night hours.');

    // 7. Click "Next: Check who this goes to"
    await page.click('button:has-text("Next: Check who this goes to")');

    // 8. Verify Step 2 Routing Information
    await expect(page.getByRole('heading', { name: 'Check who this goes to' })).toBeVisible();
    await expect(page.locator('text=Assigned owner:')).toBeVisible();

    // 9. Submit issue to Owner
    await page.click('button:has-text("Send to")');

    // 10. Verify redirected to Issue Page
    await expect(page).toHaveURL(/\/issue\/issue-/);
    await expect(page.locator('h1:has-text("Noisy exhaust fan in Room 312 Hostel 3")')).toBeVisible();
  });
});
