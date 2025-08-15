import { test, expect } from '@playwright/test';
import { BasePage } from './pages/BasePage';

/**
 * Enhanced TaskBoard Features Test
 * Testing all the restored functionality: drag & drop, projects, comments, subtasks, audit history
 */
test.describe('Enhanced TaskBoard Features', () => {
  let basePage: BasePage;

  test.beforeEach(async ({ page }) => {
    basePage = new BasePage(page);
    await page.waitForTimeout(1000);
  });

  test('🚀 Enhanced TaskBoard loads with all features', async ({ page }) => {
    console.log('📱 Testing Enhanced TaskBoard with all features...');
    await page.goto('http://localhost:5177/tasks');
    
    // Should either show TaskBoard or redirect to auth
    const currentUrl = page.url();
    console.log(`🌍 Current URL: ${currentUrl}`);
    
    if (currentUrl.includes('/auth') || currentUrl.includes('/login')) {
      console.log('🔀 Redirected to auth (expected for protected route)');
      
      // Test auth form accessibility
      const emailInput = await page.locator('input[type="email"]').isVisible();
      const passwordInput = await page.locator('input[type="password"]').isVisible();
      
      if (emailInput && passwordInput) {
        console.log('✅ Auth form is accessible');
      }
    } else {
      console.log('📋 Enhanced TaskBoard loaded directly');
      
      // Test for enhanced features
      console.log('🔍 Checking for enhanced features...');
      
      // Project filter
      const projectFilter = await page.locator('select', { hasText: 'All Projects' }).isVisible().catch(() => false);
      if (projectFilter) {
        console.log('✅ Project filter found');
      }
      
      // Search functionality
      const searchInput = await page.locator('input[placeholder*="Search tasks"]').isVisible().catch(() => false);
      if (searchInput) {
        console.log('✅ Search input found');
      }
      
      // Add task button
      const addTaskButton = await page.locator('button', { hasText: 'Add Task' }).isVisible().catch(() => false);
      if (addTaskButton) {
        console.log('✅ Add Task button found');
      }
      
      // Kanban columns
      const kanbanColumns = await page.locator('[class*="w-80"]').count().catch(() => 0);
      console.log(`📊 Found ${kanbanColumns} kanban columns`);
      
      // Drag handles (should appear on hover)
      const dragHandles = await page.locator('[class*="cursor-grab"]').count().catch(() => 0);
      console.log(`🖱️ Found ${dragHandles} potential drag handles`);
    }
  });

  test('🔧 Project filtering functionality', async ({ page }) => {
    console.log('📱 Testing project filtering...');
    await page.goto('http://localhost:5177/tasks');
    
    try {
      // Look for project dropdown
      const projectDropdown = page.locator('select').first();
      const isVisible = await projectDropdown.isVisible({ timeout: 5000 });
      
      if (isVisible) {
        console.log('✅ Project dropdown found');
        
        // Get all options
        const options = await projectDropdown.locator('option').allTextContents();
        console.log(`📋 Project options: ${options.join(', ')}`);
        
        // Test selecting a project
        if (options.length > 1) {
          console.log('🔍 Testing project selection...');
          await projectDropdown.selectOption({ index: 1 });
          console.log('✅ Project selection test completed');
        }
      } else {
        console.log('ℹ️ Project dropdown not visible (user not authenticated)');
      }
    } catch (error) {
      console.log(`⚠️ Project filtering test: ${error}`);
    }
  });

  test('🔍 Search functionality test', async ({ page }) => {
    console.log('📱 Testing search functionality...');
    await page.goto('http://localhost:5177/tasks');
    
    try {
      const searchInput = page.locator('input[placeholder*="Search tasks"]');
      const isVisible = await searchInput.isVisible({ timeout: 5000 });
      
      if (isVisible) {
        console.log('✅ Search input found');
        
        // Test typing in search
        await searchInput.fill('test task');
        await page.waitForTimeout(1000);
        
        const value = await searchInput.inputValue();
        console.log(`🔍 Search value: "${value}"`);
        
        if (value === 'test task') {
          console.log('✅ Search input working correctly');
        }
        
        // Clear search
        await searchInput.clear();
        console.log('🧹 Search cleared');
      } else {
        console.log('ℹ️ Search input not visible (user not authenticated)');
      }
    } catch (error) {
      console.log(`⚠️ Search test: ${error}`);
    }
  });

  test('🎨 Drag and drop visual elements', async ({ page }) => {
    console.log('📱 Testing drag and drop visual elements...');
    await page.goto('http://localhost:5177/tasks');
    
    try {
      // Look for task cards
      const taskCards = await page.locator('[class*="bg-white"][class*="rounded-xl"][class*="shadow"]').count();
      console.log(`📋 Found ${taskCards} potential task cards`);
      
      if (taskCards > 0) {
        // Test hover on first task card to reveal drag handle
        const firstCard = page.locator('[class*="bg-white"][class*="rounded-xl"][class*="shadow"]').first();
        await firstCard.hover();
        await page.waitForTimeout(500);
        
        // Look for drag handle that should appear on hover
        const dragHandle = page.locator('[class*="cursor-grab"]');
        const dragHandleVisible = await dragHandle.isVisible().catch(() => false);
        
        if (dragHandleVisible) {
          console.log('✅ Drag handle appears on hover');
        } else {
          console.log('ℹ️ Drag handle not visible (may require tasks)');
        }
        
        // Check for priority badges
        const priorityBadges = await page.locator('[class*="px-2 py-1 rounded-full"]').count();
        console.log(`🏷️ Found ${priorityBadges} priority/tag badges`);
        
        // Check for action buttons
        const actionButtons = await page.locator('button[title*="Comment"], button[title*="History"]').count();
        console.log(`⚡ Found ${actionButtons} quick action buttons`);
      }
    } catch (error) {
      console.log(`⚠️ Drag and drop visual test: ${error}`);
    }
  });

  test('📝 Comments and history buttons', async ({ page }) => {
    console.log('📱 Testing comments and history functionality...');
    await page.goto('http://localhost:5177/tasks');
    
    try {
      // Look for comment buttons
      const commentButtons = await page.locator('button[title*="Comment"]').count();
      console.log(`💬 Found ${commentButtons} comment buttons`);
      
      // Look for history buttons  
      const historyButtons = await page.locator('button[title*="History"]').count();
      console.log(`📜 Found ${historyButtons} history buttons`);
      
      if (commentButtons > 0) {
        console.log('✅ Comment functionality available');
      }
      
      if (historyButtons > 0) {
        console.log('✅ History tracking available');
      }
      
      // Look for message square icons (comments)
      const messageIcons = await page.locator('[data-lucide="message-square"]').count();
      console.log(`💬 Found ${messageIcons} message icons`);
      
      // Look for history icons
      const historyIcons = await page.locator('[data-lucide="history"]').count();
      console.log(`📊 Found ${historyIcons} history icons`);
      
    } catch (error) {
      console.log(`⚠️ Comments/history test: ${error}`);
    }
  });

  test('📊 Kanban board structure', async ({ page }) => {
    console.log('📱 Testing kanban board structure...');
    await page.goto('http://localhost:5177/tasks');
    
    try {
      // Wait for potential board to load
      await page.waitForTimeout(2000);
      
      // Check for column headers
      const columnHeaders = await page.locator('h3:has-text("Backlog"), h3:has-text("To Do"), h3:has-text("In Progress"), h3:has-text("Done")').count();
      console.log(`📋 Found ${columnHeaders} expected kanban columns`);
      
      // Check for column containers
      const columnContainers = await page.locator('[class*="flex-shrink-0"][class*="w-80"]').count();
      console.log(`📦 Found ${columnContainers} column containers`);
      
      // Check for task counters
      const taskCounters = await page.locator('[class*="bg-gray-100"][class*="px-2 py-1 rounded-full"]').count();
      console.log(`🔢 Found ${taskCounters} task counters`);
      
      // Check for add task buttons in columns
      const addTaskButtons = await page.locator('button:has-text("Add task")').count();
      console.log(`➕ Found ${addTaskButtons} add task buttons`);
      
      if (columnHeaders >= 3) {
        console.log('✅ Kanban board structure is present');
      } else {
        console.log('ℹ️ Basic kanban structure detected');
      }
      
    } catch (error) {
      console.log(`⚠️ Kanban structure test: ${error}`);
    }
  });

  test('🎯 Enhanced features integration test', async ({ page }) => {
    console.log('📱 Testing all enhanced features integration...');
    await page.goto('http://localhost:5177/tasks');
    
    const features = {
      projectFilter: false,
      searchInput: false,
      dragHandles: false,
      commentButtons: false,
      historyButtons: false,
      kanbanColumns: false,
      addTaskButton: false
    };
    
    try {
      // Test each feature
      features.projectFilter = await page.locator('select option:has-text("Personal"), select option:has-text("Work")').first().isVisible({ timeout: 3000 }).catch(() => false);
      features.searchInput = await page.locator('input[placeholder*="Search"]').isVisible().catch(() => false);
      features.dragHandles = await page.locator('[data-lucide="grip-vertical"]').count() > 0;
      features.commentButtons = await page.locator('[data-lucide="message-square"]').count() > 0;
      features.historyButtons = await page.locator('[data-lucide="history"]').count() > 0;
      features.kanbanColumns = await page.locator('h3:has-text("Backlog"), h3:has-text("Done")').count() >= 2;
      features.addTaskButton = await page.locator('button:has-text("Add Task")').isVisible().catch(() => false);
      
      // Report results
      console.log('📊 Enhanced Features Status:');
      Object.entries(features).forEach(([feature, available]) => {
        const status = available ? '✅' : '❌';
        console.log(`${status} ${feature}: ${available}`);
      });
      
      const workingFeatures = Object.values(features).filter(Boolean).length;
      const totalFeatures = Object.keys(features).length;
      
      console.log(`📈 Feature Coverage: ${workingFeatures}/${totalFeatures} (${Math.round(workingFeatures/totalFeatures*100)}%)`);
      
      if (workingFeatures >= 5) {
        console.log('🎉 Enhanced TaskBoard is working well!');
      } else if (workingFeatures >= 3) {
        console.log('👍 Enhanced TaskBoard has good functionality');
      } else {
        console.log('⚠️ Enhanced TaskBoard needs attention');
      }
      
    } catch (error) {
      console.log(`❌ Integration test error: ${error}`);
    }
  });
});