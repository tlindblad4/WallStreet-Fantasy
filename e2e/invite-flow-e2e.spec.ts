import { test, expect } from '@playwright/test';

const BASE_URL = 'https://wall-street-fantasy.vercel.app';

test.describe('Invite Flow - End to End', () => {
  
  test('Complete invite flow: Create league → Get invite → Join with second account', async ({ browser }) => {
    // Step 1: Create league as User A
    const commissionerContext = await browser.newContext();
    const commissionerPage = await commissionerContext.newPage();
    
    await commissionerPage.goto(`${BASE_URL}/login`);
    await commissionerPage.fill('input[type="email"]', 'commissioner@test.com');
    await commissionerPage.fill('input[type="password"]', 'password123');
    await commissionerPage.click('button:has-text("Sign In")');
    await commissionerPage.waitForURL('**/dashboard');
    
    // Create league
    await commissionerPage.goto(`${BASE_URL}/leagues/create`);
    const leagueName = `Test League ${Date.now()}`;
    await commissionerPage.fill('input[placeholder*="League Name"]', leagueName);
    await commissionerPage.click('button:has-text("Create League")');
    
    // Wait for success and get invite code
    await commissionerPage.waitForSelector('text=League Created!', { timeout: 10000 });
    const inviteCode = await commissionerPage.locator('code').textContent();
    console.log('Created league with invite code:', inviteCode);
    
    expect(inviteCode).toBeTruthy();
    expect(inviteCode?.length).toBe(8);
    
    // Step 2: Join as User B
    const joinerContext = await browser.newContext();
    const joinerPage = await joinerContext.newPage();
    
    await joinerPage.goto(`${BASE_URL}/login`);
    await joinerPage.fill('input[type="email"]', 'joiner@test.com');
    await joinerPage.fill('input[type="password"]', 'password123');
    await joinerPage.click('button:has-text("Sign In")');
    await joinerPage.waitForURL('**/dashboard');
    
    // Go to join page
    await joinerPage.goto(`${BASE_URL}/leagues/join`);
    await joinerPage.fill('input[placeholder*="ABC12345"]', inviteCode || '');
    await joinerPage.click('button:has-text("Join League")');
    
    // Should see success
    await joinerPage.waitForSelector('text=Welcome!', { timeout: 10000 });
    
    // Verify on league page
    const leagueTitle = await joinerPage.locator('h1').textContent();
    expect(leagueTitle).toContain(leagueName);
    
    console.log('✅ Complete invite flow working!');
    
    await commissionerContext.close();
    await joinerContext.close();
  });

  test('Invite code validation', async ({ page }) => {
    await page.goto(`${BASE_URL}/leagues/join`);
    
    // Test invalid code
    await page.fill('input[placeholder*="ABC12345"]', 'INVALID');
    await page.click('button:has-text("Join League")');
    
    await page.waitForSelector('text=Invalid invite code', { timeout: 5000 });
    console.log('✅ Invalid code rejection working');
  });

  test('Commissioner can see invite code', async ({ page }) => {
    // Login as commissioner
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', 'commissioner@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Sign In")');
    await page.waitForURL('**/dashboard');
    
    // Go to first league
    await page.click('text=Test League');
    await page.waitForURL('**/leagues/**');
    
    // Check for invite section
    const inviteVisible = await page.locator('text=Invite Friends').isVisible();
    expect(inviteVisible).toBeTruthy();
    
    const codeVisible = await page.locator('code').isVisible();
    expect(codeVisible).toBeTruthy();
    
    console.log('✅ Commissioner can see invite code');
  });
});
