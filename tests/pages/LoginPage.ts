import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Login Page Object Model
 */
export class LoginPage extends BasePage {
  // Locators
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly signUpLink: Locator;
  readonly forgotPasswordLink: Locator;
  readonly errorMessage: Locator;
  readonly successMessage: Locator;
  readonly rememberMeCheckbox: Locator;
  
  constructor(page: Page) {
    super(page);
    
    // Initialize login-specific locators
    this.emailInput = page.locator('input[type="email"], input[name="email"], #email');
    this.passwordInput = page.locator('input[type="password"], input[name="password"], #password');
    this.submitButton = page.locator('button[type="submit"]:has-text("Sign In"), button[type="submit"]:has-text("Login")');
    this.signUpLink = page.locator('a:has-text("Sign Up"), a:has-text("Create account")');
    this.forgotPasswordLink = page.locator('a:has-text("Forgot password"), a:has-text("Reset password")');
    this.errorMessage = page.locator('[role="alert"].error, .error-message, .text-red-600');
    this.successMessage = page.locator('[role="alert"].success, .success-message, .text-green-600');
    this.rememberMeCheckbox = page.locator('input[type="checkbox"][name="remember"], #remember');
  }
  
  async goto() {
    await super.goto('/login');
  }
  
  async login(email: string, password: string, rememberMe: boolean = false) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    
    if (rememberMe) {
      await this.rememberMeCheckbox.check();
    }
    
    await this.submitButton.click();
    
    // Wait for either success (navigation) or error message
    await Promise.race([
      this.page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 }),
      this.errorMessage.waitFor({ state: 'visible', timeout: 5000 })
    ]).catch(() => {});
  }
  
  async loginWithValidCredentials(email: string, password: string) {
    await this.login(email, password);
    
    // Verify successful login by checking URL change
    await expect(this.page).not.toHaveURL(/\/login/);
  }
  
  async loginWithInvalidCredentials(email: string, password: string) {
    await this.login(email, password);
    
    // Verify error message appears
    await expect(this.errorMessage).toBeVisible();
  }
  
  async getErrorMessage(): Promise<string> {
    await this.errorMessage.waitFor({ state: 'visible' });
    return await this.errorMessage.textContent() || '';
  }
  
  async navigateToSignUp() {
    await this.signUpLink.click();
    await this.page.waitForURL(/\/(signup|register)/);
  }
  
  async navigateToForgotPassword() {
    await this.forgotPasswordLink.click();
    await this.page.waitForURL(/\/(forgot|reset)/);
  }
  
  async validateFormFields() {
    // Check email field
    await expect(this.emailInput).toBeVisible();
    await expect(this.emailInput).toHaveAttribute('type', 'email');
    await expect(this.emailInput).toHaveAttribute('required', '');
    
    // Check password field
    await expect(this.passwordInput).toBeVisible();
    await expect(this.passwordInput).toHaveAttribute('type', 'password');
    await expect(this.passwordInput).toHaveAttribute('required', '');
    
    // Check submit button
    await expect(this.submitButton).toBeVisible();
    await expect(this.submitButton).toBeEnabled();
  }
  
  async checkAccessibility() {
    const results = await super.checkPageAccessibility();
    
    // Check for form labels
    const emailLabel = await this.page.locator('label[for]:has-text("Email")').isVisible();
    const passwordLabel = await this.page.locator('label[for]:has-text("Password")').isVisible();
    
    return {
      ...results,
      hasEmailLabel: emailLabel,
      hasPasswordLabel: passwordLabel,
      emailHasAriaLabel: await this.emailInput.getAttribute('aria-label') !== null,
      passwordHasAriaLabel: await this.passwordInput.getAttribute('aria-label') !== null
    };
  }
}