import { defineConfig, devices } from '@playwright/test';

/**
 * Fast Playwright Config for Live Monitoring
 * Optimized for real-time test observation with faster execution
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0, // No retries for faster feedback
  workers: 1, // Single worker for sequential execution
  reporter: [
    ['list'], // Simple console output
    ['html', { open: 'never' }], // HTML report without auto-opening
  ],
  
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Faster page loads
    navigationTimeout: 10000,
    actionTimeout: 5000,
  },

  // Reduced timeout for faster execution
  timeout: 15000,

  projects: [
    {
      name: 'chromium-fast',
      use: { 
        ...devices['Desktop Chrome'],
        // Faster browser startup
        launchOptions: {
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-extensions',
          ]
        }
      },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },

  // Global test configuration for faster execution
  globalSetup: require.resolve('./tests/global-setup.ts'),
});