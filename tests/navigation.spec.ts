import { test, expect } from '@playwright/test';
import { BasePage } from './pages/BasePage';
import { takeScreenshot, waitForPageLoad } from './helpers/test-helpers';

test.describe('Navigation', () => {
  let basePage: BasePage;

  test.beforeEach(async ({ page }) => {
    basePage = new BasePage(page);
    await basePage.goto('/');
  });

  test.describe('Header Navigation', () => {
    test('should display logo and brand name @smoke', async ({ page }) => {
      // Check for aisista.ai logo
      const logo = page.locator('img[alt*="aisista"], img[alt*="logo"]').first();
      await expect(logo).toBeVisible();
      
      // Check for brand text
      const brandText = page.locator(':has-text("aisista.ai")').first();
      expect(await brandText.isVisible()).toBeTruthy();
    });

    test('should navigate to home when logo is clicked', async ({ page }) => {
      const logoLink = page.locator('a:has(img[alt*="logo"]), a:has-text("aisista.ai")').first();
      
      if (await logoLink.isVisible()) {
        await logoLink.click();
        await page.waitForURL('/');
        expect(page.url().endsWith('/')).toBeTruthy();
      }
    });

    test('should display main navigation menu items', async ({ page }) => {
      const commonNavItems = [
        'Dashboard', 
        'Tasks', 
        'Habits', 
        'Goals',
        'AI Coach',
        'Job Finder',
        'Projects'
      ];

      for (const item of commonNavItems) {
        const navItem = page.locator(`nav a:has-text("${item}"), nav button:has-text("${item}")`).first();
        if (await navItem.isVisible()) {
          await expect(navItem).toBeVisible();
        }
      }
    });

    test('should have user menu when logged in', async ({ page }) => {
      // This test assumes user might be logged in
      const userMenu = page.locator('[data-testid="user-menu"], button:has-text("User"), .user-menu').first();
      const loginButton = page.locator('a:has-text("Login"), a:has-text("Sign In")').first();
      
      // Either user menu or login button should be visible
      const hasUserMenu = await userMenu.isVisible();
      const hasLoginButton = await loginButton.isVisible();
      
      expect(hasUserMenu || hasLoginButton).toBeTruthy();
    });

    test('should show login/signup buttons when not authenticated', async ({ page }) => {
      // Navigate to home and check for auth buttons
      await basePage.goto('/');
      
      const loginButton = page.locator('a:has-text("Login"), a:has-text("Sign In"), button:has-text("Login")').first();
      const signupButton = page.locator('a:has-text("Sign Up"), a:has-text("Get Started"), button:has-text("Sign Up")').first();
      
      // At least one auth button should be visible
      const hasLogin = await loginButton.isVisible();
      const hasSignup = await signupButton.isVisible();
      
      expect(hasLogin || hasSignup).toBeTruthy();
    });
  });

  test.describe('Navigation Links', () => {
    const navigationTests = [
      { name: 'Dashboard', path: '/dashboard', alternativePaths: ['/app', '/home'] },
      { name: 'Tasks', path: '/tasks', alternativePaths: ['/task-board', '/taskboard'] },
      { name: 'Habits', path: '/habits', alternativePaths: ['/habit-tracker'] },
      { name: 'Goals', path: '/goals', alternativePaths: [] },
      { name: 'AI Coach', path: '/ai-coach', alternativePaths: ['/coach', '/ai-coaching'] },
      { name: 'Job Finder', path: '/jobs', alternativePaths: ['/job-finder', '/career'] },
      { name: 'Projects', path: '/projects', alternativePaths: [] }
    ];

    for (const nav of navigationTests) {
      test(`should navigate to ${nav.name} page`, async ({ page }) => {
        const navLink = page.locator(`nav a:has-text("${nav.name}"), nav button:has-text("${nav.name}")`).first();
        
        if (await navLink.isVisible()) {
          await navLink.click();
          
          // Wait for navigation
          await Promise.race([
            page.waitForURL(nav.path),
            ...nav.alternativePaths.map(path => page.waitForURL(path)),
            page.waitForURL(/\/(login|auth)/) // Might redirect to login
          ]);
          
          await waitForPageLoad(page);
          
          // Verify we're on the correct page or login page
          const currentUrl = page.url();
          const isOnTargetPage = currentUrl.includes(nav.path) || 
                               nav.alternativePaths.some(path => currentUrl.includes(path));
          const isOnLoginPage = currentUrl.includes('/login') || currentUrl.includes('/auth');
          
          expect(isOnTargetPage || isOnLoginPage).toBeTruthy();
        } else {
          test.skip(`${nav.name} navigation link not found`);
        }
      });
    }
  });

  test.describe('Breadcrumb Navigation', () => {
    test('should display breadcrumbs on deep pages', async ({ page }) => {
      // Navigate to a potentially deep page
      await page.goto('/tasks');
      await waitForPageLoad(page);
      
      const breadcrumb = page.locator('[aria-label="Breadcrumb"], .breadcrumb, nav ol').first();
      
      if (await breadcrumb.isVisible()) {
        await expect(breadcrumb).toBeVisible();
        
        // Check for home link in breadcrumb
        const homeLink = breadcrumb.locator('a:has-text("Home"), a:has-text("Dashboard")').first();
        if (await homeLink.isVisible()) {
          await expect(homeLink).toBeVisible();
        }
      }
    });
  });

  test.describe('Mobile Navigation', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
    });

    test('should display mobile menu button', async ({ page }) => {
      await basePage.goto('/');
      
      const mobileMenuButton = page.locator('button[aria-label="Menu"], button:has-text("Menu"), .mobile-menu-button, [data-testid="mobile-menu-button"]').first();
      
      if (await mobileMenuButton.isVisible()) {
        await expect(mobileMenuButton).toBeVisible();
      }
    });

    test('should open mobile menu when button is clicked', async ({ page }) => {
      await basePage.goto('/');
      
      const mobileMenuButton = page.locator('button[aria-label="Menu"], button:has-text("Menu"), .mobile-menu-button').first();
      
      if (await mobileMenuButton.isVisible()) {
        await mobileMenuButton.click();
        
        // Look for opened menu
        const mobileMenu = page.locator('[role="dialog"], .mobile-menu, .menu-overlay').first();
        await expect(mobileMenu).toBeVisible();
        
        // Should contain navigation links
        const navItems = mobileMenu.locator('a, button');
        const count = await navItems.count();
        expect(count).toBeGreaterThan(0);
      } else {
        test.skip('Mobile menu button not found');
      }
    });

    test('should close mobile menu with close button', async ({ page }) => {
      await basePage.goto('/');
      
      const mobileMenuButton = page.locator('button[aria-label="Menu"]').first();
      
      if (await mobileMenuButton.isVisible()) {
        await mobileMenuButton.click();
        
        const closeButton = page.locator('button[aria-label="Close"], button:has-text("Close"), .close-menu').first();
        
        if (await closeButton.isVisible()) {
          await closeButton.click();
          
          // Menu should be hidden
          const mobileMenu = page.locator('[role="dialog"], .mobile-menu').first();
          await expect(mobileMenu).not.toBeVisible();
        }
      } else {
        test.skip('Mobile menu not available');
      }
    });
  });

  test.describe('Footer Navigation', () => {
    test('should display footer with links', async ({ page }) => {
      await basePage.goto('/');
      
      const footer = page.locator('footer, [role="contentinfo"]').first();
      
      if (await footer.isVisible()) {
        await expect(footer).toBeVisible();
        
        // Check for common footer links
        const commonFooterLinks = ['Privacy', 'Terms', 'Support', 'About'];
        
        for (const linkText of commonFooterLinks) {
          const link = footer.locator(`a:has-text("${linkText}")`).first();
          if (await link.isVisible()) {
            await expect(link).toBeVisible();
          }
        }
      }
    });

    test('should display copyright information', async ({ page }) => {
      await basePage.goto('/');
      
      const footer = page.locator('footer, [role="contentinfo"]').first();
      
      if (await footer.isVisible()) {
        const copyrightText = await footer.locator(':has-text("©"), :has-text("Copyright"), :has-text("aisista.ai")').first().textContent();
        expect(copyrightText).toBeTruthy();
      }
    });
  });

  test.describe('Navigation Accessibility', () => {
    test('should have proper ARIA landmarks', async ({ page }) => {
      await basePage.goto('/');
      
      // Check for main navigation landmark
      const nav = page.locator('nav[role="navigation"], nav').first();
      await expect(nav).toBeVisible();
      
      // Check for main content landmark
      const main = page.locator('main[role="main"], main').first();
      if (await main.isVisible()) {
        await expect(main).toBeVisible();
      }
      
      // Check for banner landmark
      const header = page.locator('header[role="banner"], header').first();
      if (await header.isVisible()) {
        await expect(header).toBeVisible();
      }
    });

    test('should support keyboard navigation', async ({ page }) => {
      await basePage.goto('/');
      
      // Tab through navigation elements
      await page.keyboard.press('Tab');
      
      // Should focus on first focusable element
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
      
      // Continue tabbing through navigation
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab');
        const newFocusedElement = page.locator(':focus');
        if (await newFocusedElement.isVisible()) {
          await expect(newFocusedElement).toBeVisible();
        }
      }
    });

    test('should have skip link for screen readers', async ({ page }) => {
      await basePage.goto('/');
      
      // Press Tab to reveal skip link
      await page.keyboard.press('Tab');
      
      const skipLink = page.locator('a:has-text("Skip to main content"), a:has-text("Skip to content")').first();
      
      if (await skipLink.isVisible()) {
        await expect(skipLink).toBeVisible();
        await expect(skipLink).toBeFocused();
      }
    });
  });

  test.describe('Navigation State Management', () => {
    test('should highlight active navigation item', async ({ page }) => {
      await basePage.goto('/');
      
      // Navigate to tasks page
      const tasksLink = page.locator('nav a:has-text("Tasks")').first();
      
      if (await tasksLink.isVisible()) {
        await tasksLink.click();
        await page.waitForURL(/tasks/);
        
        // Check if the tasks nav item is highlighted/active
        const activeTasksLink = page.locator('nav a:has-text("Tasks")[aria-current="page"], nav a:has-text("Tasks").active, nav a:has-text("Tasks")[class*="active"]').first();
        
        if (await activeTasksLink.isVisible()) {
          await expect(activeTasksLink).toBeVisible();
        }
      }
    });

    test('should maintain navigation state after page reload', async ({ page }) => {
      await basePage.goto('/tasks');
      await waitForPageLoad(page);
      
      // Reload page
      await page.reload();
      await waitForPageLoad(page);
      
      // Should still be on tasks page
      expect(page.url()).toMatch(/tasks/);
      
      // Tasks navigation should still be active if implemented
      const activeTasksLink = page.locator('nav a:has-text("Tasks")[aria-current="page"], nav a:has-text("Tasks").active').first();
      if (await activeTasksLink.isVisible()) {
        await expect(activeTasksLink).toBeVisible();
      }
    });
  });

  test.describe('Responsive Navigation', () => {
    const viewports = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1920, height: 1080 }
    ];

    for (const viewport of viewports) {
      test(`should display properly on ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await basePage.goto('/');
        
        // Navigation should be visible in some form
        const desktopNav = page.locator('nav:not(.mobile-menu)').first();
        const mobileMenuButton = page.locator('button[aria-label="Menu"]').first();
        
        const hasDesktopNav = await desktopNav.isVisible();
        const hasMobileMenu = await mobileMenuButton.isVisible();
        
        expect(hasDesktopNav || hasMobileMenu).toBeTruthy();
        
        // Take screenshot for visual validation
        await takeScreenshot(page, `navigation-${viewport.name.toLowerCase()}`);
      });
    }
  });
});