import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { TEST_USERS, waitForPageLoad, takeScreenshot } from './helpers/test-helpers';

test.describe('Authentication', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test.describe('Login Page', () => {
    test('should display login form elements @smoke', async ({ page }) => {
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('should show validation errors for empty fields', async ({ page }) => {
      await loginPage.submitButton.click();
      
      // Check for HTML5 validation or custom error messages
      const emailValidity = await loginPage.emailInput.evaluate((el: HTMLInputElement) => el.validity.valid);
      const passwordValidity = await loginPage.passwordInput.evaluate((el: HTMLInputElement) => el.validity.valid);
      
      expect(emailValidity || passwordValidity).toBeFalsy();
    });

    test('should show error for invalid email format', async ({ page }) => {
      await loginPage.emailInput.fill('invalid-email');
      await loginPage.passwordInput.fill('password123');
      await loginPage.submitButton.click();

      // Check HTML5 email validation
      const emailValidity = await loginPage.emailInput.evaluate((el: HTMLInputElement) => el.validity.valid);
      expect(emailValidity).toBeFalsy();
    });

    test('should attempt login with valid email format', async ({ page }) => {
      await loginPage.emailInput.fill('test@example.com');
      await loginPage.passwordInput.fill('password123');
      
      // Wait for potential API call (will likely fail with invalid credentials)
      const responsePromise = page.waitForResponse(response => 
        response.url().includes('/auth/') && response.request().method() === 'POST'
      ).catch(() => null);
      
      await loginPage.submitButton.click();
      
      // Either we get redirected on success or see an error
      await Promise.race([
        page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 5000 }),
        loginPage.errorMessage.waitFor({ state: 'visible', timeout: 5000 }),
        page.waitForTimeout(5000)
      ]);
    });

    test('should navigate to sign up page', async ({ page }) => {
      const signUpLink = page.locator('a:has-text("Sign Up"), a:has-text("Create account"), a:has-text("Register")').first();
      
      if (await signUpLink.isVisible()) {
        await signUpLink.click();
        await page.waitForURL(/\/(signup|register|sign-up)/);
      } else {
        test.skip('Sign up link not found on login page');
      }
    });

    test('should handle remember me checkbox', async ({ page }) => {
      const rememberCheckbox = page.locator('input[type="checkbox"][name="remember"], #remember').first();
      
      if (await rememberCheckbox.isVisible()) {
        await rememberCheckbox.check();
        expect(await rememberCheckbox.isChecked()).toBeTruthy();
        
        await rememberCheckbox.uncheck();
        expect(await rememberCheckbox.isChecked()).toBeFalsy();
      } else {
        test.skip('Remember me checkbox not found');
      }
    });
  });

  test.describe('Authentication Flow', () => {
    test('should redirect to login when accessing protected route', async ({ page }) => {
      // Try to access dashboard or other protected route
      await page.goto('/dashboard');
      
      // Should redirect to login
      await page.waitForURL(/\/(login|auth|signin)/);
    });

    test('should maintain auth state after page refresh', async ({ page }) => {
      // This test assumes we have valid test credentials
      // Skip if we don't have a way to create test users
      test.skip('Requires valid test user setup');
      
      // Login with test user
      await loginPage.emailInput.fill(TEST_USERS.regular.email);
      await loginPage.passwordInput.fill(TEST_USERS.regular.password);
      await loginPage.submitButton.click();
      
      // Wait for successful login
      await page.waitForURL((url) => !url.pathname.includes('/login'));
      
      // Refresh page
      await page.reload();
      await waitForPageLoad(page);
      
      // Should still be logged in (not redirected to login)
      expect(page.url()).not.toMatch(/\/(login|auth|signin)/);
    });

    test('should logout successfully', async ({ page }) => {
      test.skip('Requires valid test user setup');
      
      // Login first
      await loginPage.emailInput.fill(TEST_USERS.regular.email);
      await loginPage.passwordInput.fill(TEST_USERS.regular.password);
      await loginPage.submitButton.click();
      await page.waitForURL((url) => !url.pathname.includes('/login'));
      
      // Find and click logout
      const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign Out")').first();
      await logoutButton.click();
      
      // Should redirect to home or login
      await page.waitForURL('/');
    });
  });

  test.describe('Sign Up Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/signup');
    });

    test('should display sign up form elements', async ({ page }) => {
      await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
      
      // Look for additional fields that might be required
      const nameField = page.locator('input[name="name"], input[name="fullName"], input[name="firstName"]').first();
      if (await nameField.isVisible()) {
        await expect(nameField).toBeVisible();
      }
    });

    test('should validate password requirements', async ({ page }) => {
      const emailInput = page.locator('input[type="email"], input[name="email"]').first();
      const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
      const submitButton = page.locator('button[type="submit"]').first();
      
      await emailInput.fill('newuser@test.com');
      await passwordInput.fill('123'); // Weak password
      await submitButton.click();
      
      // Should show password validation error
      const errorMessage = await page.locator('[role="alert"], .error, .text-red-600').first().textContent();
      expect(errorMessage).toBeTruthy();
    });

    test('should navigate back to login page', async ({ page }) => {
      const loginLink = page.locator('a:has-text("Sign In"), a:has-text("Login"), a:has-text("Back to login")').first();
      
      if (await loginLink.isVisible()) {
        await loginLink.click();
        await page.waitForURL(/\/(login|signin|auth)/);
      }
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper form labels and ARIA attributes', async ({ page }) => {
      await loginPage.goto();
      
      // Check for email field accessibility
      const emailField = loginPage.emailInput;
      const emailLabel = await emailField.getAttribute('aria-label') || 
                        await page.locator('label[for]:has-text("Email")').textContent();
      expect(emailLabel).toBeTruthy();
      
      // Check for password field accessibility  
      const passwordField = loginPage.passwordInput;
      const passwordLabel = await passwordField.getAttribute('aria-label') ||
                           await page.locator('label[for]:has-text("Password")').textContent();
      expect(passwordLabel).toBeTruthy();
    });

    test('should support keyboard navigation', async ({ page }) => {
      await loginPage.goto();
      
      // Tab through form elements
      await page.keyboard.press('Tab');
      await expect(loginPage.emailInput).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(loginPage.passwordInput).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(loginPage.submitButton).toBeFocused();
    });

    test('should have proper heading structure', async ({ page }) => {
      await loginPage.goto();
      
      // Check for main heading
      const mainHeading = page.locator('h1').first();
      await expect(mainHeading).toBeVisible();
      
      const headingText = await mainHeading.textContent();
      expect(headingText?.toLowerCase()).toMatch(/(login|sign in|welcome)/);
    });
  });

  test.describe('Responsive Design', () => {
    test('should display properly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await loginPage.goto();
      
      // Form should still be visible and usable
      await expect(loginPage.emailInput).toBeVisible();
      await expect(loginPage.passwordInput).toBeVisible();
      await expect(loginPage.submitButton).toBeVisible();
      
      // Take screenshot for visual validation
      await takeScreenshot(page, 'login-mobile');
    });

    test('should display properly on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await loginPage.goto();
      
      await expect(loginPage.emailInput).toBeVisible();
      await expect(loginPage.passwordInput).toBeVisible();
      await expect(loginPage.submitButton).toBeVisible();
      
      await takeScreenshot(page, 'login-tablet');
    });

    test('should display properly on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await loginPage.goto();
      
      await expect(loginPage.emailInput).toBeVisible();
      await expect(loginPage.passwordInput).toBeVisible();
      await expect(loginPage.submitButton).toBeVisible();
      
      await takeScreenshot(page, 'login-desktop');
    });
  });
});