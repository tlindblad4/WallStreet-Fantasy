import { test, expect } from '@playwright/test';

const BASE_URL = process.env.TEST_URL || 'https://wall-street-fantasy.vercel.app';
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'password123';

test.describe('WallStreet Fantasy - Invite System', () => {
  
  test('Login and view invite code', async ({ page }) => {
    // 1. Go to login page
    await page.goto(`${BASE_URL}/login`);
    
    // 2. Login
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button:has-text("Sign In")');
    
    // 3. Wait for dashboard
    await page.waitForURL('**/dashboard');
    await expect(page.locator('text=Your Leagues')).toBeVisible();
    
    // 4. Click on Test League
    await page.click('text=Test League');
    
    // 5. Wait for league page
    await page.waitForURL('**/leagues/**');
    
    // 6. Check for invite code
    const inviteSection = page.locator('text=Invite Friends');
    await expect(inviteSection).toBeVisible();
    
    // 7. Get the invite code
    const inviteCode = await page.locator('code').textContent();
    console.log('Invite code found:', inviteCode);
    expect(inviteCode).toBeTruthy();
    expect(inviteCode?.length).toBeGreaterThan(0);
  });

  test('Join league with invite code', async ({ page, browser }) => {
    // First, get the invite code as commissioner
    const commissionerContext = await browser.newContext();
    const commissionerPage = await commissionerContext.newPage();
    
    await commissionerPage.goto(`${BASE_URL}/login`);
    await commissionerPage.fill('input[type="email"]', TEST_EMAIL);
    await commissionerPage.fill('input[type="password"]', TEST_PASSWORD);
    await commissionerPage.click('button:has-text("Sign In")');
    await commissionerPage.waitForURL('**/dashboard');
    await commissionerPage.click('text=Test League');
    await commissionerPage.waitForURL('**/leagues/**');
    
    const inviteCode = await commissionerPage.locator('code').textContent();
    console.log('Got invite code:', inviteCode);
    
    await commissionerContext.close();
    
    // Now join as a different user
    await page.goto(`${BASE_URL}/leagues/join`);
    
    // If not logged in, login first
    if (await page.locator('text=Sign in').isVisible()) {
      await page.fill('input[type="email"]', 'test2@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button:has-text("Sign In")');
    }
    
    // Enter invite code
    await page.fill('input', inviteCode || '');
    await page.click('button:has-text("Join League")');
    
    // Should see success message
    await expect(page.locator('text=Welcome!')).toBeVisible();
  });
});
