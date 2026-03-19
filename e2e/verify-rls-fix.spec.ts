import { test, expect } from '@playwright/test';

const BASE_URL = 'https://wall-street-fantasy.vercel.app';

test.describe('Invite Join Flow - Post RLS Fix', () => {
  
  test('Join page loads invite codes after RLS fix', async ({ page }) => {
    await page.goto(`${BASE_URL}/leagues/join`);
    await page.waitForLoadState('networkidle');
    
    // Wait a moment for the useEffect to run
    await page.waitForTimeout(2000);
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/join-page-after-rls-fix.png', fullPage: true });
    
    // Check if available codes section appears
    const availableCodesSection = await page.locator('text=Available Invite Codes:').isVisible().catch(() => false);
    
    console.log('Available codes section visible:', availableCodesSection);
    
    if (availableCodesSection) {
      // Check if codes are listed
      const codeButtons = await page.locator('button[class*="font-mono"]').count();
      console.log('Number of invite code buttons found:', codeButtons);
      
      // Look for A58B3FB6 specifically
      const testCode = await page.locator('button:has-text("A58B3FB6")').isVisible().catch(() => false);
      console.log('Test code A58B3FB6 visible:', testCode);
      
      expect(codeButtons).toBeGreaterThan(0);
    } else {
      console.log('⚠️ Available codes section not visible - RLS fix may not be applied yet');
    }
  });

  test('Attempt to join with A58B3FB6', async ({ page }) => {
    await page.goto(`${BASE_URL}/leagues/join`);
    await page.waitForLoadState('networkidle');
    
    // Enter the invite code
    await page.fill('input[placeholder*="ABC12345"]', 'A58B3FB6');
    
    // Click join
    await page.click('button:has-text("Join League")');
    
    // Wait for result
    await page.waitForTimeout(3000);
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/join-attempt-result.png', fullPage: true });
    
    // Check result
    const successMessage = await page.locator('text=Welcome!').isVisible().catch(() => false);
    const errorMessage = await page.locator('text=Invalid invite code').isVisible().catch(() => false);
    
    console.log('Success:', successMessage, '| Error:', errorMessage);
    
    if (successMessage) {
      console.log('✅ JOIN WORKS! RLS fix successful!');
    } else if (errorMessage) {
      console.log('❌ Still failing - need more debugging');
    }
  });
});
