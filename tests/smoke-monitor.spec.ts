import { test, expect } from '@playwright/test';
import { BasePage } from './pages/BasePage';

/**
 * Smoke Tests for Live Monitoring
 * These tests are optimized for visual observation and quick execution
 */
test.describe('Live Monitoring Smoke Tests', () => {
  let basePage: BasePage;

  test.beforeEach(async ({ page }) => {
    basePage = new BasePage(page);
    // Add some delay so you can see the navigation
    await page.waitForTimeout(1000);
  });

  test('🏠 Homepage loads and displays branding', async ({ page }) => {
    console.log('📱 Navigating to homepage...');
    await basePage.goto('/');
    
    // Slower actions for visibility
    await page.waitForTimeout(2000);
    
    console.log('🔍 Checking page title...');
    await expect(page).toHaveTitle(/aisista\.ai/);
    
    console.log('🖼️ Looking for logo...');
    const logo = page.locator('img[alt="aisista.ai logo"]').first();
    await expect(logo).toBeVisible();
    
    console.log('✅ Homepage test complete');
  });

  test('🔐 Login page displays form elements', async ({ page }) => {
    console.log('📱 Navigating to login page...');
    await basePage.goto('/login');
    await page.waitForTimeout(2000);
    
    console.log('🔍 Checking email input...');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    
    console.log('🔍 Checking password input...');
    await expect(page.locator('input[type="password"]')).toBeVisible();
    
    console.log('🔍 Checking submit button...');
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    console.log('✅ Login form test complete');
  });

  test('📋 Tasks page is accessible', async ({ page }) => {
    console.log('📱 Navigating to tasks page...');
    await basePage.goto('/tasks');
    await page.waitForTimeout(2000);
    
    // Should redirect to auth, but page should load
    const currentUrl = page.url();
    console.log(`🌍 Current URL: ${currentUrl}`);
    
    if (currentUrl.includes('/auth') || currentUrl.includes('/login')) {
      console.log('🔀 Redirected to auth page (expected for protected route)');
      await expect(page.locator('input[type="email"]')).toBeVisible();
    } else {
      console.log('📋 Tasks page loaded directly');
      // Look for task board elements
      const taskElements = page.locator('.task, .kanban, h1, h2');
      await expect(taskElements.first()).toBeVisible();
    }
    
    console.log('✅ Tasks navigation test complete');
  });

  test('🤖 AI Coach page navigation', async ({ page }) => {
    console.log('📱 Navigating to AI Coach page...');
    await basePage.goto('/ai-coach');
    await page.waitForTimeout(2000);
    
    const currentUrl = page.url();
    console.log(`🌍 Current URL: ${currentUrl}`);
    
    if (currentUrl.includes('/auth') || currentUrl.includes('/login')) {
      console.log('🔀 Redirected to auth page (expected for protected route)');
      await expect(page.locator('input[type="email"]')).toBeVisible();
    } else {
      console.log('🤖 AI Coach page loaded directly');
      // Look for AI coach elements
      const aiElements = page.locator('h1, h2, .coach, .chat');
      await expect(aiElements.first()).toBeVisible();
    }
    
    console.log('✅ AI Coach navigation test complete');
  });

  test('💼 Job Finder page navigation', async ({ page }) => {
    console.log('📱 Navigating to Job Finder page...');
    await basePage.goto('/jobs');
    await page.waitForTimeout(2000);
    
    const currentUrl = page.url();
    console.log(`🌍 Current URL: ${currentUrl}`);
    
    if (currentUrl.includes('/auth') || currentUrl.includes('/login')) {
      console.log('🔀 Redirected to auth page (expected for protected route)');
      await expect(page.locator('input[type="email"]')).toBeVisible();
    } else {
      console.log('💼 Job Finder page loaded directly');
      const jobElements = page.locator('h1, h2, .job, .search');
      await expect(jobElements.first()).toBeVisible();
    }
    
    console.log('✅ Job Finder navigation test complete');
  });

  test('📱 Mobile responsive layout', async ({ page }) => {
    console.log('📱 Testing mobile layout...');
    await page.setViewportSize({ width: 375, height: 667 });
    await basePage.goto('/');
    await page.waitForTimeout(2000);
    
    console.log('🔍 Checking mobile navigation...');
    const mobileMenu = page.locator('button[aria-label="Menu"], .mobile-menu-button, [data-testid="mobile-menu"]').first();
    
    if (await mobileMenu.isVisible()) {
      console.log('📱 Mobile menu button found - clicking...');
      await mobileMenu.click();
      await page.waitForTimeout(1000);
    }
    
    console.log('✅ Mobile layout test complete');
  });

  test('♿ Accessibility landmarks check', async ({ page }) => {
    console.log('📱 Navigating to homepage for accessibility check...');
    await basePage.goto('/');
    await page.waitForTimeout(2000);
    
    console.log('🔍 Checking for main landmark...');
    const main = page.locator('main, [role="main"]').first();
    if (await main.isVisible()) {
      console.log('✅ Main landmark found');
    }
    
    console.log('🔍 Checking for navigation landmark...');
    const nav = page.locator('nav, [role="navigation"]').first();
    await expect(nav).toBeVisible();
    console.log('✅ Navigation landmark found');
    
    console.log('🔍 Checking heading structure...');
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible();
    console.log('✅ H1 heading found');
    
    console.log('✅ Accessibility check complete');
  });
});

test.describe('Form Interaction Demo', () => {
  test('📝 Login form interaction demo', async ({ page }) => {
    console.log('📱 Starting form interaction demo...');
    await page.goto('http://localhost:5173/login');
    await page.waitForTimeout(2000);
    
    console.log('⌨️ Typing email address...');
    await page.fill('input[type="email"]', 'demo@aisista.ai');
    await page.waitForTimeout(1500);
    
    console.log('⌨️ Typing password...');
    await page.fill('input[type="password"]', 'DemoPassword123!');
    await page.waitForTimeout(1500);
    
    console.log('🖱️ Clicking submit button...');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    console.log('✅ Form interaction demo complete');
  });

  test('🔍 Search functionality demo', async ({ page }) => {
    console.log('📱 Testing search functionality...');
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(2000);
    
    const searchInput = page.locator('input[placeholder*="search"], input[name*="search"]').first();
    
    if (await searchInput.isVisible()) {
      console.log('⌨️ Typing search query...');
      await searchInput.fill('productivity tips');
      await page.waitForTimeout(1500);
      
      await searchInput.press('Enter');
      await page.waitForTimeout(2000);
      console.log('✅ Search demo complete');
    } else {
      console.log('ℹ️ No search input found on homepage');
    }
  });
});