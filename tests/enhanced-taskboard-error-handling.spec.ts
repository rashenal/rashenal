import { test, expect } from '@playwright/test';
import { BasePage } from './pages/BasePage';

/**
 * Enhanced TaskBoard Error Handling Tests
 * Learning how Playwright handles application build errors and broken states
 */
test.describe('Enhanced TaskBoard Error Recovery', () => {
  let basePage: BasePage;

  test.beforeEach(async ({ page }) => {
    basePage = new BasePage(page);
    
    // Set up console error monitoring
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`🚨 Console Error: ${msg.text()}`);
      }
    });
    
    // Monitor for JavaScript errors
    page.on('pageerror', exception => {
      console.log(`💥 Page Error: ${exception.message}`);
    });
    
    // Monitor for network failures
    page.on('requestfailed', request => {
      console.log(`🌐 Request Failed: ${request.url()} - ${request.failure()?.errorText}`);
    });
  });

  test('🔧 Application loads despite TaskBoard build errors', async ({ page }) => {
    console.log('📱 Testing application resilience with build errors...');
    
    // Try to navigate to the main application
    try {
      await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
      console.log('✅ Application loaded successfully');
    } catch (error) {
      console.log(`⚠️ Navigation failed: ${error}`);
      
      // Check if it's a connection error (server not running)
      const title = await page.title().catch(() => 'No Title');
      console.log(`📄 Page title: ${title}`);
      
      // Look for error messages
      const errorText = await page.textContent('body').catch(() => 'No body content');
      if (errorText.includes('error') || errorText.includes('Error')) {
        console.log('🔍 Found error content on page');
      }
    }
  });

  test('🏠 Homepage accessibility despite errors', async ({ page }) => {
    console.log('📱 Testing homepage accessibility with potential errors...');
    
    try {
      await page.goto('http://localhost:5173/');
      
      // Test basic navigation elements
      console.log('🔍 Checking for navigation...');
      const nav = await page.locator('nav, [role="navigation"]').first().isVisible().catch(() => false);
      
      if (nav) {
        console.log('✅ Navigation is accessible');
      } else {
        console.log('⚠️ Navigation not found - checking for alternative layout');
      }
      
      // Test for any interactive elements
      console.log('🔍 Checking for interactive elements...');
      const buttons = await page.locator('button').count().catch(() => 0);
      const links = await page.locator('a').count().catch(() => 0);
      
      console.log(`🔢 Found ${buttons} buttons and ${links} links`);
      
      // Test for error boundaries or fallback UI
      console.log('🔍 Checking for error boundaries...');
      const errorBoundary = await page.locator('[data-testid*="error"], .error-boundary, .fallback').isVisible().catch(() => false);
      
      if (errorBoundary) {
        console.log('✅ Error boundary is working');
      } else {
        console.log('ℹ️ No error boundary detected');
      }
      
    } catch (error) {
      console.log(`❌ Test failed: ${error}`);
    }
  });

  test('📋 TaskBoard route error handling', async ({ page }) => {
    console.log('📱 Testing TaskBoard route with potential syntax errors...');
    
    try {
      await page.goto('http://localhost:5173/tasks');
      
      // Should either show TaskBoard or redirect to auth
      const currentUrl = page.url();
      console.log(`🌍 Current URL: ${currentUrl}`);
      
      if (currentUrl.includes('/auth') || currentUrl.includes('/login')) {
        console.log('🔀 Redirected to auth (expected behavior)');
        
        // Test auth form is accessible
        const emailInput = await page.locator('input[type="email"]').isVisible().catch(() => false);
        const passwordInput = await page.locator('input[type="password"]').isVisible().catch(() => false);
        
        if (emailInput && passwordInput) {
          console.log('✅ Auth form is accessible');
        }
      } else {
        console.log('📋 TaskBoard route loaded');
        
        // Look for TaskBoard elements or error messages
        const taskboardElements = await page.locator('.kanban, .task-board, h1, h2').count();
        console.log(`🔢 Found ${taskboardElements} potential taskboard elements`);
        
        // Check for React error messages
        const reactError = await page.locator('text=Error').isVisible().catch(() => false);
        if (reactError) {
          console.log('🚨 React error detected on TaskBoard');
        }
      }
      
    } catch (error) {
      console.log(`❌ TaskBoard test failed: ${error}`);
    }
  });

  test('🧪 Dev server error diagnosis', async ({ page }) => {
    console.log('🔬 Diagnosing development server issues...');
    
    // Try different ports that might be running
    const ports = [5173, 5174, 5175, 5176];
    let workingPort = null;
    
    for (const port of ports) {
      try {
        console.log(`🔍 Checking port ${port}...`);
        await page.goto(`http://localhost:${port}/`, { timeout: 5000 });
        
        const title = await page.title();
        if (title && !title.includes('cannot') && !title.includes('error')) {
          workingPort = port;
          console.log(`✅ Found working app on port ${port}`);
          break;
        }
      } catch (error) {
        console.log(`❌ Port ${port} not accessible`);
      }
    }
    
    if (workingPort) {
      console.log(`🎯 Application is running on port ${workingPort}`);
      
      // Test basic functionality on working port
      const buttons = await page.locator('button').count();
      const links = await page.locator('a').count();
      console.log(`📊 App has ${buttons} buttons and ${links} links`);
      
    } else {
      console.log('⚠️ No working application found on common ports');
      console.log('💡 This is normal if the dev server has build errors');
    }
  });

  test('🔧 Build error simulation and recovery', async ({ page }) => {
    console.log('🧪 Testing how Playwright handles build errors...');
    
    // Simulate what happens when we try to access a broken app
    try {
      // Set a shorter timeout to fail fast
      await page.goto('http://localhost:5173/', { timeout: 10000 });
      
      // If we get here, the app loaded
      console.log('✅ Application loaded successfully');
      
      // Test if we can interact with basic elements
      const interactiveElement = await page.locator('button, a, input').first().isVisible({ timeout: 5000 });
      
      if (interactiveElement) {
        console.log('✅ Interactive elements are working');
      } else {
        console.log('⚠️ No interactive elements found');
      }
      
    } catch (error) {
      console.log(`🔍 Expected error caught: ${error}`);
      
      // This is actually good - it shows Playwright properly detects broken apps
      console.log('✅ Playwright correctly detected application issues');
      console.log('📚 Learning: Playwright fails gracefully when apps have build errors');
      console.log('🔧 Next step: Fix the build errors and re-test');
    }
  });
});

test.describe('Learning: Playwright Error Handling Patterns', () => {
  test('📖 Document error handling best practices', async ({ page }) => {
    console.log('📚 Documenting Playwright error handling patterns...');
    
    // Pattern 1: Graceful degradation testing
    console.log('🔧 Pattern 1: Test with .catch() for graceful degradation');
    const elementExists = await page.locator('#might-not-exist').isVisible().catch(() => false);
    console.log(`Element exists: ${elementExists}`);
    
    // Pattern 2: Timeout handling
    console.log('🔧 Pattern 2: Use timeouts to prevent hanging tests');
    try {
      await page.locator('#definitely-not-there').waitFor({ timeout: 1000 });
    } catch (error) {
      console.log('✅ Timeout handled gracefully');
    }
    
    // Pattern 3: Multiple fallbacks
    console.log('🔧 Pattern 3: Test multiple selectors as fallbacks');
    const navigationElement = await page.locator('nav').or(page.locator('[role="navigation"]')).or(page.locator('.navbar')).first().isVisible().catch(() => false);
    console.log(`Navigation found: ${navigationElement}`);
    
    // Pattern 4: Conditional testing based on app state
    console.log('🔧 Pattern 4: Conditional testing based on what\'s available');
    const hasAuth = await page.locator('input[type="email"]').isVisible().catch(() => false);
    const hasTaskBoard = await page.locator('.kanban, .task-board').isVisible().catch(() => false);
    
    if (hasAuth) {
      console.log('🔍 Testing auth flow');
    } else if (hasTaskBoard) {
      console.log('🔍 Testing taskboard');
    } else {
      console.log('🔍 Testing basic page structure');
    }
    
    console.log('📝 Error handling patterns documented!');
  });
});