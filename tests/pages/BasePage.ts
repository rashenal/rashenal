import { Page, Locator } from '@playwright/test';

/**
 * Base Page Object Model
 * Contains common functionality for all pages
 */
export class BasePage {
  protected page: Page;
  
  // Common elements
  readonly header: Locator;
  readonly logo: Locator;
  readonly navigationMenu: Locator;
  readonly userMenu: Locator;
  readonly footer: Locator;
  
  constructor(page: Page) {
    this.page = page;
    
    // Initialize common locators
    this.header = page.locator('header, [role="banner"]').first();
    this.logo = page.locator('img[alt*="logo"], a:has(img[alt*="logo"]), .logo').first();
    this.navigationMenu = page.locator('nav, [role="navigation"]').first();
    this.userMenu = page.locator('[data-testid="user-menu"], button:has-text("User"), .user-menu').first();
    this.footer = page.locator('footer, [role="contentinfo"]').first();
  }
  
  async goto(path: string = '/') {
    await this.page.goto(path);
    await this.page.waitForLoadState('networkidle');
  }
  
  async getTitle(): Promise<string> {
    return await this.page.title();
  }
  
  async takeScreenshot(name: string) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await this.page.screenshot({
      path: `tests/screenshots/${name}-${timestamp}.png`,
      fullPage: true
    });
  }
  
  async waitForNotification(text?: string) {
    const notification = text 
      ? this.page.locator(`[role="alert"]:has-text("${text}")`)
      : this.page.locator('[role="alert"]');
    
    await notification.waitFor({ state: 'visible', timeout: 5000 });
    return notification;
  }
  
  async dismissNotification() {
    const closeButton = this.page.locator('[role="alert"] button[aria-label="Close"], [role="alert"] .close').first();
    if (await closeButton.isVisible()) {
      await closeButton.click();
    }
  }
  
  async clickNavigationLink(linkText: string) {
    await this.navigationMenu.locator(`a:has-text("${linkText}"), button:has-text("${linkText}")`).click();
  }
  
  async isLoggedIn(): Promise<boolean> {
    // Check for user menu or logout button as indicators of being logged in
    const logoutButton = this.page.locator('button:has-text("Logout"), button:has-text("Sign Out")');
    return await logoutButton.isVisible().catch(() => false);
  }
  
  async logout() {
    if (await this.isLoggedIn()) {
      const logoutButton = this.page.locator('button:has-text("Logout"), button:has-text("Sign Out")').first();
      await logoutButton.click();
      await this.page.waitForURL('/');
    }
  }
  
  async checkPageAccessibility() {
    // Check for main landmarks
    const main = this.page.locator('main, [role="main"]');
    const nav = this.page.locator('nav, [role="navigation"]');
    const header = this.page.locator('header, [role="banner"]');
    
    return {
      hasMain: await main.isVisible(),
      hasNavigation: await nav.isVisible(),
      hasHeader: await header.isVisible(),
      hasSkipLink: await this.page.locator('a:has-text("Skip to main content")').isVisible().catch(() => false)
    };
  }
  
  async setViewportSize(device: 'mobile' | 'tablet' | 'desktop') {
    const sizes = {
      mobile: { width: 375, height: 667 },
      tablet: { width: 768, height: 1024 },
      desktop: { width: 1920, height: 1080 }
    };
    
    await this.page.setViewportSize(sizes[device]);
    await this.page.waitForTimeout(300); // Wait for resize animations
  }
}