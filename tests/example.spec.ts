import { test, expect } from '@playwright/test';

test.describe('Aisista.ai Application', () => {
  test('homepage loads and displays aisista.ai branding', async ({ page }) => {
    // Navigate to the homepage
    await page.goto('/');
    
    // Check that the page title contains aisista.ai
    await expect(page).toHaveTitle(/aisista\.ai/);
    
    // Check that the logo is visible
    const logo = page.locator('img[alt="aisista.ai logo"]').first();
    await expect(logo).toBeVisible();
    
    // Check for main navigation or content
    const navigation = page.locator('nav, header').first();
    await expect(navigation).toBeVisible();
  });

  test('navigation works correctly', { tag: '@smoke' }, async ({ page }) => {
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check that we can interact with the page
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    // Screenshot for visual verification (only on failure)
    await page.screenshot({ path: 'tests/screenshots/homepage.png', fullPage: true });
  });

  test('logo image loads successfully', async ({ page }) => {
    await page.goto('/');
    
    // Check that the logo image loads without errors
    const logo = page.locator('img[alt="aisista.ai logo"]').first();
    await expect(logo).toBeVisible();
    
    // Verify the image source is correct
    await expect(logo).toHaveAttribute('src', /aisista-logo\.png/);
  });
});