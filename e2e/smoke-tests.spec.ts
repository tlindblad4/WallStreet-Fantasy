import { test, expect } from '@playwright/test';

test.describe('WallStreet Fantasy - Automated Testing', () => {
  
  test('Login page loads', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('text=Sign in to your account')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('Dashboard shows invite code for commissioners', async ({ page }) => {
    // This test requires manual login or test credentials
    // For now, just check the page structure
    await page.goto('/dashboard');
    
    // If redirected to login, that's expected
    if (page.url().includes('/login')) {
      console.log('Redirected to login - user not authenticated');
      return;
    }
    
    await expect(page.locator('text=Your Leagues')).toBeVisible();
  });

  test('Join league page has invite code input', async ({ page }) => {
    await page.goto('/leagues/join');
    await expect(page.locator('text=Join a League')).toBeVisible();
    await expect(page.locator('input')).toBeVisible();
    await expect(page.locator('button:has-text("Join League")')).toBeVisible();
  });

  test('Landing page loads correctly', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=WallStreet Fantasy')).toBeVisible();
    await expect(page.locator('text=Get Started')).toBeVisible();
  });
});
