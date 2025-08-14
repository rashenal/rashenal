import { Page, expect } from '@playwright/test';

/**
 * Test Helper Utilities for Playwright Tests
 */

// Test user credentials
export const TEST_USERS = {
  admin: {
    email: 'test-admin@aisista.ai',
    password: 'TestAdmin123!',
    name: 'Test Admin'
  },
  regular: {
    email: 'test-user@aisista.ai', 
    password: 'TestUser123!',
    name: 'Test User'
  },
  new: {
    email: `test-${Date.now()}@aisista.ai`,
    password: 'NewUser123!',
    name: 'New Test User'
  }
};

// Wait for page to be fully loaded
export async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForLoadState('domcontentloaded');
}

// Login helper
export async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  
  // Wait for navigation to complete
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
  await waitForPageLoad(page);
}

// Logout helper
export async function logout(page: Page) {
  // Click on user menu or logout button
  const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign Out")').first();
  if (await logoutButton.isVisible()) {
    await logoutButton.click();
  } else {
    // Try to find it in a dropdown menu
    await page.click('[data-testid="user-menu"], button:has-text("User")').catch(() => {});
    await page.click('button:has-text("Logout"), button:has-text("Sign Out")').first();
  }
  
  await page.waitForURL('/');
}

// Take screenshot with timestamp
export async function takeScreenshot(page: Page, name: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({ 
    path: `tests/screenshots/${name}-${timestamp}.png`,
    fullPage: true 
  });
}

// Check if element is accessible
export async function checkAccessibility(page: Page, selector: string) {
  const element = page.locator(selector);
  
  // Check if element exists and is visible
  await expect(element).toBeVisible();
  
  // Check for aria labels or text content
  const ariaLabel = await element.getAttribute('aria-label');
  const textContent = await element.textContent();
  
  expect(ariaLabel || textContent).toBeTruthy();
  
  // Check for keyboard accessibility
  const tabIndex = await element.getAttribute('tabindex');
  if (tabIndex) {
    expect(parseInt(tabIndex)).toBeGreaterThanOrEqual(-1);
  }
}

// Wait for and dismiss any notifications/toasts
export async function dismissNotifications(page: Page) {
  const notifications = page.locator('[role="alert"], .toast, .notification');
  const count = await notifications.count();
  
  for (let i = 0; i < count; i++) {
    const closeButton = notifications.nth(i).locator('button[aria-label="Close"], .close');
    if (await closeButton.isVisible()) {
      await closeButton.click();
    }
  }
}

// Generate random test data
export function generateTestData(type: 'task' | 'project' | 'habit') {
  const timestamp = Date.now();
  
  switch (type) {
    case 'task':
      return {
        title: `Test Task ${timestamp}`,
        description: `This is a test task created at ${new Date().toISOString()}`,
        priority: 'medium',
        energyLevel: 'm',
        estimatedDuration: 30
      };
    
    case 'project':
      return {
        name: `Test Project ${timestamp}`,
        description: `Test project for automated testing`,
        abbreviation: 'TST'
      };
    
    case 'habit':
      return {
        name: `Test Habit ${timestamp}`,
        frequency: 'daily',
        category: 'wellness'
      };
    
    default:
      return {};
  }
}

// Check responsive layout
export async function checkResponsiveLayout(page: Page, breakpoints?: { mobile?: number; tablet?: number; desktop?: number }) {
  const sizes = breakpoints || {
    mobile: 375,
    tablet: 768,
    desktop: 1920
  };
  
  const results: Record<string, boolean> = {};
  
  for (const [device, width] of Object.entries(sizes)) {
    await page.setViewportSize({ width, height: 800 });
    await page.waitForTimeout(500); // Wait for resize animations
    
    // Check if navigation is properly displayed
    const mobileMenu = page.locator('[data-testid="mobile-menu"], .mobile-menu');
    const desktopNav = page.locator('[data-testid="desktop-nav"], nav:not(.mobile-menu)');
    
    if (device === 'mobile') {
      results[`${device}-has-mobile-menu`] = await mobileMenu.isVisible();
      results[`${device}-no-desktop-nav`] = !(await desktopNav.isVisible());
    } else {
      results[`${device}-has-desktop-nav`] = await desktopNav.isVisible();
    }
  }
  
  return results;
}

// Wait for API response
export async function waitForAPIResponse(page: Page, endpoint: string, timeout = 10000) {
  return page.waitForResponse(
    response => response.url().includes(endpoint) && response.status() === 200,
    { timeout }
  );
}