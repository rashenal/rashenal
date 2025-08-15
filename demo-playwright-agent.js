/**
 * Playwright Agent Demo
 * This shows what your aisista.ai agent personas could do
 */

const { chromium } = require('playwright');

async function demoAgentCapabilities() {
  console.log('🤖 Starting Playwright Agent Demo...');
  
  // Launch browser - could be headless for production agents
  const browser = await chromium.launch({ 
    headless: false, // Set to true for background agents
    slowMo: 1000    // Slow down for demo purposes
  });
  
  const context = await browser.newContext({
    // Simulate different devices for different agents
    viewport: { width: 1920, height: 1080 },
    userAgent: 'aisista.ai Marketing Agent v1.0'
  });
  
  const page = await context.newPage();
  
  try {
    console.log('📱 Agent Demo 1: Website Analysis');
    
    // Marketing Director Agent: Analyze competitor website
    await page.goto('https://example.com');
    await page.waitForLoadState('networkidle');
    
    // Extract key information
    const title = await page.title();
    const headings = await page.locator('h1, h2, h3').allTextContents();
    const links = await page.locator('a[href]').count();
    
    console.log(`📊 Website Analysis Results:`);
    console.log(`   Title: ${title}`);
    console.log(`   Headings found: ${headings.length}`);
    console.log(`   Links found: ${links}`);
    
    // Take screenshot for report
    await page.screenshot({ 
      path: 'competitor-analysis.png', 
      fullPage: true 
    });
    
    console.log('📸 Screenshot saved: competitor-analysis.png');
    
    // Demo 2: Form Automation (like your tests do)
    console.log('📝 Agent Demo 2: Form Automation');
    
    // Navigate to your login page
    await page.goto('http://localhost:5173/login');
    
    // Agent could automatically fill forms
    await page.fill('input[type="email"]', 'agent@aisista.ai');
    await page.fill('input[type="password"]', 'AgentPassword123!');
    
    // Take screenshot of filled form
    await page.screenshot({ path: 'form-filled.png' });
    console.log('📸 Form interaction screenshot: form-filled.png');
    
    // Demo 3: Data Extraction
    console.log('🔍 Agent Demo 3: Data Extraction');
    
    await page.goto('https://news.ycombinator.com');
    
    // Extract news headlines (like a Tech Expert agent would)
    const newsItems = await page.locator('.titleline > a').evaluateAll(links => {
      return links.slice(0, 5).map(link => ({
        title: link.textContent?.trim(),
        url: link.href,
        timestamp: new Date().toISOString()
      }));
    });
    
    console.log('📰 Latest Tech News:');
    newsItems.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.title}`);
    });
    
    // Demo 4: Multi-tab Management
    console.log('🗂️ Agent Demo 4: Multi-tab Operations');
    
    // Open multiple tabs (like monitoring different sources)
    const page2 = await context.newPage();
    const page3 = await context.newPage();
    
    await Promise.all([
      page.goto('http://localhost:5173'),
      page2.goto('http://localhost:5173/tasks'),
      page3.goto('http://localhost:5173/ai-coach')
    ]);
    
    console.log('✅ Multiple tabs opened successfully');
    
    // Demo 5: Performance Monitoring
    console.log('⚡ Agent Demo 5: Performance Monitoring');
    
    const startTime = Date.now();
    await page.goto('http://localhost:5173/dashboard');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    console.log(`⏱️ Dashboard load time: ${loadTime}ms`);
    
    // Demo 6: Network Interception (API monitoring)
    console.log('🌐 Agent Demo 6: API Monitoring Setup');
    
    page.route('**/api/**', route => {
      console.log(`🔗 API Call intercepted: ${route.request().method()} ${route.request().url()}`);
      route.continue();
    });
    
    console.log('✅ API monitoring activated');
    
    await page.waitForTimeout(3000);
    
  } catch (error) {
    console.error('❌ Demo error:', error.message);
  } finally {
    console.log('🔚 Demo complete - closing browser');
    await browser.close();
  }
}

// Only run if called directly (not during test execution)
if (require.main === module) {
  demoAgentCapabilities().catch(console.error);
}

module.exports = { demoAgentCapabilities };