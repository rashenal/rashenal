import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Setting up fast test environment...');
  
  // Pre-warm the browser for faster test startup
  const browser = await chromium.launch();
  await browser.close();
  
  console.log('✅ Test environment ready');
}

export default globalSetup;