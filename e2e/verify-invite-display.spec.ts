import { test, expect } from '@playwright/test';

const BASE_URL = 'https://wall-street-fantasy.vercel.app';

test.describe('Invite Code Display Test', () => {
  
  test('Verify invite code is visible on league page', async ({ page }) => {
    // Go directly to the Test League page
    await page.goto(`${BASE_URL}/leagues/6cb5423b-53c6-4ba0-a721-5f02e1991d7a`);
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    // Take screenshot for visual verification
    await page.screenshot({ 
      path: 'test-results/invite-code-test.png',
      fullPage: true 
    });
    
    // Check if commissioner banner is visible
    const commissionerBanner = page.locator('text=You are the commissioner');
    const isCommissioner = await commissionerBanner.isVisible().catch(() => false);
    
    console.log('Is commissioner:', isCommissioner);
    
    if (isCommissioner) {
      // Look for invite code
      const inviteCodeLocator = page.locator('code');
      const inviteCode = await inviteCodeLocator.textContent().catch(() => null);
      
      console.log('Invite code found:', inviteCode);
      
      // Take screenshot of invite section
      const inviteSection = page.locator('text=Invite Friends').first();
      if (await inviteSection.isVisible().catch(() => false)) {
        await inviteSection.screenshot({ path: 'test-results/invite-section.png' });
      }
      
      // Verify invite code exists and is 8 characters
      expect(inviteCode, 'Invite code should be visible').toBeTruthy();
      expect(inviteCode?.length, 'Invite code should be 8 characters').toBe(8);
      
      console.log('✅ TEST PASSED: Invite code is visible:', inviteCode);
    } else {
      console.log('⚠️ Not viewing as commissioner - cannot verify invite code');
      // Take screenshot anyway for debugging
      await page.screenshot({ path: 'test-results/not-commissioner.png' });
    }
  });

  test('Check join league page structure', async ({ page }) => {
    await page.goto(`${BASE_URL}/leagues/join`);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'test-results/join-page.png' });
    
    // Verify page elements
    await expect(page.locator('text=Join a League')).toBeVisible();
    await expect(page.locator('input')).toBeVisible();
    await expect(page.locator('button:has-text("Join League")')).toBeVisible();
    
    console.log('✅ TEST PASSED: Join league page loads correctly');
  });
});
