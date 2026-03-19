import { test, expect } from '@playwright/test';

const BASE_URL = 'https://wall-street-fantasy.vercel.app';

test.describe('Automated Feature Tests', () => {
  
  test('Login page - all elements visible', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    // Screenshot
    await page.screenshot({ path: 'test-results/login-page.png' });
    
    // Verify all elements
    await expect(page.locator('text=Sign in to your account')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button:has-text("Sign In")')).toBeVisible();
    await expect(page.locator('text=Forgot password?')).toBeVisible();
    
    console.log('✅ Login page test passed');
  });

  test('Dashboard - navigation elements', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'test-results/dashboard.png' });
    
    // Check if redirected to login (not authenticated)
    if (page.url().includes('/login')) {
      console.log('⚠️ Redirected to login - user not authenticated (expected)');
      return;
    }
    
    // If on dashboard, verify elements
    await expect(page.locator('text=Your Leagues')).toBeVisible();
    await expect(page.locator('button:has-text("Create League")')).toBeVisible();
    await expect(page.locator('button:has-text("Join League")')).toBeVisible();
    
    console.log('✅ Dashboard test passed');
  });

  test('Create league page - form elements', async ({ page }) => {
    await page.goto(`${BASE_URL}/leagues/create`);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'test-results/create-league.png' });
    
    // Verify form elements
    await expect(page.locator('text=Create New League')).toBeVisible();
    await expect(page.locator('input')).toBeVisible();
    await expect(page.locator('button:has-text("Create League")')).toBeVisible();
    
    console.log('✅ Create league page test passed');
  });

  test('Trade page - if accessible', async ({ page }) => {
    // Try to access a trade page
    await page.goto(`${BASE_URL}/leagues/6cb5423b-53c6-4ba0-a721-5f02e1991d7a/trade`);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'test-results/trade-page.png' });
    
    // Check what's visible
    const title = await page.title();
    console.log('Trade page title:', title);
    
    // Verify basic structure
    const hasSearch = await page.locator('input[placeholder*="Search"]').isVisible().catch(() => false);
    const hasTradeButton = await page.locator('button:has-text("Trade")').isVisible().catch(() => false);
    
    console.log('Has search:', hasSearch, '| Has trade button:', hasTradeButton);
    
    console.log('✅ Trade page test completed');
  });

  test('Mobile responsive - iPhone size', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });
    
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'test-results/mobile-login.png' });
    
    // Check if elements are still visible and usable
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
    
    // Check if button is clickable (not too small)
    const button = page.locator('button:has-text("Sign In")');
    const box = await button.boundingBox();
    console.log('Button size on mobile:', box);
    
    expect(box?.width).toBeGreaterThan(100); // Button should be wide enough to tap
    expect(box?.height).toBeGreaterThan(40);  // Button should be tall enough to tap
    
    console.log('✅ Mobile responsive test passed');
  });
});
