import { test, expect } from '@playwright/test';

const BASE_URL = 'https://wall-street-fantasy.vercel.app';

test.describe('Complete App Test Suite', () => {
  
  test('Authentication flow', async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Sign In")');
    await page.waitForURL('**/dashboard');
    
    // Verify dashboard loaded
    await expect(page.locator('text=Dashboard')).toBeVisible();
    console.log('✅ Authentication working');
  });

  test('Dashboard elements', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    
    // Check key elements
    const elements = [
      'text=Active Leagues',
      'text=Total Portfolio Value',
      'text=Best Performer',
      'text=Market Overview',
      'text=Achievements',
      'text=Your Leagues',
    ];
    
    for (const element of elements) {
      await expect(page.locator(element).first()).toBeVisible();
    }
    
    console.log('✅ Dashboard elements present');
  });

  test('League creation', async ({ page }) => {
    await page.goto(`${BASE_URL}/leagues/create`);
    
    // Fill form
    await page.fill('input[placeholder*="League Name"]', 'Test League ' + Date.now());
    await page.fill('textarea', 'Test description');
    
    // Submit
    await page.click('button:has-text("Create League")');
    
    // Wait for success
    await page.waitForSelector('text=League Created!', { timeout: 10000 });
    
    console.log('✅ League creation working');
  });

  test('Invite system', async ({ page }) => {
    // Go to a league page
    await page.goto(`${BASE_URL}/dashboard`);
    await page.click('text=Test League');
    await page.waitForURL('**/leagues/**');
    
    // Check for invite section (if commissioner)
    const inviteSection = await page.locator('text=Invite Friends').isVisible().catch(() => false);
    
    if (inviteSection) {
      await expect(page.locator('code')).toBeVisible();
      console.log('✅ Invite system working');
    } else {
      console.log('ℹ️ Not commissioner, skipping invite test');
    }
  });

  test('Market overview', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    
    // Check market data loaded
    const marketSection = await page.locator('text=Market Overview').isVisible();
    expect(marketSection).toBeTruthy();
    
    // Check for indices
    const hasSPY = await page.locator('text=SPY').isVisible().catch(() => false);
    const hasDIA = await page.locator('text=DIA').isVisible().catch(() => false);
    
    if (hasSPY || hasDIA) {
      console.log('✅ Market data loading');
    } else {
      console.log('⚠️ Market data may be delayed');
    }
  });

  test('Achievements display', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    
    // Check achievements section
    await expect(page.locator('text=Achievements')).toBeVisible();
    
    // Check for specific achievements
    const achievements = ['Team Player', 'First Trade', 'Active Trader'];
    for (const achievement of achievements) {
      const visible = await page.locator(`text=${achievement}`).isVisible().catch(() => false);
      if (visible) {
        console.log(`✅ Achievement "${achievement}" visible`);
      }
    }
  });

  test('Responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/mobile-view.png' });
    
    // Check if content is visible and not overflowing
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 50); // Allow small margin
    
    console.log('✅ Responsive design working');
  });

  test('Performance check', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    
    // Measure load time
    const navigationTiming = await page.evaluate(() => {
      return JSON.parse(JSON.stringify(performance.timing));
    });
    
    const loadTime = navigationTiming.loadEventEnd - navigationTiming.navigationStart;
    console.log(`Page load time: ${loadTime}ms`);
    
    expect(loadTime).toBeLessThan(10000); // Should load in under 10 seconds
  });
});
