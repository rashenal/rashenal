# Playwright E2E Tests

This directory contains end-to-end tests for the Aisista.ai application using Playwright.

## Setup

Playwright is already configured and ready to use. The configuration file is `playwright.config.ts` in the project root.

## Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run tests in UI mode (interactive)
npm run test:e2e:ui

# Run tests in debug mode
npm run test:e2e:debug

# Run smoke tests only
npm run test:e2e:smoke
```

## Configuration

- **Base URL**: http://localhost:5173
- **Browser**: Chromium only (for speed)
- **Timeout**: 30 seconds
- **Retries**: 1
- **Workers**: 1 (sequential execution)
- **Auto-start dev server**: Yes
- **Trace**: On first retry
- **Screenshots**: Only on failure
- **Videos**: Retain on failure

## Test Structure

Tests are organized in the following pattern:
- `*.spec.ts` - Test files
- `screenshots/` - Test artifacts and screenshots

## Writing Tests

Example test structure:
```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/');
    // Test implementation
  });
});
```

## CI/CD

Tests are automatically run on:
- Push to main/develop branches
- Pull requests to main/develop branches

See `.github/workflows/playwright.yml` for the complete CI configuration.