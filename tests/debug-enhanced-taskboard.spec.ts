import { test, expect } from '@playwright/test';

/**
 * Debug Enhanced TaskBoard - Find out why features aren't showing
 */
test.describe('Debug Enhanced TaskBoard', () => {

  test('🐛 Debug what is actually rendering', async ({ page }) => {
    console.log('🔍 Debugging Enhanced TaskBoard rendering...');
    
    // Monitor all console messages
    page.on('console', msg => {
      console.log(`🖥️ [${msg.type().toUpperCase()}] ${msg.text()}`);
    });
    
    // Monitor errors
    page.on('pageerror', exception => {
      console.log(`💥 PAGE ERROR: ${exception.message}`);
    });
    
    // Monitor network requests
    page.on('request', request => {
      console.log(`🌐 REQUEST: ${request.method()} ${request.url()}`);
    });
    
    page.on('response', response => {
      if (!response.ok()) {
        console.log(`❌ FAILED REQUEST: ${response.status()} ${response.url()}`);
      }
    });
    
    console.log('📱 Navigating to /tasks...');
    await page.goto('http://localhost:5177/tasks');
    
    // Wait for page to fully load
    await page.waitForTimeout(5000);
    
    console.log('📄 Getting page content...');
    const pageTitle = await page.title();
    const bodyText = await page.textContent('body');
    
    console.log(`📑 Page title: "${pageTitle}"`);
    console.log(`📄 Body text length: ${bodyText?.length || 0} characters`);
    
    if (bodyText) {
      const preview = bodyText.substring(0, 500);
      console.log(`📋 Body preview: "${preview}..."`);
      
      // Check for key terms
      const keyTerms = ['Enhanced', 'TaskBoard', 'Project', 'Kanban', 'Loading', 'Error', 'Welcome'];
      keyTerms.forEach(term => {
        const found = bodyText.includes(term);
        console.log(`🔍 Contains "${term}": ${found ? '✅' : '❌'}`);
      });
    }
    
    // Check DOM structure
    console.log('🏗️ Analyzing DOM structure...');
    const domInfo = await page.evaluate(() => {
      return {
        hasMain: document.querySelector('main') !== null,
        hasHeader: document.querySelector('header') !== null,
        hasNav: document.querySelector('nav') !== null,
        totalElements: document.querySelectorAll('*').length,
        hasReactRoot: document.querySelector('[data-reactroot]') !== null,
        hasTaskBoardClass: document.querySelector('[class*="TaskBoard"], [class*="taskboard"]') !== null,
        hasEnhancedClass: document.querySelector('[class*="Enhanced"], [class*="enhanced"]') !== null,
        scripts: Array.from(document.querySelectorAll('script')).map(s => s.src).filter(src => src),
        stylesheets: Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(l => l.href)
      };
    });
    
    console.log('🏗️ DOM Structure:');
    Object.entries(domInfo).forEach(([key, value]) => {
      if (typeof value === 'boolean') {
        console.log(`   ${key}: ${value ? '✅' : '❌'}`);
      } else if (Array.isArray(value)) {
        console.log(`   ${key}: ${value.length} items`);
        value.slice(0, 3).forEach(item => console.log(`      - ${item}`));
      } else {
        console.log(`   ${key}: ${value}`);
      }
    });
    
    // Take a screenshot for visual debugging
    await page.screenshot({ path: 'debug-enhanced-taskboard.png', fullPage: true });
    console.log('📸 Screenshot saved as debug-enhanced-taskboard.png');
  });

  test('🔧 Test component imports and dependencies', async ({ page }) => {
    console.log('📦 Testing component dependencies...');
    
    await page.goto('http://localhost:5177/tasks');
    
    // Check if EnhancedTaskBoard component exists
    const componentCheck = await page.evaluate(() => {
      // Check for component-specific elements
      return {
        hasProjectFilter: document.querySelector('select option[value="personal"], select option[value="work"]') !== null,
        hasSearchInput: document.querySelector('input[placeholder*="Search"], input[placeholder*="search"]') !== null,
        hasDragIcons: document.querySelector('[data-lucide="grip-vertical"]') !== null,
        hasCommentIcons: document.querySelector('[data-lucide="message-square"]') !== null,
        hasHistoryIcons: document.querySelector('[data-lucide="history"]') !== null,
        hasKanbanColumns: document.querySelectorAll('h3').length > 0,
        hasAddTaskButton: document.querySelector('button') !== null,
        totalButtons: document.querySelectorAll('button').length,
        totalInputs: document.querySelectorAll('input').length,
        totalSelects: document.querySelectorAll('select').length,
        hasLucideIcons: document.querySelector('[data-lucide]') !== null,
        hasGradientBg: document.querySelector('[class*="gradient"]') !== null
      };
    });
    
    console.log('🧪 Component Check Results:');
    Object.entries(componentCheck).forEach(([key, value]) => {
      if (typeof value === 'boolean') {
        console.log(`   ${key}: ${value ? '✅' : '❌'}`);
      } else {
        console.log(`   ${key}: ${value}`);
      }
    });
    
    const workingFeatures = Object.values(componentCheck).filter((v, i) => 
      typeof v === 'boolean' && v
    ).length;
    
    console.log(`📊 Working features: ${workingFeatures}/${Object.keys(componentCheck).filter((k, i) => typeof componentCheck[k as keyof typeof componentCheck] === 'boolean').length}`);
  });
});