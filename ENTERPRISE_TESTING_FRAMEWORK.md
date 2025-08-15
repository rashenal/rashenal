# 🧪 Enterprise Testing Framework Template

## 🎯 Testing Standards for Rashenal Development

This framework establishes enterprise-grade testing patterns for all current and future Rashenal features. Every task should include comprehensive testing following these standards.

## 📋 Required Testing Components for Every Feature

### **1. Unit Tests (Required)**
- **Coverage Target**: 90%+ for components, 95%+ for business logic
- **Framework**: Jest + React Testing Library
- **Location**: `src/__tests__/unit/`

### **2. Integration Tests (Required)**  
- **Coverage**: Database operations, API interactions, component integration
- **Framework**: Jest + Supabase Test Client
- **Location**: `src/__tests__/integration/`

### **3. End-to-End Tests (Required for Critical Paths)**
- **Coverage**: Complete user journeys, business workflows
- **Framework**: Playwright
- **Location**: `src/__tests__/e2e/`

### **4. Performance Tests (Required for Core Features)**
- **Coverage**: Load times, database queries, memory usage
- **Framework**: Jest + Performance API + Playwright
- **Location**: `src/__tests__/performance/`

### **5. Accessibility Tests (Required)**
- **Coverage**: WCAG AA compliance, keyboard navigation, screen readers
- **Framework**: jest-axe + Playwright
- **Location**: `src/__tests__/accessibility/`

## 🏗️ Testing Framework Structure

```
src/
├── __tests__/
│   ├── unit/
│   │   ├── components/
│   │   │   ├── EnhancedTaskboardManager.test.tsx
│   │   │   ├── CreateTaskboardModal.test.tsx
│   │   │   └── TaskCard.test.tsx
│   │   ├── hooks/
│   │   │   ├── useTaskboards.test.ts
│   │   │   └── useAnalytics.test.ts
│   │   ├── utils/
│   │   │   ├── analytics.test.ts
│   │   │   ├── validation.test.ts
│   │   │   └── formatting.test.ts
│   │   └── services/
│   │       ├── taskboard-service.test.ts
│   │       └── supabase-client.test.ts
│   ├── integration/
│   │   ├── database/
│   │   │   ├── taskboard-operations.test.ts
│   │   │   ├── analytics-queries.test.ts
│   │   │   └── data-migration.test.ts
│   │   ├── api/
│   │   │   ├── auth-flow.test.ts
│   │   │   └── realtime-updates.test.ts
│   │   └── components/
│   │       ├── taskboard-crud.test.tsx
│   │       └── navigation-flow.test.tsx
│   ├── e2e/
│   │   ├── critical-paths/
│   │   │   ├── user-onboarding.spec.ts
│   │   │   ├── taskboard-creation.spec.ts
│   │   │   └── business-analytics.spec.ts
│   │   ├── workflows/
│   │   │   ├── revenue-planning.spec.ts
│   │   │   └── project-management.spec.ts
│   │   └── mobile/
│   │       ├── responsive-design.spec.ts
│   │       └── touch-interactions.spec.ts
│   ├── performance/
│   │   ├── load-testing/
│   │   │   ├── large-datasets.spec.ts
│   │   │   ├── concurrent-users.spec.ts
│   │   │   └── database-optimization.spec.ts
│   │   ├── memory/
│   │   │   ├── memory-leaks.spec.ts
│   │   │   └── garbage-collection.spec.ts
│   │   └── benchmarks/
│   │       ├── component-rendering.spec.ts
│   │       └── analytics-calculations.spec.ts
│   ├── accessibility/
│   │   ├── wcag-compliance.spec.ts
│   │   ├── keyboard-navigation.spec.ts
│   │   ├── screen-reader.spec.ts
│   │   └── color-contrast.spec.ts
│   ├── setup/
│   │   ├── test-setup.ts
│   │   ├── database-setup.ts
│   │   ├── mock-data.ts
│   │   └── test-utilities.ts
│   └── fixtures/
│       ├── taskboard-data.json
│       ├── user-profiles.json
│       └── analytics-expected.json
├── test-utils/
│   ├── render-helpers.tsx
│   ├── database-helpers.ts
│   ├── mock-providers.tsx
│   └── test-data-generators.ts
└── mocks/
    ├── supabase.ts
    ├── router.ts
    └── window.ts
```

## 🧪 Testing Templates

### **Unit Test Template**
```typescript
// src/__tests__/unit/components/ExampleComponent.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import ExampleComponent from '../../../components/ExampleComponent';
import { createMockUser, createMockTaskboard } from '../../test-utils/mock-data';
import { renderWithProviders } from '../../test-utils/render-helpers';

describe('ExampleComponent', () => {
  // Setup
  const mockUser = createMockUser();
  const mockTaskboard = createMockTaskboard();
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  // Basic rendering
  test('renders component correctly', () => {
    renderWithProviders(<ExampleComponent taskboard={mockTaskboard} />);
    expect(screen.getByText(mockTaskboard.name)).toBeInTheDocument();
  });
  
  // User interactions  
  test('handles user interaction correctly', async () => {
    renderWithProviders(<ExampleComponent taskboard={mockTaskboard} />);
    
    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/edit mode/i)).toBeInTheDocument();
    });
  });
  
  // Edge cases
  test('handles empty data gracefully', () => {
    renderWithProviders(<ExampleComponent taskboard={null} />);
    expect(screen.getByText(/no data/i)).toBeInTheDocument();
  });
  
  // Error scenarios
  test('displays error state correctly', () => {
    const errorTaskboard = { ...mockTaskboard, hasError: true };
    renderWithProviders(<ExampleComponent taskboard={errorTaskboard} />);
    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });
});
```

### **Integration Test Template**
```typescript
// src/__tests__/integration/database/taskboard-operations.test.ts
import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { supabase } from '../../../lib/supabase';
import { createTestUser, cleanupTestData } from '../../test-utils/database-helpers';
import { TaskboardService } from '../../../services/taskboard-service';

describe('Taskboard Database Operations', () => {
  let testUserId: string;
  
  beforeEach(async () => {
    testUserId = await createTestUser();
  });
  
  afterEach(async () => {
    await cleanupTestData(testUserId);
  });
  
  test('creates taskboard with business intelligence fields', async () => {
    const taskboardData = {
      name: 'Test Revenue Board',
      category: 'revenue',
      priority: 'high',
      revenue_target: 50000,
      user_id: testUserId
    };
    
    const result = await TaskboardService.create(taskboardData);
    
    expect(result.error).toBeNull();
    expect(result.data).toMatchObject({
      name: 'Test Revenue Board',
      category: 'revenue',
      revenue_target: 50000
    });
    
    // Verify in database
    const { data: dbData } = await supabase
      .from('taskboards')
      .select('*')
      .eq('id', result.data.id)
      .single();
      
    expect(dbData.category).toBe('revenue');
    expect(dbData.revenue_target).toBe(50000);
  });
  
  test('enhanced analytics view returns correct calculations', async () => {
    // Setup test data
    await setupTaskboardWithTasks(testUserId);
    
    const { data: analytics } = await supabase
      .from('enhanced_taskboard_analytics')
      .select('*')
      .eq('user_id', testUserId);
    
    expect(analytics).toBeDefined();
    expect(analytics[0]).toHaveProperty('roi_percentage');
    expect(analytics[0]).toHaveProperty('days_until_target');
    expect(analytics[0].actual_task_count).toBeGreaterThan(0);
  });
});
```

### **E2E Test Template**
```typescript
// src/__tests__/e2e/critical-paths/taskboard-creation.spec.ts
import { test, expect } from '@playwright/test';
import { setupTestEnvironment, cleanupTestEnvironment } from '../test-utils/e2e-helpers';

test.describe('Taskboard Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestEnvironment(page);
    await page.goto('/projects');
  });
  
  test.afterEach(async ({ page }) => {
    await cleanupTestEnvironment(page);
  });
  
  test('user can create revenue-focused taskboard', async ({ page }) => {
    // Start creation flow
    await page.click('[data-testid="create-taskboard-button"]');
    
    // Select revenue template
    await page.click('[data-testid="revenue-template"]');
    
    // Verify template data populated
    await expect(page.locator('[data-testid="revenue-target"]')).toHaveValue('50000');
    await expect(page.locator('[data-testid="category-select"]')).toHaveValue('revenue');
    
    // Customize and create
    await page.fill('[data-testid="taskboard-name"]', 'Q4 Revenue Initiative');
    await page.fill('[data-testid="revenue-target"]', '75000');
    await page.click('[data-testid="create-button"]');
    
    // Verify taskboard appears
    await expect(page.locator('[data-testid="taskboard-list"]')).toContainText('Q4 Revenue Initiative');
    await expect(page.locator('[data-testid="revenue-stats"]')).toContainText('$75,000');
    
    // Verify analytics updated
    await expect(page.locator('[data-testid="total-revenue-target"]')).toContainText('$75,000');
  });
  
  test('mobile: taskboard creation responsive flow', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Test mobile-specific interactions
    await page.click('[data-testid="mobile-menu-button"]');
    await page.click('[data-testid="mobile-create-taskboard"]');
    
    // Verify mobile layout
    await expect(page.locator('[data-testid="mobile-template-grid"]')).toBeVisible();
  });
});
```

### **Performance Test Template**
```typescript
// src/__tests__/performance/load-testing/large-datasets.spec.ts
import { test, expect } from '@playwright/test';
import { setupLargeDataset, measurePerformance } from '../test-utils/performance-helpers';

test.describe('Performance Tests', () => {
  test.beforeEach(async () => {
    await setupLargeDataset({
      taskboards: 100,
      tasksPerTaskboard: 50,
      withAnalytics: true
    });
  });
  
  test('taskboard list loads efficiently with large dataset', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/projects');
    await page.waitForSelector('[data-testid="taskboards-loaded"]');
    
    const loadTime = Date.now() - startTime;
    
    // Should load in under 3 seconds even with 100 taskboards
    expect(loadTime).toBeLessThan(3000);
    
    // Verify all data loaded correctly
    const taskboardCount = await page.locator('[data-testid="taskboard-item"]').count();
    expect(taskboardCount).toBe(100);
  });
  
  test('analytics calculations perform efficiently', async ({ page }) => {
    await page.goto('/projects');
    
    const analyticsStartTime = performance.now();
    await page.click('[data-testid="analytics-refresh"]');
    await page.waitForSelector('[data-testid="analytics-complete"]');
    const analyticsTime = performance.now() - analyticsStartTime;
    
    // Analytics should calculate in under 1 second
    expect(analyticsTime).toBeLessThan(1000);
  });
  
  test('memory usage remains stable during extended use', async ({ page }) => {
    const measurements = [];
    
    for (let i = 0; i < 10; i++) {
      await page.goto('/projects');
      await page.waitForLoadState('networkidle');
      
      const memoryUsage = await page.evaluate(() => {
        return (performance as any).memory?.usedJSHeapSize || 0;
      });
      
      measurements.push(memoryUsage);
      
      // Add some interaction load
      await page.click('[data-testid="refresh-button"]');
      await page.fill('[data-testid="search-input"]', `search term ${i}`);
    }
    
    // Memory usage should not increase by more than 50% over the test
    const initialMemory = measurements[0];
    const finalMemory = measurements[measurements.length - 1];
    const memoryIncrease = (finalMemory - initialMemory) / initialMemory;
    
    expect(memoryIncrease).toBeLessThan(0.5); // Less than 50% increase
  });
});
```

### **Accessibility Test Template**
```typescript
// src/__tests__/accessibility/wcag-compliance.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Compliance', () => {
  test('enhanced taskboards meet WCAG AA standards', async ({ page }) => {
    await page.goto('/projects');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });
  
  test('keyboard navigation works completely', async ({ page }) => {
    await page.goto('/projects');
    
    // Test full keyboard navigation
    await page.keyboard.press('Tab'); // Should focus first interactive element
    await page.keyboard.press('Enter'); // Should activate element
    
    // Verify modal opens with keyboard
    await expect(page.locator('[data-testid="create-taskboard-modal"]')).toBeVisible();
    
    // Test modal keyboard navigation
    await page.keyboard.press('Tab'); // Navigate through modal
    await page.keyboard.press('Escape'); // Close modal
    
    await expect(page.locator('[data-testid="create-taskboard-modal"]')).not.toBeVisible();
  });
  
  test('screen reader announcements work correctly', async ({ page }) => {
    await page.goto('/projects');
    
    // Test live region updates
    await page.click('[data-testid="create-taskboard-button"]');
    
    // Verify aria-live regions announce changes
    const liveRegion = page.locator('[aria-live="polite"]');
    await expect(liveRegion).toContainText(/modal opened/i);
  });
});
```

## 📊 Test Data Management

### **Test Data Generators**
```typescript
// src/test-utils/test-data-generators.ts
export function generateTaskboard(overrides = {}) {
  return {
    id: `test-taskboard-${Math.random().toString(36).substr(2, 9)}`,
    name: `Test Taskboard ${Math.floor(Math.random() * 1000)}`,
    category: 'revenue',
    priority: 'high',
    revenue_target: Math.floor(Math.random() * 100000) + 10000,
    completion_percentage: Math.floor(Math.random() * 100),
    task_counter: Math.floor(Math.random() * 20) + 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  };
}

export function generateTask(taskboardId: string, overrides = {}) {
  return {
    id: `test-task-${Math.random().toString(36).substr(2, 9)}`,
    taskboard_id: taskboardId,
    title: `Test Task ${Math.floor(Math.random() * 1000)}`,
    status: ['todo', 'in_progress', 'done'][Math.floor(Math.random() * 3)],
    priority: ['low', 'medium', 'high', 'urgent'][Math.floor(Math.random() * 4)],
    estimated_time: Math.floor(Math.random() * 240) + 30,
    created_at: new Date().toISOString(),
    ...overrides
  };
}

export async function createTestDataset(options = {}) {
  const {
    taskboardCount = 10,
    tasksPerTaskboard = 5,
    withRevenue = true
  } = options;
  
  const taskboards = [];
  
  for (let i = 0; i < taskboardCount; i++) {
    const taskboard = generateTaskboard({
      revenue_target: withRevenue ? Math.floor(Math.random() * 100000) + 10000 : null
    });
    
    const tasks = [];
    for (let j = 0; j < tasksPerTaskboard; j++) {
      tasks.push(generateTask(taskboard.id));
    }
    
    taskboards.push({ ...taskboard, tasks });
  }
  
  return taskboards;
}
```

## 🚀 CI/CD Integration

### **GitHub Actions Workflow**
```yaml
# .github/workflows/test.yml
name: Enterprise Testing Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:coverage
      
  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:integration
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_TEST_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_TEST_ANON_KEY }}
          
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install
      - run: npm run test:e2e
      
  performance-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:performance
      - run: npm run benchmark:compare
      
  accessibility-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:a11y
```

## 📋 Quality Gates

### **Required Test Coverage**
- **Unit Tests**: 90%+ line coverage, 95%+ for critical business logic
- **Integration Tests**: 100% coverage of database operations
- **E2E Tests**: 100% coverage of critical user journeys
- **Performance Tests**: All core features must meet performance benchmarks
- **Accessibility Tests**: 100% WCAG AA compliance

### **Performance Benchmarks**
- **Page Load**: <2 seconds for primary views
- **Database Queries**: <100ms for single record operations
- **Analytics Calculations**: <1 second for complex aggregations
- **Memory Usage**: <50MB baseline, <100MB under load
- **Bundle Size**: <500KB compressed for main app

### **Definition of Done**
For any task to be considered complete, it must:
- [ ] Pass all unit tests with required coverage
- [ ] Pass integration tests with real data
- [ ] Pass E2E tests for primary user journey
- [ ] Meet performance benchmarks
- [ ] Pass accessibility compliance tests
- [ ] Be reviewed and approved
- [ ] Be deployed to staging environment
- [ ] Pass manual testing checklist

This framework ensures every feature we build meets enterprise-grade quality standards! 🎯
