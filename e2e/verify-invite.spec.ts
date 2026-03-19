import { test, expect } from '@playwright/test';

test('Verify invite code displays on league page', async ({ page }) => {
  // Go to the Test League page
  await page.goto('https://wall-street-fantasy.vercel.app/leagues/6cb5423b-53c6-4ba0-a721-5f02e1991d7a');
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  
  // Take screenshot for debugging
  await page.screenshot({ path: 'test-results/league-page.png' });
  
  // Check if commissioner banner shows
  const banner = await page.locator('text=You are the commissioner').isVisible().catch(() => false);
  console.log('Commissioner banner visible:', banner);
  
  // Check for invite code
  const inviteCode = await page.locator('code').textContent().catch(() => null);
  console.log('Invite code found:', inviteCode);
  
  // Verify
  expect(inviteCode).toBeTruthy();
});
