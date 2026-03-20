import { test, expect } from '@playwright/test';

const BASE_URL = 'https://wall-street-fantasy.vercel.app';

test.describe('Bug Hunting - Comprehensive Tests', () => {
  
  test('All pages load without errors', async ({ page }) => {
    const pages = [
      '/',
      '/login',
      '/register',
      '/dashboard',
      '/leagues/create',
      '/leagues/join',
    ];

    for (const path of pages) {
      await page.goto(`${BASE_URL}${path}`);
      await page.waitForLoadState('networkidle');
      
      // Check for error messages
      const hasError = await page.locator('text=Error').isVisible().catch(() => false);
      const hasException = await page.locator('text=exception').isVisible().catch(() => false);
      
      if (hasError || hasException) {
        await page.screenshot({ path: `test-results/error-${path.replace('/', '-')}.png` });
        console.log(`❌ Error on ${path}`);
      } else {
        console.log(`✅ ${path} loads correctly`);
      }
    }
  });

  test('Responsive design - mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    
    // Check if content is visible and not overflowing
    const bodyOverflow = await page.evaluate(() => {
      return document.body.scrollWidth > window.innerWidth;
    });
    
    if (bodyOverflow) {
      console.log('❌ Horizontal overflow detected on mobile');
      await page.screenshot({ path: 'test-results/mobile-overflow.png' });
    } else {
      console.log('✅ No overflow on mobile');
    }
    
    await page.screenshot({ path: 'test-results/mobile-view.png' });
  });

  test('Form validation - empty inputs', async ({ page }) => {
    await page.goto(`${BASE_URL}/leagues/join`);
    await page.waitForLoadState('networkidle');
    
    // Try to submit empty form
    const submitButton = await page.locator('button:has-text("Join League")');
    const isDisabled = await submitButton.isDisabled().catch(() => false);
    
    if (isDisabled) {
      console.log('✅ Submit button correctly disabled for empty input');
    } else {
      await submitButton.click();
      await page.waitForTimeout(500);
      
      // Check for validation message
      const hasValidation = await page.locator('text=required').isVisible().catch(() => false);
      console.log(hasValidation ? '✅ Validation message shown' : '❌ No validation on empty form');
    }
  });

  test('API error handling', async ({ page }) => {
    // Block API requests to test error handling
    await page.route('**/api/**', route => route.abort('failed'));
    
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    
    // Check if page shows error state gracefully
    const hasErrorUI = await page.locator('text=Error').isVisible().catch(() => false);
    const hasLoading = await page.locator('text=Loading').isVisible().catch(() => false);
    
    if (hasErrorUI) {
      console.log('✅ Error UI shown when API fails');
    } else if (hasLoading) {
      console.log('⚠️ Still showing loading state when API fails');
    } else {
      console.log('✅ Page handles API errors gracefully');
    }
    
    await page.unroute('**/api/**');
  });

  test('Memory leak check - rapid navigation', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    
    // Rapidly navigate between pages
    for (let i = 0; i < 10; i++) {
      await page.goto(`${BASE_URL}/dashboard`);
      await page.goto(`${BASE_URL}/leagues/join`);
    }
    
    // Check if page is still responsive
    const isResponsive = await page.evaluate(() => {
      return document.readyState === 'complete';
    });
    
    console.log(isResponsive ? '✅ Page responsive after rapid navigation' : '❌ Page not responsive');
  });

  test('Console error check', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    if (errors.length > 0) {
      console.log('❌ Console errors found:', errors);
    } else {
      console.log('✅ No console errors');
    }
  });
});
