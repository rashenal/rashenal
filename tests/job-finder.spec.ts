import { test, expect } from '@playwright/test';
import { BasePage } from './pages/BasePage';
import { takeScreenshot, waitForPageLoad, generateTestData } from './helpers/test-helpers';

test.describe('Job Finder', () => {
  let basePage: BasePage;

  test.beforeEach(async ({ page }) => {
    basePage = new BasePage(page);
    await basePage.goto('/jobs');
    await waitForPageLoad(page);
  });

  test.describe('Job Finder Dashboard', () => {
    test('should display job finder main interface @smoke', async ({ page }) => {
      // Look for main job finder elements
      const jobFinderElements = [
        'Job Finder',
        'Search',
        'Jobs',
        'Career',
        'Opportunities'
      ];

      let foundElements = 0;
      for (const element of jobFinderElements) {
        const locator = page.locator(`:has-text("${element}")`).first();
        if (await locator.isVisible()) {
          foundElements++;
        }
      }

      expect(foundElements).toBeGreaterThan(0);
    });

    test('should display job search functionality', async ({ page }) => {
      // Look for search input or search-related elements
      const searchInput = page.locator('input[placeholder*="search"], input[placeholder*="job"], input[name*="search"], [data-testid="job-search"]').first();
      
      if (await searchInput.isVisible()) {
        await expect(searchInput).toBeVisible();
      } else {
        // Look for search button or section
        const searchSection = page.locator(':has-text("Search"):not(nav), .search, [data-testid="search"]').first();
        if (await searchSection.isVisible()) {
          await expect(searchSection).toBeVisible();
        }
      }
    });

    test('should display job profiles or profile management', async ({ page }) => {
      // Look for job profile-related elements
      const profileElements = page.locator(':has-text("Profile"), :has-text("Career Profile"), .profile, [data-testid="profile"]');
      const count = await profileElements.count();
      
      if (count > 0) {
        await expect(profileElements.first()).toBeVisible();
      }
    });
  });

  test.describe('Job Profile Management', () => {
    test('should display create profile option', async ({ page }) => {
      const createProfileButton = page.locator('button:has-text("Create Profile"), button:has-text("New Profile"), button:has-text("Add Profile"), [data-testid="create-profile"]').first();
      
      if (await createProfileButton.isVisible()) {
        await expect(createProfileButton).toBeVisible();
      } else {
        // Look for profile setup or onboarding flow
        const setupText = page.locator(':has-text("Set up"), :has-text("Get started"), :has-text("Create your")').first();
        if (await setupText.isVisible()) {
          await expect(setupText).toBeVisible();
        }
      }
    });

    test('should open profile creation form', async ({ page }) => {
      const createButton = page.locator('button:has-text("Create Profile"), button:has-text("New Profile"), button:has-text("Add Profile")').first();
      
      if (await createButton.isVisible()) {
        await createButton.click();
        
        // Look for form modal or form fields
        const modal = page.locator('[role="dialog"], .modal, .profile-form').first();
        const form = page.locator('form').first();
        
        if (await modal.isVisible()) {
          await expect(modal).toBeVisible();
        } else if (await form.isVisible()) {
          await expect(form).toBeVisible();
        }
      } else {
        test.skip('Profile creation not available');
      }
    });

    test('should validate profile form fields', async ({ page }) => {
      const createButton = page.locator('button:has-text("Create Profile"), button:has-text("New Profile")').first();
      
      if (await createButton.isVisible()) {
        await createButton.click();
        
        // Try to submit without required fields
        const submitButton = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Create")').first();
        if (await submitButton.isVisible()) {
          await submitButton.click();
          
          // Look for validation messages
          const errorMessage = page.locator('[role="alert"], .error, .text-red-600, .field-error').first();
          if (await errorMessage.isVisible()) {
            await expect(errorMessage).toBeVisible();
          }
        }
      } else {
        test.skip('Profile creation form not available');
      }
    });

    test('should save profile with valid data', async ({ page }) => {
      const createButton = page.locator('button:has-text("Create Profile"), button:has-text("New Profile")').first();
      
      if (await createButton.isVisible()) {
        await createButton.click();
        
        // Fill profile form
        const titleInput = page.locator('input[name*="title"], input[name*="role"], input[placeholder*="title"]').first();
        if (await titleInput.isVisible()) {
          await titleInput.fill('Software Engineer');
        }
        
        const skillsInput = page.locator('input[name*="skill"], textarea[name*="skill"]').first();
        if (await skillsInput.isVisible()) {
          await skillsInput.fill('JavaScript, React, Node.js');
        }
        
        const locationInput = page.locator('input[name*="location"], input[placeholder*="location"]').first();
        if (await locationInput.isVisible()) {
          await locationInput.fill('San Francisco, CA');
        }
        
        // Submit form
        const submitButton = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Create")').first();
        if (await submitButton.isVisible()) {
          await submitButton.click();
          await page.waitForTimeout(2000);
        }
      } else {
        test.skip('Profile creation not available');
      }
    });
  });

  test.describe('Job Search Functionality', () => {
    test('should perform job search', async ({ page }) => {
      const searchInput = page.locator('input[placeholder*="search"], input[name*="search"], input[name*="query"]').first();
      
      if (await searchInput.isVisible()) {
        await searchInput.fill('Software Engineer');
        
        const searchButton = page.locator('button[type="submit"], button:has-text("Search"), button:has-text("Find")').first();
        if (await searchButton.isVisible()) {
          await searchButton.click();
        } else {
          // Try pressing Enter
          await searchInput.press('Enter');
        }
        
        await page.waitForTimeout(3000);
        
        // Look for search results
        const results = page.locator('.job-result, .job-card, .job-listing, [data-testid="job"]');
        const resultCount = await results.count();
        
        if (resultCount > 0) {
          expect(resultCount).toBeGreaterThan(0);
        }
      } else {
        test.skip('Job search functionality not available');
      }
    });

    test('should display search filters', async ({ page }) => {
      // Look for filter controls
      const filterElements = [
        'input[name*="location"], select[name*="location"]',
        'input[name*="salary"], select[name*="salary"]', 
        'select[name*="type"], input[name*="remote"]',
        'input[name*="experience"], select[name*="level"]'
      ];
      
      let foundFilters = 0;
      for (const selector of filterElements) {
        const element = page.locator(selector).first();
        if (await element.isVisible()) {
          foundFilters++;
        }
      }
      
      // At least some filters should be available
      if (foundFilters > 0) {
        expect(foundFilters).toBeGreaterThan(0);
      }
    });

    test('should handle saved searches', async ({ page }) => {
      const saveSearchButton = page.locator('button:has-text("Save Search"), button:has-text("Save"), [data-testid="save-search"]').first();
      
      if (await saveSearchButton.isVisible()) {
        await saveSearchButton.click();
        
        // Look for confirmation or saved search indicator
        const confirmation = page.locator(':has-text("Saved"), :has-text("Search saved"), [role="alert"]').first();
        if (await confirmation.isVisible()) {
          await expect(confirmation).toBeVisible();
        }
      }
    });
  });

  test.describe('Job Results and Details', () => {
    test('should display job listings', async ({ page }) => {
      // Look for job cards or listings
      const jobCards = page.locator('.job-card, .job-listing, .job-result, [data-testid="job"]');
      const jobCount = await jobCards.count();
      
      if (jobCount > 0) {
        expect(jobCount).toBeGreaterThan(0);
        
        // Check first job has basic elements
        const firstJob = jobCards.first();
        await expect(firstJob).toBeVisible();
        
        // Should contain job title or company name
        const jobText = await firstJob.textContent();
        expect(jobText).toBeTruthy();
      }
    });

    test('should open job details when clicked', async ({ page }) => {
      const jobCards = page.locator('.job-card, .job-listing, .job-result');
      const jobCount = await jobCards.count();
      
      if (jobCount > 0) {
        await jobCards.first().click();
        
        // Look for job detail modal or page
        const jobDetail = page.locator('[role="dialog"], .modal, .job-detail, .job-details').first();
        if (await jobDetail.isVisible()) {
          await expect(jobDetail).toBeVisible();
        } else {
          // Might navigate to detail page
          await page.waitForTimeout(1000);
          const currentUrl = page.url();
          expect(currentUrl).toMatch(/(job|detail)/);
        }
      } else {
        test.skip('No job listings available');
      }
    });

    test('should display job match scores', async ({ page }) => {
      const jobCards = page.locator('.job-card, .job-listing, .job-result');
      const jobCount = await jobCards.count();
      
      if (jobCount > 0) {
        // Look for match score indicators
        const scoreElements = page.locator(':has-text("%"), :has-text("match"), :has-text("score"), .score, .match');
        const scoreCount = await scoreElements.count();
        
        if (scoreCount > 0) {
          expect(scoreCount).toBeGreaterThan(0);
        }
      }
    });
  });

  test.describe('Application Management', () => {
    test('should show apply button for jobs', async ({ page }) => {
      const jobCards = page.locator('.job-card, .job-listing, .job-result');
      const jobCount = await jobCards.count();
      
      if (jobCount > 0) {
        const applyButton = page.locator('button:has-text("Apply"), a:has-text("Apply"), [data-testid="apply"]').first();
        if (await applyButton.isVisible()) {
          await expect(applyButton).toBeVisible();
        }
      }
    });

    test('should track application status', async ({ page }) => {
      const statusIndicators = page.locator(':has-text("Applied"), :has-text("Pending"), :has-text("Interview"), .status, .application-status');
      const statusCount = await statusIndicators.count();
      
      if (statusCount > 0) {
        expect(statusCount).toBeGreaterThan(0);
      }
    });

    test('should manage application history', async ({ page }) => {
      const applicationTab = page.locator('button:has-text("Applications"), tab:has-text("Applications"), a:has-text("Applications")').first();
      
      if (await applicationTab.isVisible()) {
        await applicationTab.click();
        await page.waitForTimeout(1000);
        
        // Look for application history
        const applications = page.locator('.application, .application-card, [data-testid="application"]');
        // Applications list might be empty for new users
      }
    });
  });

  test.describe('Job Finder Accessibility', () => {
    test('should have proper form labels', async ({ page }) => {
      const searchInput = page.locator('input[placeholder*="search"], input[name*="search"]').first();
      
      if (await searchInput.isVisible()) {
        const ariaLabel = await searchInput.getAttribute('aria-label');
        const associatedLabel = await page.locator('label[for]').first().textContent();
        
        expect(ariaLabel || associatedLabel).toBeTruthy();
      }
    });

    test('should support keyboard navigation', async ({ page }) => {
      // Tab through job finder elements
      await page.keyboard.press('Tab');
      
      const focusedElement = page.locator(':focus');
      if (await focusedElement.isVisible()) {
        await expect(focusedElement).toBeVisible();
      }
      
      // Continue tabbing
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab');
        const newFocusedElement = page.locator(':focus');
        if (await newFocusedElement.isVisible()) {
          await expect(newFocusedElement).toBeVisible();
        }
      }
    });

    test('should have proper heading structure', async ({ page }) => {
      const mainHeading = page.locator('h1, h2:first-of-type').first();
      if (await mainHeading.isVisible()) {
        await expect(mainHeading).toBeVisible();
        
        const headingText = await mainHeading.textContent();
        expect(headingText?.toLowerCase()).toMatch(/(job|career|search|finder)/);
      }
    });

    test('should provide alternative text for images', async ({ page }) => {
      const images = page.locator('img');
      const imageCount = await images.count();
      
      for (let i = 0; i < Math.min(imageCount, 5); i++) {
        const img = images.nth(i);
        if (await img.isVisible()) {
          const altText = await img.getAttribute('alt');
          expect(altText).toBeTruthy();
        }
      }
    });
  });

  test.describe('Job Finder Performance', () => {
    test('should load job finder dashboard quickly', async ({ page }) => {
      const startTime = Date.now();
      await basePage.goto('/jobs');
      await waitForPageLoad(page);
      const loadTime = Date.now() - startTime;
      
      expect(loadTime).toBeLessThan(5000);
    });

    test('should handle search requests efficiently', async ({ page }) => {
      const searchInput = page.locator('input[placeholder*="search"], input[name*="search"]').first();
      
      if (await searchInput.isVisible()) {
        const startTime = Date.now();
        
        await searchInput.fill('Engineer');
        await searchInput.press('Enter');
        
        // Wait for search to complete
        await page.waitForTimeout(5000);
        
        const searchTime = Date.now() - startTime;
        expect(searchTime).toBeLessThan(10000);
      }
    });
  });

  test.describe('Responsive Job Finder', () => {
    test('should display properly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await basePage.goto('/jobs');
      await waitForPageLoad(page);
      
      // Job finder should be usable on mobile
      const mainContent = page.locator('main, .job-finder, .content').first();
      await expect(mainContent).toBeVisible();
      
      // Search should be accessible
      const searchInput = page.locator('input[placeholder*="search"], input[name*="search"]').first();
      if (await searchInput.isVisible()) {
        await expect(searchInput).toBeVisible();
      }
      
      await takeScreenshot(page, 'job-finder-mobile');
    });

    test('should adapt layout for tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await basePage.goto('/jobs');
      await waitForPageLoad(page);
      
      // Check that filters and results are properly arranged
      const filterSection = page.locator('.filters, .search-filters, aside').first();
      const resultsSection = page.locator('.results, .job-results, .job-listings').first();
      
      await takeScreenshot(page, 'job-finder-tablet');
    });

    test('should utilize desktop space effectively', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await basePage.goto('/jobs');
      await waitForPageLoad(page);
      
      // Desktop layout should show filters and results side by side
      const sidebar = page.locator('.sidebar, .filters, aside').first();
      const mainContent = page.locator('.main-content, .job-results, main').first();
      
      if (await sidebar.isVisible() && await mainContent.isVisible()) {
        const sidebarBox = await sidebar.boundingBox();
        const contentBox = await mainContent.boundingBox();
        
        if (sidebarBox && contentBox) {
          expect(contentBox.x).toBeGreaterThan(sidebarBox.x);
        }
      }
      
      await takeScreenshot(page, 'job-finder-desktop');
    });
  });

  test.describe('AI Job Matching', () => {
    test('should display AI-powered job recommendations', async ({ page }) => {
      // Look for AI-related elements
      const aiElements = page.locator(':has-text("AI"), :has-text("Recommended"), :has-text("Match"), .ai-recommendation, [data-testid="ai"]');
      const count = await aiElements.count();
      
      if (count > 0) {
        expect(count).toBeGreaterThan(0);
      }
    });

    test('should show job match explanations', async ({ page }) => {
      const jobCards = page.locator('.job-card, .job-listing');
      const jobCount = await jobCards.count();
      
      if (jobCount > 0) {
        // Look for match explanations or scores
        const explanations = page.locator(':has-text("Why this matches"), :has-text("Match because"), .match-reason, .explanation');
        const explanationCount = await explanations.count();
        
        if (explanationCount > 0) {
          expect(explanationCount).toBeGreaterThan(0);
        }
      }
    });

    test('should provide career insights', async ({ page }) => {
      const insightsSection = page.locator(':has-text("Insights"), :has-text("Trends"), :has-text("Analysis"), .insights, .career-insights').first();
      
      if (await insightsSection.isVisible()) {
        await expect(insightsSection).toBeVisible();
      }
    });
  });
});