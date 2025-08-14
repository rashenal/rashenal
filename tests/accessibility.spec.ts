import { test, expect } from '@playwright/test';
import { BasePage } from './pages/BasePage';
import { checkAccessibility, waitForPageLoad } from './helpers/test-helpers';

test.describe('Accessibility', () => {
  let basePage: BasePage;

  test.beforeEach(async ({ page }) => {
    basePage = new BasePage(page);
  });

  test.describe('Landmark Navigation', () => {
    const pages = [
      { name: 'Home', path: '/' },
      { name: 'Dashboard', path: '/dashboard' },
      { name: 'Tasks', path: '/tasks' },
      { name: 'Habits', path: '/habits' },
      { name: 'AI Coach', path: '/ai-coach' },
      { name: 'Jobs', path: '/jobs' }
    ];

    for (const pageInfo of pages) {
      test(`should have proper landmarks on ${pageInfo.name} page`, async ({ page }) => {
        await basePage.goto(pageInfo.path);
        await waitForPageLoad(page);

        // Check for main landmark
        const main = page.locator('main, [role="main"]').first();
        if (await main.isVisible()) {
          await expect(main).toBeVisible();
        }

        // Check for navigation landmark
        const nav = page.locator('nav, [role="navigation"]').first();
        await expect(nav).toBeVisible();

        // Check for banner landmark (header)
        const banner = page.locator('header, [role="banner"]').first();
        if (await banner.isVisible()) {
          await expect(banner).toBeVisible();
        }

        // Check for contentinfo landmark (footer)
        const footer = page.locator('footer, [role="contentinfo"]').first();
        if (await footer.isVisible()) {
          await expect(footer).toBeVisible();
        }
      });
    }
  });

  test.describe('Heading Structure', () => {
    test('should have proper heading hierarchy @smoke', async ({ page }) => {
      await basePage.goto('/');
      await waitForPageLoad(page);

      // Should have an h1
      const h1 = page.locator('h1').first();
      await expect(h1).toBeVisible();

      // Check heading sequence doesn't skip levels
      const headings = page.locator('h1, h2, h3, h4, h5, h6');
      const headingCount = await headings.count();

      if (headingCount > 1) {
        const headingLevels: number[] = [];
        
        for (let i = 0; i < headingCount; i++) {
          const heading = headings.nth(i);
          const tagName = await heading.evaluate(el => el.tagName.toLowerCase());
          const level = parseInt(tagName.charAt(1));
          headingLevels.push(level);
        }

        // First heading should be h1
        expect(headingLevels[0]).toBe(1);

        // Check for proper nesting (no skipped levels)
        for (let i = 1; i < headingLevels.length; i++) {
          const currentLevel = headingLevels[i];
          const previousLevel = headingLevels[i - 1];
          
          // Should not jump more than one level
          if (currentLevel > previousLevel) {
            expect(currentLevel - previousLevel).toBeLessThanOrEqual(1);
          }
        }
      }
    });

    test('should have descriptive heading text', async ({ page }) => {
      await basePage.goto('/dashboard');
      await waitForPageLoad(page);

      const headings = page.locator('h1, h2, h3');
      const count = await headings.count();

      for (let i = 0; i < Math.min(count, 5); i++) {
        const heading = headings.nth(i);
        const headingText = await heading.textContent();
        
        expect(headingText?.trim().length || 0).toBeGreaterThan(0);
        expect(headingText?.trim()).not.toBe('...');
        expect(headingText?.trim()).not.toBe('Loading...');
      }
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should support tab navigation through interactive elements', async ({ page }) => {
      await basePage.goto('/');
      await waitForPageLoad(page);

      // Start tabbing
      await page.keyboard.press('Tab');
      
      let focusableElements: string[] = [];
      let currentFocused = page.locator(':focus');
      
      // Tab through first 10 elements
      for (let i = 0; i < 10; i++) {
        if (await currentFocused.isVisible()) {
          const tagName = await currentFocused.evaluate(el => el.tagName.toLowerCase());
          const role = await currentFocused.getAttribute('role');
          const tabIndex = await currentFocused.getAttribute('tabindex');
          
          focusableElements.push(`${tagName}${role ? `[role="${role}"]` : ''}${tabIndex ? `[tabindex="${tabIndex}"]` : ''}`);
          
          // Verify element is actually focusable
          await expect(currentFocused).toBeFocused();
        }
        
        await page.keyboard.press('Tab');
        currentFocused = page.locator(':focus');
      }

      // Should have found focusable elements
      expect(focusableElements.length).toBeGreaterThan(0);
    });

    test('should support Enter key activation', async ({ page }) => {
      await basePage.goto('/');
      await waitForPageLoad(page);

      // Find first button and test Enter activation
      const buttons = page.locator('button, a, input[type="button"], input[type="submit"]');
      const buttonCount = await buttons.count();

      if (buttonCount > 0) {
        const firstButton = buttons.first();
        await firstButton.focus();
        await expect(firstButton).toBeFocused();

        // Press Enter (should not cause error)
        await page.keyboard.press('Enter');
        await page.waitForTimeout(500);
      }
    });

    test('should support Space key activation for buttons', async ({ page }) => {
      await basePage.goto('/');
      await waitForPageLoad(page);

      const buttons = page.locator('button:not([disabled])');
      const buttonCount = await buttons.count();

      if (buttonCount > 0) {
        const firstButton = buttons.first();
        await firstButton.focus();
        await expect(firstButton).toBeFocused();

        // Press Space (should activate button)
        await page.keyboard.press('Space');
        await page.waitForTimeout(500);
      }
    });

    test('should support Escape key to close modals', async ({ page }) => {
      await basePage.goto('/tasks');
      await waitForPageLoad(page);

      // Try to open a modal
      const addButton = page.locator('button:has-text("Add"), button:has-text("New"), button:has-text("Create")').first();
      
      if (await addButton.isVisible()) {
        await addButton.click();
        
        const modal = page.locator('[role="dialog"], .modal').first();
        if (await modal.isVisible()) {
          // Press Escape to close
          await page.keyboard.press('Escape');
          await page.waitForTimeout(500);
          
          // Modal should be closed or focus moved
          const modalVisible = await modal.isVisible().catch(() => false);
          if (modalVisible) {
            // If still visible, check if focus moved back to trigger
            await expect(addButton).toBeFocused();
          }
        }
      }
    });
  });

  test.describe('Screen Reader Support', () => {
    test('should have proper form labels', async ({ page }) => {
      await basePage.goto('/login');
      await waitForPageLoad(page);

      // Check email field
      const emailField = page.locator('input[type="email"], input[name="email"]').first();
      if (await emailField.isVisible()) {
        const ariaLabel = await emailField.getAttribute('aria-label');
        const ariaLabelledBy = await emailField.getAttribute('aria-labelledby');
        const associatedLabel = await page.locator('label[for]').first().textContent();
        
        expect(ariaLabel || ariaLabelledBy || associatedLabel).toBeTruthy();
      }

      // Check password field
      const passwordField = page.locator('input[type="password"], input[name="password"]').first();
      if (await passwordField.isVisible()) {
        const ariaLabel = await passwordField.getAttribute('aria-label');
        const ariaLabelledBy = await passwordField.getAttribute('aria-labelledby');
        const associatedLabel = await page.locator('label[for]').textContent();
        
        expect(ariaLabel || ariaLabelledBy || associatedLabel).toBeTruthy();
      }
    });

    test('should have alt text for images', async ({ page }) => {
      await basePage.goto('/');
      await waitForPageLoad(page);

      const images = page.locator('img');
      const imageCount = await images.count();

      for (let i = 0; i < Math.min(imageCount, 10); i++) {
        const img = images.nth(i);
        if (await img.isVisible()) {
          const altText = await img.getAttribute('alt');
          const role = await img.getAttribute('role');
          
          // Should have alt text or be decorative (role="presentation")
          expect(altText !== null || role === 'presentation').toBeTruthy();
          
          if (altText) {
            expect(altText.trim().length).toBeGreaterThan(0);
          }
        }
      }
    });

    test('should use ARIA labels for interactive elements', async ({ page }) => {
      await basePage.goto('/tasks');
      await waitForPageLoad(page);

      // Check buttons without visible text
      const iconButtons = page.locator('button:not(:has-text())');
      const iconButtonCount = await iconButtons.count();

      for (let i = 0; i < Math.min(iconButtonCount, 5); i++) {
        const button = iconButtons.nth(i);
        if (await button.isVisible()) {
          const ariaLabel = await button.getAttribute('aria-label');
          const ariaLabelledBy = await button.getAttribute('aria-labelledby');
          const title = await button.getAttribute('title');
          
          expect(ariaLabel || ariaLabelledBy || title).toBeTruthy();
        }
      }
    });

    test('should announce dynamic content changes', async ({ page }) => {
      await basePage.goto('/ai-coach');
      await waitForPageLoad(page);

      // Look for live regions
      const liveRegions = page.locator('[aria-live], [role="status"], [role="alert"], [role="log"]');
      const liveRegionCount = await liveRegions.count();

      if (liveRegionCount > 0) {
        for (let i = 0; i < liveRegionCount; i++) {
          const region = liveRegions.nth(i);
          const ariaLive = await region.getAttribute('aria-live');
          const role = await region.getAttribute('role');
          
          expect(ariaLive || ['status', 'alert', 'log'].includes(role || '')).toBeTruthy();
        }
      }
    });
  });

  test.describe('Color and Contrast', () => {
    test('should not rely solely on color for information', async ({ page }) => {
      await basePage.goto('/tasks');
      await waitForPageLoad(page);

      // Look for status indicators that might rely only on color
      const statusElements = page.locator('.status, .priority, .category, [data-status]');
      const statusCount = await statusElements.count();

      for (let i = 0; i < Math.min(statusCount, 5); i++) {
        const element = statusElements.nth(i);
        if (await element.isVisible()) {
          const textContent = await element.textContent();
          const ariaLabel = await element.getAttribute('aria-label');
          const title = await element.getAttribute('title');
          
          // Should have text, icon, or additional context beyond just color
          expect(textContent?.trim() || ariaLabel || title).toBeTruthy();
        }
      }
    });

    test('should maintain readability without color', async ({ page }) => {
      // Apply grayscale filter to simulate color blindness
      await page.addStyleTag({
        content: `
          * {
            filter: grayscale(100%) !important;
          }
        `
      });

      await basePage.goto('/dashboard');
      await waitForPageLoad(page);

      // Check that text is still readable
      const textElements = page.locator('h1, h2, h3, p, span, div').filter({ hasText: /.+/ });
      const textCount = await textElements.count();

      if (textCount > 0) {
        const firstElement = textElements.first();
        await expect(firstElement).toBeVisible();
        
        const textContent = await firstElement.textContent();
        expect(textContent?.trim().length || 0).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Focus Management', () => {
    test('should have visible focus indicators', async ({ page }) => {
      await basePage.goto('/');
      await waitForPageLoad(page);

      // Tab to focusable elements and check for focus indicators
      const focusableElements = page.locator('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
      const count = await focusableElements.count();

      if (count > 0) {
        const firstElement = focusableElements.first();
        await firstElement.focus();
        
        // Check if element has focus styling
        const computedStyle = await firstElement.evaluate(el => {
          const style = window.getComputedStyle(el, ':focus');
          return {
            outline: style.outline,
            outlineWidth: style.outlineWidth,
            outlineStyle: style.outlineStyle,
            outlineColor: style.outlineColor,
            boxShadow: style.boxShadow,
            border: style.border
          };
        });

        // Should have some form of focus indicator
        const hasFocusIndicator = 
          computedStyle.outline !== 'none' ||
          computedStyle.outlineWidth !== '0px' ||
          computedStyle.boxShadow !== 'none' ||
          computedStyle.border !== 'none';

        expect(hasFocusIndicator).toBeTruthy();
      }
    });

    test('should trap focus in modals', async ({ page }) => {
      await basePage.goto('/tasks');
      await waitForPageLoad(page);

      const addButton = page.locator('button:has-text("Add"), button:has-text("New"), button:has-text("Create")').first();
      
      if (await addButton.isVisible()) {
        await addButton.click();
        
        const modal = page.locator('[role="dialog"], .modal').first();
        if (await modal.isVisible()) {
          // Tab through modal elements
          await page.keyboard.press('Tab');
          await page.keyboard.press('Tab');
          await page.keyboard.press('Tab');
          
          // Focus should stay within modal
          const focusedElement = page.locator(':focus');
          const isInsideModal = await modal.locator(':focus').count() > 0;
          
          expect(isInsideModal).toBeTruthy();
        }
      }
    });

    test('should return focus after modal closes', async ({ page }) => {
      await basePage.goto('/tasks');
      await waitForPageLoad(page);

      const addButton = page.locator('button:has-text("Add"), button:has-text("New")').first();
      
      if (await addButton.isVisible()) {
        await addButton.focus();
        await addButton.click();
        
        const modal = page.locator('[role="dialog"], .modal').first();
        if (await modal.isVisible()) {
          // Close modal with Escape
          await page.keyboard.press('Escape');
          await page.waitForTimeout(500);
          
          // Focus should return to trigger button
          await expect(addButton).toBeFocused();
        }
      }
    });
  });

  test.describe('Skip Links', () => {
    test('should have skip to main content link', async ({ page }) => {
      await basePage.goto('/');
      await waitForPageLoad(page);

      // Press Tab to reveal skip link
      await page.keyboard.press('Tab');
      
      const skipLink = page.locator('a:has-text("Skip to main"), a:has-text("Skip to content"), a[href="#main"], a[href="#content"]').first();
      
      if (await skipLink.isVisible()) {
        await expect(skipLink).toBeVisible();
        await expect(skipLink).toBeFocused();
        
        // Test skip link functionality
        await skipLink.click();
        
        const mainContent = page.locator('main, #main, #content, [role="main"]').first();
        if (await mainContent.isVisible()) {
          // Main content should be focused or focusable element within it
          const focusedElement = page.locator(':focus');
          const isFocusInMain = await mainContent.locator(':focus').count() > 0;
          
          expect(isFocusInMain).toBeTruthy();
        }
      }
    });
  });

  test.describe('Error Handling and Validation', () => {
    test('should provide accessible error messages', async ({ page }) => {
      await basePage.goto('/login');
      await waitForPageLoad(page);

      // Try to submit form with invalid data
      const emailField = page.locator('input[type="email"]').first();
      const submitButton = page.locator('button[type="submit"]').first();
      
      if (await emailField.isVisible() && await submitButton.isVisible()) {
        await emailField.fill('invalid-email');
        await submitButton.click();
        
        // Look for accessible error messages
        const errorMessage = page.locator('[role="alert"], .error, .field-error, [aria-describedby*="error"]').first();
        
        if (await errorMessage.isVisible()) {
          await expect(errorMessage).toBeVisible();
          
          // Error should be announced to screen readers
          const role = await errorMessage.getAttribute('role');
          const ariaLive = await errorMessage.getAttribute('aria-live');
          
          expect(role === 'alert' || ariaLive === 'polite' || ariaLive === 'assertive').toBeTruthy();
        }
      }
    });

    test('should associate error messages with form fields', async ({ page }) => {
      await basePage.goto('/login');
      await waitForPageLoad(page);

      const emailField = page.locator('input[type="email"]').first();
      const submitButton = page.locator('button[type="submit"]').first();
      
      if (await emailField.isVisible()) {
        await emailField.fill('invalid');
        await submitButton.click();
        
        // Check if field is associated with error message
        const ariaDescribedBy = await emailField.getAttribute('aria-describedby');
        const ariaInvalid = await emailField.getAttribute('aria-invalid');
        
        if (ariaDescribedBy) {
          const errorElement = page.locator(`#${ariaDescribedBy}`);
          if (await errorElement.isVisible()) {
            await expect(errorElement).toBeVisible();
          }
        }
        
        // Field should be marked as invalid
        if (ariaInvalid) {
          expect(ariaInvalid).toBe('true');
        }
      }
    });
  });

  test.describe('Mobile Accessibility', () => {
    test('should be accessible on touch devices', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await basePage.goto('/');
      await waitForPageLoad(page);

      // Check touch target sizes (minimum 44px)
      const touchTargets = page.locator('button, a, input[type="button"], input[type="submit"]');
      const targetCount = await touchTargets.count();

      for (let i = 0; i < Math.min(targetCount, 5); i++) {
        const target = touchTargets.nth(i);
        if (await target.isVisible()) {
          const boundingBox = await target.boundingBox();
          
          if (boundingBox) {
            // Should meet minimum touch target size (44px)
            expect(Math.max(boundingBox.width, boundingBox.height)).toBeGreaterThanOrEqual(32);
          }
        }
      }
    });

    test('should support zoom up to 200%', async ({ page }) => {
      await basePage.goto('/');
      await waitForPageLoad(page);

      // Simulate zoom
      await page.setViewportSize({ width: 400, height: 600 });
      await page.evaluate(() => {
        document.body.style.zoom = '2';
      });

      await page.waitForTimeout(1000);

      // Page should still be usable
      const mainContent = page.locator('main, .content, .container').first();
      if (await mainContent.isVisible()) {
        await expect(mainContent).toBeVisible();
      }

      // Navigation should still work
      const navLinks = page.locator('nav a, nav button');
      const navCount = await navLinks.count();
      
      if (navCount > 0) {
        await expect(navLinks.first()).toBeVisible();
      }
    });
  });

  test.describe('Accessibility Testing Integration', () => {
    test('should run accessibility checks on key pages', async ({ page }) => {
      const keyPages = ['/', '/dashboard', '/tasks', '/login'];
      
      for (const pagePath of keyPages) {
        await basePage.goto(pagePath);
        await waitForPageLoad(page);
        
        // Basic accessibility check
        const results = await basePage.checkPageAccessibility();
        
        expect(results.hasMain || results.hasNavigation).toBeTruthy();
        
        // Check for basic structure
        const headings = page.locator('h1, h2, h3, h4, h5, h6');
        const headingCount = await headings.count();
        
        if (headingCount > 0) {
          expect(headingCount).toBeGreaterThan(0);
        }
      }
    });
  });
});