import { test, expect } from '@playwright/test';

test('📸 Take screenshot of Enhanced TaskBoard', async ({ page }) => {
  console.log('📱 Navigating to Enhanced TaskBoard...');
  
  // Monitor console errors
  const consoleErrors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      console.log(`🚨 Console Error: ${msg.text()}`);
    }
  });
  
  await page.goto('http://localhost:5177/tasks');
  
  // Wait for the page to load
  await page.waitForTimeout(3000);
  
  // Take a screenshot
  await page.screenshot({ path: 'enhanced-taskboard-screenshot.png', fullPage: true });
  console.log('📸 Screenshot saved as enhanced-taskboard-screenshot.png');
  
  // Check for console errors
  if (consoleErrors.length > 0) {
    console.log(`🚨 Found ${consoleErrors.length} console errors:`);
    consoleErrors.forEach(error => console.log(`   - ${error}`));
  } else {
    console.log('✅ No console errors detected');
  }
  
  // Check if page loaded
  const title = await page.title();
  console.log(`📑 Page title: "${title}"`);
  
  const bodyText = await page.textContent('body');
  console.log(`📄 Body text length: ${bodyText?.length || 0} characters`);
  
  if (bodyText && bodyText.length < 100) {
    console.log(`📋 Full body text: "${bodyText}"`);
  }
});