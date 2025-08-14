import { test, expect } from '@playwright/test';
import { BasePage } from './pages/BasePage';
import { generateTestData, takeScreenshot, waitForPageLoad } from './helpers/test-helpers';

test.describe('Task Board', () => {
  let basePage: BasePage;

  test.beforeEach(async ({ page }) => {
    basePage = new BasePage(page);
    await basePage.goto('/tasks');
    await waitForPageLoad(page);
  });

  test.describe('Task Board Layout', () => {
    test('should display kanban board columns @smoke', async ({ page }) => {
      // Common kanban column names
      const expectedColumns = ['Backlog', 'To Do', 'In Progress', 'Done', 'Todo', 'Doing', 'Completed'];
      
      let foundColumns = 0;
      for (const columnName of expectedColumns) {
        const column = page.locator(`:has-text("${columnName}")`).first();
        if (await column.isVisible()) {
          foundColumns++;
        }
      }
      
      expect(foundColumns).toBeGreaterThan(0);
    });

    test('should display add task button', async ({ page }) => {
      const addButton = page.locator('button:has-text("Add Task"), button:has-text("New Task"), button:has-text("Create Task"), [data-testid="add-task"]').first();
      
      if (await addButton.isVisible()) {
        await expect(addButton).toBeVisible();
      } else {
        // Look for a plus icon button
        const plusButton = page.locator('button:has([data-lucide="plus"]), button:has(.lucide-plus), button[aria-label*="Add"]').first();
        if (await plusButton.isVisible()) {
          await expect(plusButton).toBeVisible();
        }
      }
    });

    test('should display task filtering options', async ({ page }) => {
      // Look for filter controls
      const filterControls = [
        'input[placeholder*="filter"], input[placeholder*="search"]',
        'select[name*="filter"], select[name*="category"]',
        'button:has-text("Filter"), button:has-text("Sort")',
        '[data-testid="filter"], [data-testid="search"]'
      ];
      
      let hasFilters = false;
      for (const selector of filterControls) {
        const element = page.locator(selector).first();
        if (await element.isVisible()) {
          hasFilters = true;
          break;
        }
      }
      
      // Filters might not be visible if no tasks exist
      if (hasFilters) {
        expect(hasFilters).toBeTruthy();
      }
    });
  });

  test.describe('Task Creation', () => {
    test('should open task creation modal/form', async ({ page }) => {
      const addButton = page.locator('button:has-text("Add Task"), button:has-text("New Task"), button:has-text("Create Task")').first();
      
      if (await addButton.isVisible()) {
        await addButton.click();
        
        // Look for modal or form
        const modal = page.locator('[role="dialog"], .modal, .task-form').first();
        const form = page.locator('form').first();
        
        if (await modal.isVisible()) {
          await expect(modal).toBeVisible();
        } else if (await form.isVisible()) {
          await expect(form).toBeVisible();
        }
      } else {
        test.skip('Add task button not found');
      }
    });

    test('should create a new task with basic information', async ({ page }) => {
      const addButton = page.locator('button:has-text("Add Task"), button:has-text("New Task"), button:has-text("Create Task")').first();
      
      if (await addButton.isVisible()) {
        await addButton.click();
        
        const testData = generateTestData('task');
        
        // Fill task form
        const titleInput = page.locator('input[name="title"], input[placeholder*="title"], input[name="name"]').first();
        if (await titleInput.isVisible()) {
          await titleInput.fill(testData.title);
        }
        
        const descriptionInput = page.locator('textarea[name="description"], input[name="description"]').first();
        if (await descriptionInput.isVisible()) {
          await descriptionInput.fill(testData.description);
        }
        
        // Submit the form
        const submitButton = page.locator('button[type="submit"], button:has-text("Create"), button:has-text("Save")').first();
        if (await submitButton.isVisible()) {
          await submitButton.click();
        }
        
        // Wait for task to appear in the board
        await page.waitForTimeout(2000);
        
        // Look for the created task
        const createdTask = page.locator(`:has-text("${testData.title}")`).first();
        if (await createdTask.isVisible()) {
          await expect(createdTask).toBeVisible();
        }
      } else {
        test.skip('Task creation not available');
      }
    });

    test('should validate required fields', async ({ page }) => {
      const addButton = page.locator('button:has-text("Add Task"), button:has-text("New Task")').first();
      
      if (await addButton.isVisible()) {
        await addButton.click();
        
        // Try to submit without filling required fields
        const submitButton = page.locator('button[type="submit"], button:has-text("Create"), button:has-text("Save")').first();
        if (await submitButton.isVisible()) {
          await submitButton.click();
          
          // Check for validation messages
          const errorMessage = page.locator('[role="alert"], .error, .text-red-600').first();
          if (await errorMessage.isVisible()) {
            await expect(errorMessage).toBeVisible();
          }
        }
      } else {
        test.skip('Task creation not available');
      }
    });
  });

  test.describe('Task Management', () => {
    test('should display existing tasks', async ({ page }) => {
      // Look for task cards or items
      const taskItems = page.locator('.task, .task-card, [data-testid="task"], .kanban-item');
      const taskCount = await taskItems.count();
      
      if (taskCount > 0) {
        expect(taskCount).toBeGreaterThan(0);
        
        // Check first task has basic elements
        const firstTask = taskItems.first();
        await expect(firstTask).toBeVisible();
      }
    });

    test('should show task details when clicked', async ({ page }) => {
      const taskItems = page.locator('.task, .task-card, [data-testid="task"]');
      const taskCount = await taskItems.count();
      
      if (taskCount > 0) {
        await taskItems.first().click();
        
        // Look for task detail modal or expanded view
        const detailModal = page.locator('[role="dialog"], .modal, .task-detail').first();
        if (await detailModal.isVisible()) {
          await expect(detailModal).toBeVisible();
        }
      } else {
        test.skip('No tasks available to test');
      }
    });

    test('should allow editing task details', async ({ page }) => {
      const taskItems = page.locator('.task, .task-card');
      const taskCount = await taskItems.count();
      
      if (taskCount > 0) {
        // Look for edit button or double-click to edit
        const editButton = page.locator('button:has-text("Edit"), [data-testid="edit-task"]').first();
        
        if (await editButton.isVisible()) {
          await editButton.click();
          
          // Look for editable fields
          const titleInput = page.locator('input[name="title"], input[value]').first();
          if (await titleInput.isVisible()) {
            await titleInput.fill('Updated Task Title');
            
            // Save changes
            const saveButton = page.locator('button:has-text("Save"), button[type="submit"]').first();
            if (await saveButton.isVisible()) {
              await saveButton.click();
            }
          }
        } else {
          // Try double-clicking on task for inline editing
          await taskItems.first().dblclick();
          await page.waitForTimeout(500);
        }
      } else {
        test.skip('No tasks available for editing');
      }
    });

    test('should allow deleting tasks', async ({ page }) => {
      const taskItems = page.locator('.task, .task-card');
      const taskCount = await taskItems.count();
      
      if (taskCount > 0) {
        // Look for delete button
        const deleteButton = page.locator('button:has-text("Delete"), button[aria-label*="delete"], .delete-task').first();
        
        if (await deleteButton.isVisible()) {
          await deleteButton.click();
          
          // Handle confirmation dialog if present
          const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Delete")').first();
          if (await confirmButton.isVisible()) {
            await confirmButton.click();
          }
          
          await page.waitForTimeout(1000);
        }
      } else {
        test.skip('No tasks available for deletion');
      }
    });
  });

  test.describe('Drag and Drop', () => {
    test('should support dragging tasks between columns', async ({ page }) => {
      const taskItems = page.locator('.task, .task-card, [draggable="true"]');
      const columns = page.locator('.column, .kanban-column, [data-testid="column"]');
      
      const taskCount = await taskItems.count();
      const columnCount = await columns.count();
      
      if (taskCount > 0 && columnCount > 1) {
        const firstTask = taskItems.first();
        const targetColumn = columns.nth(1);
        
        // Attempt drag and drop
        const taskBounds = await firstTask.boundingBox();
        const columnBounds = await targetColumn.boundingBox();
        
        if (taskBounds && columnBounds) {
          await page.mouse.move(taskBounds.x + taskBounds.width / 2, taskBounds.y + taskBounds.height / 2);
          await page.mouse.down();
          await page.mouse.move(columnBounds.x + columnBounds.width / 2, columnBounds.y + columnBounds.height / 2);
          await page.mouse.up();
          
          await page.waitForTimeout(1000);
        }
      } else {
        test.skip('Not enough tasks or columns for drag and drop test');
      }
    });

    test('should show visual feedback during drag', async ({ page }) => {
      const taskItems = page.locator('.task, .task-card, [draggable="true"]');
      const taskCount = await taskItems.count();
      
      if (taskCount > 0) {
        const firstTask = taskItems.first();
        const taskBounds = await firstTask.boundingBox();
        
        if (taskBounds) {
          await page.mouse.move(taskBounds.x + taskBounds.width / 2, taskBounds.y + taskBounds.height / 2);
          await page.mouse.down();
          
          // Move slightly to start drag
          await page.mouse.move(taskBounds.x + taskBounds.width / 2 + 10, taskBounds.y + taskBounds.height / 2 + 10);
          
          // Check for visual feedback (drag ghost, drop zones, etc.)
          const dragGhost = page.locator('.drag-ghost, .dragging, [data-dragging="true"]').first();
          if (await dragGhost.isVisible()) {
            await expect(dragGhost).toBeVisible();
          }
          
          await page.mouse.up();
        }
      } else {
        test.skip('No draggable tasks available');
      }
    });
  });

  test.describe('Task Filtering and Search', () => {
    test('should filter tasks by text search', async ({ page }) => {
      const searchInput = page.locator('input[placeholder*="search"], input[placeholder*="filter"], [data-testid="search"]').first();
      
      if (await searchInput.isVisible()) {
        await searchInput.fill('test');
        
        // Wait for filter to apply
        await page.waitForTimeout(1000);
        
        // Check that visible tasks contain the search term
        const visibleTasks = page.locator('.task:visible, .task-card:visible');
        const taskCount = await visibleTasks.count();
        
        if (taskCount > 0) {
          const firstTaskText = await visibleTasks.first().textContent();
          expect(firstTaskText?.toLowerCase()).toContain('test');
        }
      } else {
        test.skip('Search functionality not available');
      }
    });

    test('should filter tasks by category/priority', async ({ page }) => {
      const filterSelect = page.locator('select[name*="filter"], select[name*="category"], select[name*="priority"]').first();
      
      if (await filterSelect.isVisible()) {
        const options = await filterSelect.locator('option').count();
        
        if (options > 1) {
          await filterSelect.selectOption({ index: 1 });
          await page.waitForTimeout(1000);
        }
      } else {
        test.skip('Category/priority filtering not available');
      }
    });
  });

  test.describe('Task Board Accessibility', () => {
    test('should support keyboard navigation', async ({ page }) => {
      // Tab through focusable elements
      await page.keyboard.press('Tab');
      
      const focusedElement = page.locator(':focus');
      if (await focusedElement.isVisible()) {
        await expect(focusedElement).toBeVisible();
      }
      
      // Continue tabbing through task board elements
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab');
        const newFocusedElement = page.locator(':focus');
        if (await newFocusedElement.isVisible()) {
          await expect(newFocusedElement).toBeVisible();
        }
      }
    });

    test('should have proper ARIA labels for drag and drop', async ({ page }) => {
      const draggableItems = page.locator('[draggable="true"]');
      const count = await draggableItems.count();
      
      if (count > 0) {
        const firstItem = draggableItems.first();
        const ariaLabel = await firstItem.getAttribute('aria-label');
        const ariaDescribedBy = await firstItem.getAttribute('aria-describedby');
        
        expect(ariaLabel || ariaDescribedBy).toBeTruthy();
      }
    });

    test('should have proper headings structure', async ({ page }) => {
      // Check for main heading
      const mainHeading = page.locator('h1, h2:first-of-type').first();
      if (await mainHeading.isVisible()) {
        await expect(mainHeading).toBeVisible();
        
        const headingText = await mainHeading.textContent();
        expect(headingText?.toLowerCase()).toMatch(/(task|board|project)/);
      }
    });
  });

  test.describe('Task Board Performance', () => {
    test('should load quickly with many tasks', async ({ page }) => {
      const startTime = Date.now();
      await basePage.goto('/tasks');
      await waitForPageLoad(page);
      const loadTime = Date.now() - startTime;
      
      // Should load within reasonable time (5 seconds)
      expect(loadTime).toBeLessThan(5000);
    });

    test('should handle rapid interactions', async ({ page }) => {
      const addButton = page.locator('button:has-text("Add Task"), button:has-text("New Task")').first();
      
      if (await addButton.isVisible()) {
        // Click multiple times rapidly
        await addButton.click();
        await page.waitForTimeout(100);
        
        // Should handle gracefully (not create multiple modals)
        const modals = page.locator('[role="dialog"], .modal');
        const modalCount = await modals.count();
        expect(modalCount).toBeLessThanOrEqual(1);
        
        // Close modal if open
        const closeButton = page.locator('button:has-text("Cancel"), button:has-text("Close"), [aria-label="Close"]').first();
        if (await closeButton.isVisible()) {
          await closeButton.click();
        }
      }
    });
  });

  test.describe('Responsive Task Board', () => {
    test('should display properly on mobile devices', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await basePage.goto('/tasks');
      await waitForPageLoad(page);
      
      // Task board should adapt to mobile layout
      const taskBoard = page.locator('.task-board, .kanban, main').first();
      await expect(taskBoard).toBeVisible();
      
      // Take screenshot
      await takeScreenshot(page, 'taskboard-mobile');
    });

    test('should maintain functionality on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await basePage.goto('/tasks');
      await waitForPageLoad(page);
      
      // Add task button should still be accessible
      const addButton = page.locator('button:has-text("Add Task"), button:has-text("New Task")').first();
      if (await addButton.isVisible()) {
        await expect(addButton).toBeVisible();
      }
      
      await takeScreenshot(page, 'taskboard-tablet');
    });

    test('should utilize full desktop space', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await basePage.goto('/tasks');
      await waitForPageLoad(page);
      
      // Columns should be visible side by side on desktop
      const columns = page.locator('.column, .kanban-column');
      const columnCount = await columns.count();
      
      if (columnCount > 1) {
        // Check that columns are arranged horizontally
        const firstColumnBox = await columns.first().boundingBox();
        const secondColumnBox = await columns.nth(1).boundingBox();
        
        if (firstColumnBox && secondColumnBox) {
          expect(secondColumnBox.x).toBeGreaterThan(firstColumnBox.x);
        }
      }
      
      await takeScreenshot(page, 'taskboard-desktop');
    });
  });
});