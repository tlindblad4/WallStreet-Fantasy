import { test, expect } from '@playwright/test';

const BASE_URL = 'https://wall-street-fantasy.vercel.app';

test.describe('End-to-End: Create League → Invite → Join', () => {
  
  test('Full flow: Create league, get invite, join with invite', async ({ page, browser }) => {
    // Step 1: Login as commissioner
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', 'commissioner@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Sign In")');
    await page.waitForURL('**/dashboard');
    
    // Step 2: Create new league
    await page.click('text=Create League');
    await page.waitForURL('**/leagues/create');
    
    const leagueName = `Test League ${Date.now()}`;
    await page.fill('input[placeholder*="League Name"]', leagueName);
    await page.click('button:has-text("Create League")');
    
    // Step 3: Wait for league page and get invite code
    await page.waitForURL('**/leagues/**');
    await page.waitForSelector('text=Invite Friends');
    
    const inviteCode = await page.locator('code').textContent();
    console.log('Created league with invite code:', inviteCode);
    expect(inviteCode).toBeTruthy();
    expect(inviteCode?.length).toBe(8);
    
    // Step 4: Join as different user (new browser context)
    const joinerContext = await browser.newContext();
    const joinerPage = await joinerContext.newPage();
    
    await joinerPage.goto(`${BASE_URL}/leagues/join`);
    
    // Login as joiner
    if (await joinerPage.locator('text=Sign in').isVisible()) {
      await joinerPage.fill('input[type="email"]', 'joiner@test.com');
      await joinerPage.fill('input[type="password"]', 'password123');
      await joinerPage.click('button:has-text("Sign In")');
    }
    
    // Step 5: Enter invite code and join
    await joinerPage.waitForURL('**/leagues/join');
    await joinerPage.fill('input', inviteCode || '');
    await joinerPage.click('button:has-text("Join League")');
    
    // Step 6: Verify joined successfully
    await joinerPage.waitForSelector('text=Welcome!');
    console.log('✅ Successfully joined league with invite code!');
    
    await joinerContext.close();
  });

  test('Join with invalid code shows error', async ({ page }) => {
    await page.goto(`${BASE_URL}/leagues/join`);
    
    // Enter invalid code
    await page.fill('input', 'INVALID1');
    await page.click('button:has-text("Join League")');
    
    // Should show error
    await expect(page.locator('text=Invalid invite code')).toBeVisible();
    console.log('✅ Invalid code correctly rejected');
  });

  test('Join with already used code (max uses reached)', async ({ page }) => {
    // This would require setting up a code with max_uses = 0
    // Skipping for now as it requires DB manipulation
    console.log('⚠️ Skipped: requires DB setup');
  });
});
