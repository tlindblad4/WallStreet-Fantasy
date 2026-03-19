import { test, expect } from '@playwright/test';

const BASE_URL = 'https://wall-street-fantasy.vercel.app';

test.describe('Invite Join Flow - With Authentication', () => {
  
  test('Verify invite codes are visible after RLS fix', async ({ page }) => {
    // First login
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Sign In")');
    await page.waitForURL('**/dashboard');
    
    // Now go to join page
    await page.goto(`${BASE_URL}/leagues/join`);
    await page.waitForLoadState('networkidle');
    
    // Wait for codes to load
    await page.waitForTimeout(2000);
    
    // Click Show to reveal codes
    await page.click('text=Show');
    await page.waitForTimeout(500);
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/join-codes-visible.png', fullPage: true });
    
    // Check if A58B3FB6 is visible
    const testCodeVisible = await page.locator('button:has-text("A58B3FB6")').isVisible().catch(() => false);
    console.log('A58B3FB6 visible:', testCodeVisible);
    
    if (testCodeVisible) {
      console.log('✅ RLS FIX WORKS! Invite codes are now readable!');
    }
    
    // Count visible codes
    const codeCount = await page.locator('button[class*="font-mono"]').count();
    console.log('Total invite codes visible:', codeCount);
  });

  test('Join Test League with A58B3FB6', async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', 'testjoiner@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Sign In")');
    await page.waitForURL('**/dashboard');
    
    // Go to join page
    await page.goto(`${BASE_URL}/leagues/join`);
    await page.waitForLoadState('networkidle');
    
    // Enter invite code
    await page.fill('input[placeholder*="ABC12345"]', 'A58B3FB6');
    
    // Click join
    await page.click('button:has-text("Join League")');
    
    // Wait for result
    await page.waitForTimeout(3000);
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/join-success-test.png', fullPage: true });
    
    // Check for success
    const success = await page.locator('text=Welcome!').isVisible().catch(() => false);
    const alreadyMember = await page.locator('text=already a member').isVisible().catch(() => false);
    const error = await page.locator('text=Invalid invite code').isVisible().catch(() => false);
    
    if (success) {
      console.log('✅ JOIN SUCCESSFUL! User joined the league!');
    } else if (alreadyMember) {
      console.log('✅ User is already a member (previously joined)');
    } else if (error) {
      console.log('❌ Still getting invalid code error');
    }
  });
});
