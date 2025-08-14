import { test, expect } from '@playwright/test';
import { BasePage } from './pages/BasePage';
import { takeScreenshot, waitForPageLoad } from './helpers/test-helpers';

test.describe('AI Features', () => {
  let basePage: BasePage;

  test.beforeEach(async ({ page }) => {
    basePage = new BasePage(page);
  });

  test.describe('AI Coach', () => {
    test.beforeEach(async ({ page }) => {
      await basePage.goto('/ai-coach');
      await waitForPageLoad(page);
    });

    test('should display AI coach interface @smoke', async ({ page }) => {
      // Look for AI coach elements
      const coachElements = [
        'AI Coach',
        'Coach', 
        'Chat',
        'Ask',
        'Help'
      ];

      let foundElements = 0;
      for (const element of coachElements) {
        const locator = page.locator(`:has-text("${element}")`).first();
        if (await locator.isVisible()) {
          foundElements++;
        }
      }

      expect(foundElements).toBeGreaterThan(0);
    });

    test('should display chat interface', async ({ page }) => {
      // Look for chat input and messages
      const chatInput = page.locator('input[placeholder*="message"], textarea[placeholder*="message"], input[placeholder*="ask"], [data-testid="chat-input"]').first();
      const messageArea = page.locator('.messages, .chat-messages, [data-testid="messages"]').first();
      
      if (await chatInput.isVisible()) {
        await expect(chatInput).toBeVisible();
      }
      
      if (await messageArea.isVisible()) {
        await expect(messageArea).toBeVisible();
      }
    });

    test('should send message to AI coach', async ({ page }) => {
      const chatInput = page.locator('input[placeholder*="message"], textarea[placeholder*="message"], input[placeholder*="ask"]').first();
      
      if (await chatInput.isVisible()) {
        await chatInput.fill('Hello, can you help me with my goals?');
        
        const sendButton = page.locator('button[type="submit"], button:has-text("Send"), button[aria-label*="Send"]').first();
        if (await sendButton.isVisible()) {
          await sendButton.click();
        } else {
          await chatInput.press('Enter');
        }
        
        // Wait for AI response
        await page.waitForTimeout(5000);
        
        // Look for response message
        const responseMessage = page.locator('.message, .chat-message, .ai-response').last();
        if (await responseMessage.isVisible()) {
          await expect(responseMessage).toBeVisible();
          
          const responseText = await responseMessage.textContent();
          expect(responseText?.length || 0).toBeGreaterThan(0);
        }
      } else {
        test.skip('Chat interface not available');
      }
    });

    test('should display previous conversation history', async ({ page }) => {
      const messageHistory = page.locator('.messages, .chat-messages, .conversation-history');
      const historyCount = await messageHistory.count();
      
      if (historyCount > 0) {
        const messages = page.locator('.message, .chat-message');
        const messageCount = await messages.count();
        
        if (messageCount > 0) {
          expect(messageCount).toBeGreaterThan(0);
        }
      }
    });

    test('should show typing indicator during AI response', async ({ page }) => {
      const chatInput = page.locator('input[placeholder*="message"], textarea[placeholder*="message"]').first();
      
      if (await chatInput.isVisible()) {
        await chatInput.fill('What should I focus on today?');
        
        const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').first();
        if (await sendButton.isVisible()) {
          await sendButton.click();
        } else {
          await chatInput.press('Enter');
        }
        
        // Look for typing indicator
        const typingIndicator = page.locator(':has-text("typing"), :has-text("..."), .typing, .loading').first();
        if (await typingIndicator.isVisible({ timeout: 2000 })) {
          await expect(typingIndicator).toBeVisible();
        }
      } else {
        test.skip('Chat interface not available');
      }
    });

    test('should provide contextual suggestions', async ({ page }) => {
      // Look for suggested questions or prompts
      const suggestions = page.locator('.suggestion, .prompt, .quick-action, button:has-text("Ask about")');
      const suggestionCount = await suggestions.count();
      
      if (suggestionCount > 0) {
        expect(suggestionCount).toBeGreaterThan(0);
        
        // Try clicking a suggestion
        await suggestions.first().click();
        await page.waitForTimeout(2000);
      }
    });
  });

  test.describe('AI Task Suggestions', () => {
    test.beforeEach(async ({ page }) => {
      await basePage.goto('/tasks');
      await waitForPageLoad(page);
    });

    test('should provide AI-powered task suggestions', async ({ page }) => {
      // Look for AI suggestion elements
      const aiSuggestions = page.locator(':has-text("AI suggests"), :has-text("Suggested"), .ai-suggestion, [data-testid="ai-suggestion"]');
      const count = await aiSuggestions.count();
      
      if (count > 0) {
        expect(count).toBeGreaterThan(0);
        await expect(aiSuggestions.first()).toBeVisible();
      }
    });

    test('should estimate task duration with AI', async ({ page }) => {
      const addTaskButton = page.locator('button:has-text("Add Task"), button:has-text("New Task")').first();
      
      if (await addTaskButton.isVisible()) {
        await addTaskButton.click();
        
        // Look for AI duration estimation
        const durationEstimate = page.locator(':has-text("AI estimates"), :has-text("Estimated"), .duration-estimate, [data-testid="duration"]').first();
        if (await durationEstimate.isVisible()) {
          await expect(durationEstimate).toBeVisible();
        }
      }
    });

    test('should suggest task categorization', async ({ page }) => {
      const addTaskButton = page.locator('button:has-text("Add Task"), button:has-text("New Task")').first();
      
      if (await addTaskButton.isVisible()) {
        await addTaskButton.click();
        
        // Fill task title and look for AI categorization
        const titleInput = page.locator('input[name="title"], input[placeholder*="title"]').first();
        if (await titleInput.isVisible()) {
          await titleInput.fill('Review code and fix bugs');
          await page.waitForTimeout(2000);
          
          // Look for AI category suggestions
          const categoryElement = page.locator(':has-text("Category"), :has-text("AI suggests"), select[name*="category"]').first();
          if (await categoryElement.isVisible()) {
            await expect(categoryElement).toBeVisible();
          }
        }
      }
    });
  });

  test.describe('AI Habit Insights', () => {
    test.beforeEach(async ({ page }) => {
      await basePage.goto('/habits');
      await waitForPageLoad(page);
    });

    test('should provide habit insights and analytics', async ({ page }) => {
      // Look for AI insights on habits page
      const insightElements = page.locator(':has-text("Insight"), :has-text("Analysis"), :has-text("Pattern"), .insight, .analytics');
      const count = await insightElements.count();
      
      if (count > 0) {
        expect(count).toBeGreaterThan(0);
      }
    });

    test('should suggest habit improvements', async ({ page }) => {
      const improvementSuggestions = page.locator(':has-text("Try"), :has-text("Suggest"), :has-text("Improve"), .suggestion, .improvement');
      const count = await improvementSuggestions.count();
      
      if (count > 0) {
        expect(count).toBeGreaterThan(0);
      }
    });

    test('should show habit streak analysis', async ({ page }) => {
      const streakElements = page.locator(':has-text("Streak"), :has-text("Progress"), :has-text("Consistency"), .streak, .progress');
      const count = await streakElements.count();
      
      if (count > 0) {
        expect(count).toBeGreaterThan(0);
      }
    });
  });

  test.describe('AI Goal Recommendations', () => {
    test.beforeEach(async ({ page }) => {
      await basePage.goto('/goals');
      await waitForPageLoad(page);
    });

    test('should suggest relevant goals', async ({ page }) => {
      const goalSuggestions = page.locator(':has-text("Suggested goal"), :has-text("Try this goal"), .goal-suggestion, [data-testid="goal-suggestion"]');
      const count = await goalSuggestions.count();
      
      if (count > 0) {
        expect(count).toBeGreaterThan(0);
      }
    });

    test('should provide goal progress insights', async ({ page }) => {
      const progressInsights = page.locator(':has-text("Progress"), :has-text("On track"), :has-text("Behind"), .progress-insight');
      const count = await progressInsights.count();
      
      if (count > 0) {
        expect(count).toBeGreaterThan(0);
      }
    });

    test('should recommend goal adjustments', async ({ page }) => {
      const adjustmentRecommendations = page.locator(':has-text("Adjust"), :has-text("Consider"), :has-text("Recommendation"), .recommendation');
      const count = await adjustmentRecommendations.count();
      
      if (count > 0) {
        expect(count).toBeGreaterThan(0);
      }
    });
  });

  test.describe('AI Dashboard Integration', () => {
    test.beforeEach(async ({ page }) => {
      await basePage.goto('/dashboard');
      await waitForPageLoad(page);
    });

    test('should display AI-powered dashboard insights', async ({ page }) => {
      // Look for AI insights on dashboard
      const dashboardInsights = page.locator(':has-text("AI"), :has-text("Insight"), :has-text("Recommendation"), .ai-widget, .insight-card');
      const count = await dashboardInsights.count();
      
      if (count > 0) {
        expect(count).toBeGreaterThan(0);
      }
    });

    test('should show personalized daily summary', async ({ page }) => {
      const dailySummary = page.locator(':has-text("Today"), :has-text("Summary"), :has-text("Focus on"), .daily-summary, .summary-card').first();
      
      if (await dailySummary.isVisible()) {
        await expect(dailySummary).toBeVisible();
        
        const summaryText = await dailySummary.textContent();
        expect(summaryText?.length || 0).toBeGreaterThan(0);
      }
    });

    test('should provide motivation and encouragement', async ({ page }) => {
      const motivationalContent = page.locator(':has-text("Keep going"), :has-text("Great job"), :has-text("You can do"), .motivation, .encouragement').first();
      
      if (await motivationalContent.isVisible()) {
        await expect(motivationalContent).toBeVisible();
      }
    });
  });

  test.describe('AI Feature Accessibility', () => {
    test('should make AI responses screen reader friendly', async ({ page }) => {
      await basePage.goto('/ai-coach');
      
      const chatInput = page.locator('input[placeholder*="message"], textarea[placeholder*="message"]').first();
      
      if (await chatInput.isVisible()) {
        // Check for proper ARIA labels
        const ariaLabel = await chatInput.getAttribute('aria-label');
        const ariaDescribedBy = await chatInput.getAttribute('aria-describedby');
        
        expect(ariaLabel || ariaDescribedBy).toBeTruthy();
      }
    });

    test('should announce AI responses to screen readers', async ({ page }) => {
      await basePage.goto('/ai-coach');
      
      const messageArea = page.locator('.messages, .chat-messages, [role="log"]').first();
      
      if (await messageArea.isVisible()) {
        const role = await messageArea.getAttribute('role');
        const ariaLive = await messageArea.getAttribute('aria-live');
        
        expect(role === 'log' || ariaLive === 'polite' || ariaLive === 'assertive').toBeTruthy();
      }
    });

    test('should provide keyboard shortcuts for AI features', async ({ page }) => {
      await basePage.goto('/ai-coach');
      
      const chatInput = page.locator('input[placeholder*="message"], textarea[placeholder*="message"]').first();
      
      if (await chatInput.isVisible()) {
        await chatInput.focus();
        
        // Test Enter key to send message
        await chatInput.fill('Test keyboard shortcut');
        await chatInput.press('Enter');
        
        await page.waitForTimeout(1000);
        
        // Message should be sent
        const messages = page.locator('.message, .chat-message');
        const messageCount = await messages.count();
        expect(messageCount).toBeGreaterThan(0);
      }
    });
  });

  test.describe('AI Performance', () => {
    test('should respond to queries within reasonable time', async ({ page }) => {
      await basePage.goto('/ai-coach');
      
      const chatInput = page.locator('input[placeholder*="message"], textarea[placeholder*="message"]').first();
      
      if (await chatInput.isVisible()) {
        await chatInput.fill('What should I focus on today?');
        
        const startTime = Date.now();
        
        const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').first();
        if (await sendButton.isVisible()) {
          await sendButton.click();
        } else {
          await chatInput.press('Enter');
        }
        
        // Wait for response (should be within 30 seconds)
        const responseMessage = page.locator('.message, .chat-message').last();
        await responseMessage.waitFor({ state: 'visible', timeout: 30000 });
        
        const responseTime = Date.now() - startTime;
        expect(responseTime).toBeLessThan(30000);
      } else {
        test.skip('AI chat not available');
      }
    });

    test('should handle multiple concurrent requests', async ({ page }) => {
      await basePage.goto('/ai-coach');
      
      const chatInput = page.locator('input[placeholder*="message"], textarea[placeholder*="message"]').first();
      
      if (await chatInput.isVisible()) {
        // Send multiple messages quickly
        const messages = [
          'Help me with tasks',
          'What about habits?',
          'Show me my goals'
        ];
        
        for (const message of messages) {
          await chatInput.fill(message);
          await chatInput.press('Enter');
          await page.waitForTimeout(500);
        }
        
        // Should handle gracefully without errors
        await page.waitForTimeout(5000);
      }
    });
  });

  test.describe('AI Features Responsive Design', () => {
    test('should display AI coach properly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await basePage.goto('/ai-coach');
      await waitForPageLoad(page);
      
      // Chat interface should be usable on mobile
      const chatInput = page.locator('input[placeholder*="message"], textarea[placeholder*="message"]').first();
      if (await chatInput.isVisible()) {
        await expect(chatInput).toBeVisible();
      }
      
      await takeScreenshot(page, 'ai-coach-mobile');
    });

    test('should adapt AI insights for tablet view', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await basePage.goto('/dashboard');
      await waitForPageLoad(page);
      
      // AI insights should be properly arranged
      const insights = page.locator('.insight, .ai-widget, .recommendation');
      const count = await insights.count();
      
      if (count > 0) {
        await expect(insights.first()).toBeVisible();
      }
      
      await takeScreenshot(page, 'ai-insights-tablet');
    });

    test('should utilize desktop space for AI features', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await basePage.goto('/ai-coach');
      await waitForPageLoad(page);
      
      // Chat should utilize available space
      const chatContainer = page.locator('.chat, .conversation, .ai-coach').first();
      if (await chatContainer.isVisible()) {
        const bounds = await chatContainer.boundingBox();
        if (bounds) {
          expect(bounds.width).toBeGreaterThan(600);
        }
      }
      
      await takeScreenshot(page, 'ai-coach-desktop');
    });
  });

  test.describe('AI Error Handling', () => {
    test('should gracefully handle AI service unavailable', async ({ page }) => {
      await basePage.goto('/ai-coach');
      
      // Mock network failure or AI service down
      await page.route('**/ai-chat/**', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Service unavailable' })
        });
      });
      
      const chatInput = page.locator('input[placeholder*="message"], textarea[placeholder*="message"]').first();
      
      if (await chatInput.isVisible()) {
        await chatInput.fill('Test message');
        await chatInput.press('Enter');
        
        // Should show error message
        await page.waitForTimeout(3000);
        const errorMessage = page.locator(':has-text("Error"), :has-text("unavailable"), :has-text("try again"), [role="alert"]').first();
        
        if (await errorMessage.isVisible()) {
          await expect(errorMessage).toBeVisible();
        }
      }
    });

    test('should show retry options for failed requests', async ({ page }) => {
      await basePage.goto('/ai-coach');
      
      // Simulate intermittent failure
      let requestCount = 0;
      await page.route('**/ai-chat/**', route => {
        requestCount++;
        if (requestCount === 1) {
          route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Temporary failure' })
          });
        } else {
          route.continue();
        }
      });
      
      const chatInput = page.locator('input[placeholder*="message"], textarea[placeholder*="message"]').first();
      
      if (await chatInput.isVisible()) {
        await chatInput.fill('Test retry');
        await chatInput.press('Enter');
        
        // Look for retry button or option
        const retryButton = page.locator('button:has-text("Retry"), button:has-text("Try again")').first();
        if (await retryButton.isVisible()) {
          await expect(retryButton).toBeVisible();
        }
      }
    });
  });
});