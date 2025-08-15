import { test, expect } from '@playwright/test';

/**
 * Responsive Design Tests
 * Testing the application's responsive behavior across different screen sizes
 */
test.describe('Responsive Design', () => {

  test('📱 Mobile viewport (375x667) - Enhanced TaskBoard', async ({ page }) => {
    console.log('📱 Testing mobile viewport for Enhanced TaskBoard...');
    
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:5177/tasks');
    await page.waitForTimeout(2000);
    
    // Take mobile screenshot
    await page.screenshot({ path: 'mobile-enhanced-taskboard.png', fullPage: true });
    
    // Test mobile navigation
    const navigation = await page.locator('nav').first().isVisible();
    console.log(`📱 Navigation visible: ${navigation ? '✅' : '❌'}`);
    
    // Test horizontal scrolling for kanban board
    const kanbanContainer = page.locator('.flex.space-x-6.overflow-x-auto, .flex.gap-6.overflow-x-auto');
    const hasHorizontalScroll = await kanbanContainer.isVisible();
    console.log(`📱 Horizontal scroll container: ${hasHorizontalScroll ? '✅' : '❌'}`);
    
    // Test mobile-friendly button sizes
    const buttons = await page.locator('button').count();
    console.log(`📱 Found ${buttons} buttons (should have touch-friendly sizes)`);
    
    // Test that content doesn't overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = 375;
    const hasHorizontalOverflow = bodyWidth > viewportWidth + 50; // Allow some tolerance
    console.log(`📱 Horizontal overflow: ${hasHorizontalOverflow ? '❌' : '✅'} (${bodyWidth}px vs ${viewportWidth}px)`);
  });

  test('📟 Tablet viewport (768x1024) - Enhanced TaskBoard', async ({ page }) => {
    console.log('📟 Testing tablet viewport for Enhanced TaskBoard...');
    
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('http://localhost:5177/tasks');
    await page.waitForTimeout(2000);
    
    // Take tablet screenshot
    await page.screenshot({ path: 'tablet-enhanced-taskboard.png', fullPage: true });
    
    // Test kanban columns should be more visible
    const columns = await page.locator('h3:has-text("Backlog"), h3:has-text("To Do"), h3:has-text("In Progress"), h3:has-text("Done")').count();
    console.log(`📟 Kanban columns visible: ${columns}/4 (${columns >= 3 ? '✅' : '❌'})`);
    
    // Test sidebar/navigation layout
    const navigation = await page.locator('nav').first().isVisible();
    console.log(`📟 Navigation visible: ${navigation ? '✅' : '❌'}`);
    
    // Test content spacing
    const main = page.locator('main').first();
    const hasGoodSpacing = await main.isVisible();
    console.log(`📟 Main content area: ${hasGoodSpacing ? '✅' : '❌'}`);
  });

  test('🖥️ Desktop viewport (1920x1080) - Enhanced TaskBoard', async ({ page }) => {
    console.log('🖥️ Testing desktop viewport for Enhanced TaskBoard...');
    
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('http://localhost:5177/tasks');
    await page.waitForTimeout(2000);
    
    // Take desktop screenshot
    await page.screenshot({ path: 'desktop-enhanced-taskboard.png', fullPage: true });
    
    // Test all kanban columns should be visible
    const columns = await page.locator('h3:has-text("Backlog"), h3:has-text("To Do"), h3:has-text("In Progress"), h3:has-text("Done")').count();
    console.log(`🖥️ Kanban columns visible: ${columns}/4 (${columns === 4 ? '✅' : '❌'})`);
    
    // Test wide screen utilization
    const kanbanBoard = page.locator('.flex.space-x-6, .flex.gap-6');
    const boardWidth = await kanbanBoard.boundingBox();
    console.log(`🖥️ Board utilizes screen width: ${boardWidth ? '✅' : '❌'}`);
    
    // Test no unnecessary horizontal scrolling
    const hasNoScrollbar = await page.evaluate(() => {
      return document.documentElement.scrollWidth <= window.innerWidth;
    });
    console.log(`🖥️ No horizontal scrolling: ${hasNoScrollbar ? '✅' : '❌'}`);
  });

  test('📱 Mobile viewport - Homepage', async ({ page }) => {
    console.log('📱 Testing mobile viewport for Homepage...');
    
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:5177/');
    await page.waitForTimeout(2000);
    
    // Take mobile homepage screenshot
    await page.screenshot({ path: 'mobile-homepage.png', fullPage: true });
    
    // Test mobile navigation
    const mobileMenu = await page.locator('[aria-label*="menu"], .mobile-menu, button[aria-expanded]').isVisible();
    const navigation = await page.locator('nav').isVisible();
    console.log(`📱 Mobile navigation: ${mobileMenu || navigation ? '✅' : '❌'}`);
    
    // Test hero section responsiveness
    const heroSection = page.locator('h1, [class*="hero"], [class*="landing"]');
    const heroVisible = await heroSection.first().isVisible();
    console.log(`📱 Hero section visible: ${heroVisible ? '✅' : '❌'}`);
    
    // Test CTAs are accessible
    const buttons = await page.locator('button, a[class*="button"], a[class*="btn"]').count();
    console.log(`📱 Interactive elements: ${buttons} found`);
  });

  test('🔄 Responsive breakpoint transitions', async ({ page }) => {
    console.log('🔄 Testing responsive breakpoint transitions...');
    
    await page.goto('http://localhost:5177/');
    
    const breakpoints = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Mobile Large', width: 425, height: 768 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Laptop', width: 1024, height: 768 },
      { name: 'Desktop', width: 1440, height: 900 },
      { name: 'Large Desktop', width: 1920, height: 1080 }
    ];
    
    for (const bp of breakpoints) {
      console.log(`🔄 Testing ${bp.name} (${bp.width}x${bp.height})...`);
      
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await page.waitForTimeout(1000); // Allow for CSS transitions
      
      // Check for layout shifts or overflow
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = bp.width;
      const hasOverflow = bodyWidth > viewportWidth + 50;
      
      console.log(`   Layout: ${hasOverflow ? '❌ Overflow' : '✅ Contained'} (${bodyWidth}px)`);
      
      // Test navigation is accessible
      const navVisible = await page.locator('nav').first().isVisible();
      console.log(`   Navigation: ${navVisible ? '✅' : '❌'}`);
      
      // Test main content is visible
      const mainVisible = await page.locator('main, [role="main"], h1').first().isVisible();
      console.log(`   Main content: ${mainVisible ? '✅' : '❌'}`);
    }
  });

  test('⌨️ Touch and keyboard accessibility on mobile', async ({ page }) => {
    console.log('⌨️ Testing touch and keyboard accessibility...');
    
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:5177/tasks');
    await page.waitForTimeout(2000);
    
    // Test button sizes are touch-friendly (minimum 44px)
    const buttonSizes = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, a[role="button"]'));
      return buttons.map(btn => {
        const rect = btn.getBoundingClientRect();
        return {
          width: rect.width,
          height: rect.height,
          text: btn.textContent?.trim() || 'No text'
        };
      });
    });
    
    const touchFriendlyButtons = buttonSizes.filter(btn => btn.width >= 44 && btn.height >= 44);
    const totalButtons = buttonSizes.length;
    const touchFriendlyPercentage = totalButtons > 0 ? Math.round((touchFriendlyButtons.length / totalButtons) * 100) : 0;
    
    console.log(`⌨️ Touch-friendly buttons: ${touchFriendlyButtons.length}/${totalButtons} (${touchFriendlyPercentage}%)`);
    console.log(`⌨️ Target: ${touchFriendlyPercentage >= 80 ? '✅' : '❌'} (80%+ recommended)`);
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    const firstFocusable = await page.evaluate(() => document.activeElement?.tagName);
    console.log(`⌨️ Keyboard navigation starts: ${firstFocusable ? '✅' : '❌'} (${firstFocusable})`);
    
    // Test focus indicators are visible
    const focusStyles = await page.evaluate(() => {
      const focusedElement = document.activeElement;
      if (!focusedElement) return null;
      
      const styles = window.getComputedStyle(focusedElement);
      return {
        outline: styles.outline,
        boxShadow: styles.boxShadow,
        border: styles.border
      };
    });
    
    const hasFocusIndicator = focusStyles && (
      focusStyles.outline !== 'none' || 
      focusStyles.boxShadow !== 'none' || 
      focusStyles.border !== 'none'
    );
    
    console.log(`⌨️ Focus indicators: ${hasFocusIndicator ? '✅' : '❌'}`);
  });

  test('🎨 Dark mode responsive design', async ({ page }) => {
    console.log('🎨 Testing dark mode across different screen sizes...');
    
    // Test if dark mode toggle exists
    await page.goto('http://localhost:5177/');
    await page.waitForTimeout(1000);
    
    const darkModeToggle = await page.locator('[aria-label*="dark"], [title*="dark"], [class*="dark"]').first().isVisible();
    console.log(`🎨 Dark mode toggle: ${darkModeToggle ? '✅' : '❌'}`);
    
    if (darkModeToggle) {
      // Test dark mode on mobile
      await page.setViewportSize({ width: 375, height: 667 });
      await page.locator('[aria-label*="dark"], [title*="dark"], [class*="dark"]').first().click();
      await page.waitForTimeout(1000);
      
      await page.screenshot({ path: 'mobile-dark-mode.png', fullPage: true });
      console.log(`🎨 Mobile dark mode screenshot taken`);
      
      // Test dark mode on desktop
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.waitForTimeout(1000);
      
      await page.screenshot({ path: 'desktop-dark-mode.png', fullPage: true });
      console.log(`🎨 Desktop dark mode screenshot taken`);
    }
  });
});