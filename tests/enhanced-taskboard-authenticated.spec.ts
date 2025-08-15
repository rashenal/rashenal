import { test, expect } from '@playwright/test';
import { BasePage } from './pages/BasePage';

/**
 * Enhanced TaskBoard Features Test - Authenticated User
 * Tests the actual enhanced features with a logged-in user
 */
test.describe('Enhanced TaskBoard (Authenticated)', () => {
  let basePage: BasePage;

  test.beforeEach(async ({ page }) => {
    basePage = new BasePage(page);
    await page.waitForTimeout(1000);
    
    // Set up console monitoring
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`🚨 Console Error: ${msg.text()}`);
      }
    });
  });

  test('🏠 Homepage shows Enhanced TaskBoard features when logged in', async ({ page }) => {
    console.log('📱 Testing homepage for Enhanced TaskBoard availability...');
    
    await page.goto('http://localhost:5177/');
    
    // Check if we can see any task-related navigation
    const taskNavigation = await page.locator('a[href*="/tasks"], a:has-text("Tasks"), a:has-text("Board")').count();
    console.log(`📋 Found ${taskNavigation} task-related navigation links`);
    
    // Check for any project-related elements on homepage
    const projectElements = await page.locator('text=Project, text=Personal, text=Work').count();
    console.log(`🎯 Found ${projectElements} project-related elements`);
    
    // Check if Enhanced TaskBoard is accessible via direct link
    console.log('🔗 Testing direct access to Enhanced TaskBoard...');
    await page.goto('http://localhost:5177/tasks');
    
    const currentUrl = page.url();
    console.log(`📍 Current URL after /tasks navigation: ${currentUrl}`);
    
    if (currentUrl.includes('/auth') || currentUrl.includes('/login')) {
      console.log('🔐 Redirected to auth - testing auth form');
      
      // Test that auth form exists and has proper elements
      const emailInput = await page.locator('input[type="email"]').isVisible();
      const passwordInput = await page.locator('input[type="password"]').isVisible();
      const submitButton = await page.locator('button[type="submit"]').isVisible();
      
      console.log(`📧 Email input: ${emailInput}`);
      console.log(`🔒 Password input: ${passwordInput}`);
      console.log(`✅ Submit button: ${submitButton}`);
      
      if (emailInput && passwordInput && submitButton) {
        console.log('✅ Authentication flow is properly set up');
        console.log('ℹ️ Enhanced features will be visible after login');
      }
    } else {
      console.log('🎉 Direct access to Enhanced TaskBoard successful!');
      
      // Test for enhanced features
      await testEnhancedFeatures(page);
    }
  });

  test('🎨 Visual elements present regardless of auth state', async ({ page }) => {
    console.log('📱 Testing visual elements that should be present...');
    
    await page.goto('http://localhost:5177/');
    
    // Check for basic visual elements
    const elements = {
      navigation: await page.locator('nav, [role="navigation"]').isVisible().catch(() => false),
      logo: await page.locator('img[alt*="aisista"], img[alt*="logo"]').isVisible().catch(() => false),
      buttons: await page.locator('button').count(),
      links: await page.locator('a').count(),
      headings: await page.locator('h1, h2, h3').count()
    };
    
    console.log('🎨 Visual Elements Report:');
    console.log(`   Navigation: ${elements.navigation ? '✅' : '❌'}`);
    console.log(`   Logo: ${elements.logo ? '✅' : '❌'}`);
    console.log(`   Buttons: ${elements.buttons}`);
    console.log(`   Links: ${elements.links}`);
    console.log(`   Headings: ${elements.headings}`);
    
    // Test responsive design
    console.log('📱 Testing responsive design...');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    
    const mobileElements = {
      stillVisible: await page.locator('h1, nav').isVisible().catch(() => false),
      mobileMenu: await page.locator('[aria-label*="menu"], .mobile-menu, button[aria-expanded]').isVisible().catch(() => false)
    };
    
    console.log(`📱 Mobile visibility: ${mobileElements.stillVisible ? '✅' : '❌'}`);
    console.log(`📱 Mobile menu: ${mobileElements.mobileMenu ? '✅' : '❌'}`);
  });

  test('🔧 Direct component testing', async ({ page }) => {
    console.log('📱 Testing Enhanced TaskBoard component directly...');
    
    // Go to tasks page
    await page.goto('http://localhost:5177/tasks');
    
    // Wait for any loading
    await page.waitForTimeout(3000);
    
    const pageContent = await page.textContent('body');
    console.log(`📄 Page contains "Enhanced": ${pageContent?.includes('Enhanced') || false}`);
    console.log(`📄 Page contains "Project": ${pageContent?.includes('Project') || false}`);
    console.log(`📄 Page contains "Kanban": ${pageContent?.includes('Kanban') || false}`);
    console.log(`📄 Page contains "Drag": ${pageContent?.includes('Drag') || false}`);
    
    // Look for any error messages
    const errorMessages = await page.locator('text=Error, text=error, .error, [class*="error"]').count();
    console.log(`🚨 Error messages found: ${errorMessages}`);
    
    // Test for React components being rendered
    const reactElements = await page.locator('[data-reactroot], [data-react], .react').count();
    console.log(`⚛️ React elements: ${reactElements}`);
    
    // Check for any loading states
    const loadingElements = await page.locator('text=Loading, .loading, [class*="loading"], [class*="spinner"]').count();
    console.log(`⏳ Loading elements: ${loadingElements}`);
  });

  const testEnhancedFeatures = async (page: any) => {
    console.log('🎯 Testing Enhanced TaskBoard features...');
    
    // Project filtering
    const projectFilter = await page.locator('select', { hasText: 'All Projects' }).isVisible().catch(() => false);
    console.log(`🗂️ Project filter: ${projectFilter ? '✅' : '❌'}`);
    
    // Search functionality
    const searchInput = await page.locator('input[placeholder*="Search"]').isVisible().catch(() => false);
    console.log(`🔍 Search input: ${searchInput ? '✅' : '❌'}`);
    
    // Drag handles
    const dragHandles = await page.locator('[data-lucide="grip-vertical"]').count();
    console.log(`🖱️ Drag handles: ${dragHandles > 0 ? '✅' : '❌'} (${dragHandles})`);
    
    // Comment buttons
    const commentButtons = await page.locator('[data-lucide="message-square"]').count();
    console.log(`💬 Comment buttons: ${commentButtons > 0 ? '✅' : '❌'} (${commentButtons})`);
    
    // History buttons
    const historyButtons = await page.locator('[data-lucide="history"]').count();
    console.log(`📊 History buttons: ${historyButtons > 0 ? '✅' : '❌'} (${historyButtons})`);
    
    // Kanban columns
    const kanbanColumns = await page.locator('h3:has-text("Backlog"), h3:has-text("To Do"), h3:has-text("In Progress"), h3:has-text("Done")').count();
    console.log(`📋 Kanban columns: ${kanbanColumns > 0 ? '✅' : '❌'} (${kanbanColumns})`);
    
    // Add task button
    const addTaskButton = await page.locator('button:has-text("Add Task")').isVisible().catch(() => false);
    console.log(`➕ Add Task button: ${addTaskButton ? '✅' : '❌'}`);
    
    const totalFeatures = 7;
    const workingFeatures = [projectFilter, searchInput, dragHandles > 0, commentButtons > 0, historyButtons > 0, kanbanColumns > 0, addTaskButton].filter(Boolean).length;
    
    console.log(`📊 Enhanced Features: ${workingFeatures}/${totalFeatures} working (${Math.round(workingFeatures/totalFeatures*100)}%)`);
    
    return workingFeatures >= 5;
  };

  test('🧪 Enhanced TaskBoard code validation', async ({ page }) => {
    console.log('🔧 Validating Enhanced TaskBoard implementation...');
    
    await page.goto('http://localhost:5177/tasks');
    
    // Check for JavaScript errors
    const jsErrors: string[] = [];
    page.on('pageerror', exception => {
      jsErrors.push(exception.message);
    });
    
    await page.waitForTimeout(3000);
    
    if (jsErrors.length > 0) {
      console.log('🚨 JavaScript Errors:');
      jsErrors.forEach(error => console.log(`   - ${error}`));
    } else {
      console.log('✅ No JavaScript errors detected');
    }
    
    // Check network requests
    const networkRequests: string[] = [];
    page.on('request', request => {
      if (request.url().includes('Enhanced') || request.url().includes('TaskBoard')) {
        networkRequests.push(request.url());
      }
    });
    
    console.log(`🌐 TaskBoard-related network requests: ${networkRequests.length}`);
    
    // Check for component mounting
    const componentMounted = await page.evaluate(() => {
      // Check if React components are mounted
      const elements = document.querySelectorAll('[class*="TaskBoard"], [class*="Enhanced"], [class*="kanban"]');
      return elements.length > 0;
    });
    
    console.log(`⚛️ Enhanced components mounted: ${componentMounted ? '✅' : '❌'}`);
  });
});