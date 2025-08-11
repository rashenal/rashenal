// End-to-end testing framework for Rashenal platform
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { Browser, Page, chromium } from 'playwright';

// E2E Test Configuration
const E2E_CONFIG = {
  baseUrl: 'http://localhost:5173', // Vite dev server
  timeout: 30000,
  headless: process.env.CI === 'true',
  slowMo: process.env.DEBUG ? 500 : 0
};

// Test Data
const TEST_USER = {
  email: 'test@rashenal.com',
  password: 'TestPassword123!',
  name: 'Test User'
};

const TEST_JOB_PROFILE = {
  title: 'Senior Software Engineer',
  skills: ['JavaScript', 'React', 'Node.js', 'Python'],
  experience: '5+ years',
  location: 'Remote',
  salary: '$120k - $180k'
};

const TEST_CV_CONTENT = `
John Doe
Senior Software Engineer
john.doe@example.com
+1 (555) 123-4567

EXPERIENCE
Senior Software Engineer | TechCorp Inc. | 2020-2024
• Led development of React-based web applications
• Mentored team of 4 junior developers
• Implemented CI/CD pipelines reducing deployment time by 60%

Software Engineer | StartupXYZ | 2018-2020
• Built Node.js microservices handling 1M+ requests/day
• Developed Python data processing pipelines
• Collaborated with cross-functional teams on product roadmap

SKILLS
Technical: JavaScript, React, Node.js, Python, AWS, Docker, Kubernetes
Soft Skills: Leadership, Mentoring, Agile Development, Team Collaboration

EDUCATION
Bachelor of Science in Computer Science
Tech University | 2014-2018
`;

describe('Rashenal E2E Tests', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await chromium.launch({
      headless: E2E_CONFIG.headless,
      slowMo: E2E_CONFIG.slowMo
    });
  });

  afterAll(async () => {
    await browser?.close();
  });

  beforeEach(async () => {
    page = await browser.newPage();
    page.setDefaultTimeout(E2E_CONFIG.timeout);
    
    // Mock external API calls
    await page.route('**/api/auth/**', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({ user: TEST_USER, session: 'mock-session' })
      });
    });

    await page.route('**/api/job-search/**', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({ jobs: [], matches: [] })
      });
    });

    await page.route('**/api/news/**', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({ articles: [], digest: null })
      });
    });
  });

  describe('Authentication Flow', () => {
    it('should complete sign up and sign in flow', async () => {
      await page.goto(E2E_CONFIG.baseUrl);

      // Navigate to sign up
      await page.click('[data-testid="sign-up-button"]');
      await expect(page.locator('h1')).toContainText('Create Account');

      // Fill sign up form
      await page.fill('[data-testid="email-input"]', TEST_USER.email);
      await page.fill('[data-testid="password-input"]', TEST_USER.password);
      await page.fill('[data-testid="confirm-password-input"]', TEST_USER.password);
      await page.fill('[data-testid="name-input"]', TEST_USER.name);

      // Submit form
      await page.click('[data-testid="submit-signup"]');

      // Should redirect to dashboard after successful signup
      await expect(page.locator('[data-testid="dashboard-welcome"]')).toBeVisible();
      await expect(page.locator('[data-testid="dashboard-welcome"]')).toContainText(`Welcome, ${TEST_USER.name}`);
    });

    it('should handle sign in with existing account', async () => {
      await page.goto(E2E_CONFIG.baseUrl);

      // Navigate to sign in
      await page.click('[data-testid="sign-in-button"]');
      await expect(page.locator('h1')).toContainText('Sign In');

      // Fill sign in form
      await page.fill('[data-testid="email-input"]', TEST_USER.email);
      await page.fill('[data-testid="password-input"]', TEST_USER.password);

      // Submit form
      await page.click('[data-testid="submit-signin"]');

      // Should redirect to dashboard
      await expect(page.locator('[data-testid="dashboard-welcome"]')).toBeVisible();
    });

    it('should handle sign out', async () => {
      // First sign in
      await page.goto(E2E_CONFIG.baseUrl);
      await page.click('[data-testid="sign-in-button"]');
      await page.fill('[data-testid="email-input"]', TEST_USER.email);
      await page.fill('[data-testid="password-input"]', TEST_USER.password);
      await page.click('[data-testid="submit-signin"]');

      // Then sign out
      await page.click('[data-testid="user-menu"]');
      await page.click('[data-testid="sign-out-button"]');

      // Should redirect to landing page
      await expect(page.locator('[data-testid="landing-hero"]')).toBeVisible();
    });
  });

  describe('Job Finder Dashboard', () => {
    beforeEach(async () => {
      // Sign in before each test
      await page.goto(E2E_CONFIG.baseUrl);
      await page.click('[data-testid="sign-in-button"]');
      await page.fill('[data-testid="email-input"]', TEST_USER.email);
      await page.fill('[data-testid="password-input"]', TEST_USER.password);
      await page.click('[data-testid="submit-signin"]');
      
      // Navigate to Job Finder
      await page.click('[data-testid="nav-job-finder"]');
    });

    it('should create a new job profile', async () => {
      await expect(page.locator('[data-testid="job-finder-dashboard"]')).toBeVisible();

      // Click create profile button
      await page.click('[data-testid="create-job-profile"]');

      // Fill profile form
      await page.fill('[data-testid="profile-title"]', TEST_JOB_PROFILE.title);
      
      // Add skills
      for (const skill of TEST_JOB_PROFILE.skills) {
        await page.fill('[data-testid="skill-input"]', skill);
        await page.press('[data-testid="skill-input"]', 'Enter');
      }

      await page.fill('[data-testid="experience-level"]', TEST_JOB_PROFILE.experience);
      await page.fill('[data-testid="location-preference"]', TEST_JOB_PROFILE.location);
      await page.fill('[data-testid="salary-range"]', TEST_JOB_PROFILE.salary);

      // Submit profile
      await page.click('[data-testid="save-profile"]');

      // Verify profile was created
      await expect(page.locator('[data-testid="profile-card"]')).toBeVisible();
      await expect(page.locator('[data-testid="profile-title"]')).toContainText(TEST_JOB_PROFILE.title);
    });

    it('should create and manage job searches', async () => {
      // Create job search
      await page.click('[data-testid="create-job-search"]');

      await page.fill('[data-testid="search-keywords"]', 'senior software engineer react');
      await page.fill('[data-testid="search-location"]', 'Remote');
      await page.selectOption('[data-testid="search-frequency"]', 'daily');
      
      // Select job sites
      await page.check('[data-testid="jobsite-linkedin"]');
      await page.check('[data-testid="jobsite-indeed"]');

      await page.click('[data-testid="save-search"]');

      // Verify search was created
      await expect(page.locator('[data-testid="search-card"]')).toBeVisible();
      await expect(page.locator('[data-testid="search-status"]')).toContainText('Active');
    });

    it('should display job matches and allow filtering', async () => {
      // Mock job matches
      await page.route('**/api/job-matches/**', (route) => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            matches: [
              {
                id: 'job-1',
                title: 'Senior Software Engineer',
                company: 'TechCorp',
                location: 'Remote',
                salary: '$140k - $160k',
                match_score: 0.92,
                posted_date: new Date().toISOString()
              },
              {
                id: 'job-2',
                title: 'Full Stack Developer',
                company: 'StartupXYZ',
                location: 'San Francisco, CA',
                salary: '$120k - $140k',
                match_score: 0.78,
                posted_date: new Date().toISOString()
              }
            ]
          })
        });
      });

      await page.reload();

      // Verify job matches are displayed
      await expect(page.locator('[data-testid="job-match"]')).toHaveCount(2);
      
      // Test filtering by match score
      await page.fill('[data-testid="min-match-score"]', '0.8');
      await page.click('[data-testid="apply-filters"]');
      
      await expect(page.locator('[data-testid="job-match"]')).toHaveCount(1);
      
      // Test sorting
      await page.selectOption('[data-testid="sort-by"]', 'salary-desc');
      
      const firstJob = page.locator('[data-testid="job-match"]').first();
      await expect(firstJob.locator('[data-testid="job-salary"]')).toContainText('$140k - $160k');
    });

    it('should handle job application tracking', async () => {
      // Click on a job match
      await page.click('[data-testid="job-match"]');
      
      // View job details
      await expect(page.locator('[data-testid="job-details"]')).toBeVisible();
      
      // Mark as applied
      await page.click('[data-testid="mark-applied"]');
      
      // Fill application details
      await page.fill('[data-testid="application-date"]', '2024-01-15');
      await page.selectOption('[data-testid="application-status"]', 'applied');
      await page.fill('[data-testid="application-notes"]', 'Applied via company website');
      
      await page.click('[data-testid="save-application"]');
      
      // Verify application was tracked
      await expect(page.locator('[data-testid="application-status"]')).toContainText('Applied');
      
      // Check applications dashboard
      await page.click('[data-testid="nav-applications"]');
      await expect(page.locator('[data-testid="application-card"]')).toBeVisible();
    });
  });

  describe('CV Parser & Profile Manager', () => {
    beforeEach(async () => {
      await page.goto(E2E_CONFIG.baseUrl);
      await page.click('[data-testid="sign-in-button"]');
      await page.fill('[data-testid="email-input"]', TEST_USER.email);
      await page.fill('[data-testid="password-input"]', TEST_USER.password);
      await page.click('[data-testid="submit-signin"]');
      
      await page.click('[data-testid="nav-profile-manager"]');
    });

    it('should parse CV and create profile automatically', async () => {
      // Upload CV text
      await page.click('[data-testid="upload-cv"]');
      await page.fill('[data-testid="cv-text-input"]', TEST_CV_CONTENT);
      await page.click('[data-testid="parse-cv"]');

      // Verify parsing results
      await expect(page.locator('[data-testid="parsed-name"]')).toContainText('John Doe');
      await expect(page.locator('[data-testid="parsed-email"]')).toContainText('john.doe@example.com');
      await expect(page.locator('[data-testid="parsed-skills"]')).toContainText('JavaScript');
      await expect(page.locator('[data-testid="parsed-skills"]')).toContainText('React');
      
      // Create profile from parsed CV
      await page.click('[data-testid="create-profile-from-cv"]');
      
      // Verify profile creation
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Profile created successfully');
    });

    it('should allow manual editing of parsed information', async () => {
      // Parse CV first
      await page.click('[data-testid="upload-cv"]');
      await page.fill('[data-testid="cv-text-input"]', TEST_CV_CONTENT);
      await page.click('[data-testid="parse-cv"]');

      // Edit parsed information
      await page.click('[data-testid="edit-parsed-info"]');
      
      // Add additional skill
      await page.fill('[data-testid="add-skill-input"]', 'TypeScript');
      await page.click('[data-testid="add-skill-button"]');
      
      // Update experience
      await page.fill('[data-testid="total-experience"]', '6');
      
      // Save changes
      await page.click('[data-testid="save-edits"]');
      
      // Verify changes were saved
      await expect(page.locator('[data-testid="parsed-skills"]')).toContainText('TypeScript');
    });
  });

  describe('News & Insights Dashboard', () => {
    beforeEach(async () => {
      await page.goto(E2E_CONFIG.baseUrl);
      await page.click('[data-testid="sign-in-button"]');
      await page.fill('[data-testid="email-input"]', TEST_USER.email);
      await page.fill('[data-testid="password-input"]', TEST_USER.password);
      await page.click('[data-testid="submit-signin"]');
      
      await page.click('[data-testid="nav-news-insights"]');
    });

    it('should display personalized news feed', async () => {
      // Mock news articles
      await page.route('**/api/news/feed/**', (route) => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            articles: [
              {
                id: 'news-1',
                title: 'Tech Industry Hiring Surge in 2024',
                summary: 'Companies ramping up hiring for software engineers',
                categories: ['technology'],
                relevance_score: 0.9,
                published_at: new Date().toISOString()
              },
              {
                id: 'news-2',
                title: 'Remote Work Trends Continue to Grow',
                summary: 'Study shows 70% of companies offering remote options',
                categories: ['business'],
                relevance_score: 0.8,
                published_at: new Date().toISOString()
              }
            ],
            totalCount: 2
          })
        });
      });

      await page.reload();

      // Verify news articles are displayed
      await expect(page.locator('[data-testid="news-article"]')).toHaveCount(2);
      
      // Test article interaction
      await page.click('[data-testid="news-article"]');
      await expect(page.locator('[data-testid="article-details"]')).toBeVisible();
      
      // Save article
      await page.click('[data-testid="save-article"]');
      await expect(page.locator('[data-testid="article-saved"]')).toBeVisible();
    });

    it('should manage news preferences', async () => {
      await page.click('[data-testid="news-preferences"]');
      
      // Update preferences
      await page.check('[data-testid="category-technology"]');
      await page.check('[data-testid="category-business"]');
      
      await page.fill('[data-testid="keyword-input"]', 'artificial intelligence');
      await page.press('[data-testid="keyword-input"]', 'Enter');
      
      await page.check('[data-testid="daily-digest"]');
      await page.selectOption('[data-testid="digest-time"]', '09:00');
      
      await page.click('[data-testid="save-preferences"]');
      
      // Verify preferences were saved
      await expect(page.locator('[data-testid="preferences-saved"]')).toBeVisible();
    });

    it('should display industry insights', async () => {
      await page.click('[data-testid="industry-insights-tab"]');
      
      // Mock insights
      await page.route('**/api/insights/**', (route) => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            insights: [
              {
                id: 'insight-1',
                title: 'Technology Industry Seeing Increased Hiring',
                impact_level: 'high',
                confidence_score: 0.92,
                insight_type: 'opportunity'
              }
            ],
            trending_topics: [
              { topic: 'ai', mention_count: 15, sentiment_avg: 0.7 }
            ]
          })
        });
      });

      await page.reload();
      
      // Verify insights are displayed
      await expect(page.locator('[data-testid="industry-insight"]')).toBeVisible();
      await expect(page.locator('[data-testid="trending-topic"]')).toBeVisible();
    });
  });

  describe('Calendar Integration', () => {
    beforeEach(async () => {
      await page.goto(E2E_CONFIG.baseUrl);
      await page.click('[data-testid="sign-in-button"]');
      await page.fill('[data-testid="email-input"]', TEST_USER.email);
      await page.fill('[data-testid="password-input"]', TEST_USER.password);
      await page.click('[data-testid="submit-signin"]');
      
      await page.click('[data-testid="nav-calendar"]');
    });

    it('should display calendar with job-related events', async () => {
      // Mock calendar events
      await page.route('**/api/calendar/events/**', (route) => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            events: [
              {
                id: 'event-1',
                title: 'Interview at TechCorp',
                start: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
                type: 'interview',
                job_application_id: 'app-1'
              },
              {
                id: 'event-2',
                title: 'Follow up with StartupXYZ',
                start: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
                type: 'follow_up',
                job_application_id: 'app-2'
              }
            ]
          })
        });
      });

      await page.reload();

      // Verify calendar is displayed
      await expect(page.locator('[data-testid="calendar-view"]')).toBeVisible();
      await expect(page.locator('[data-testid="calendar-event"]')).toHaveCount(2);
      
      // Click on event to view details
      await page.click('[data-testid="calendar-event"]');
      await expect(page.locator('[data-testid="event-details"]')).toBeVisible();
    });

    it('should create new calendar events', async () => {
      await page.click('[data-testid="create-event"]');
      
      await page.fill('[data-testid="event-title"]', 'Networking Event');
      await page.fill('[data-testid="event-date"]', '2024-02-01');
      await page.fill('[data-testid="event-time"]', '18:00');
      await page.selectOption('[data-testid="event-type"]', 'networking');
      
      await page.click('[data-testid="save-event"]');
      
      // Verify event was created
      await expect(page.locator('[data-testid="event-created"]')).toBeVisible();
    });
  });

  describe('Accessibility Features', () => {
    beforeEach(async () => {
      await page.goto(E2E_CONFIG.baseUrl);
    });

    it('should be keyboard navigable', async () => {
      // Test tab navigation
      await page.keyboard.press('Tab'); // Focus first element
      await page.keyboard.press('Tab'); // Focus sign-in button
      await page.keyboard.press('Enter'); // Activate sign-in
      
      // Should navigate to sign-in page
      await expect(page.locator('h1')).toContainText('Sign In');
    });

    it('should have proper ARIA labels and roles', async () => {
      // Check for proper ARIA attributes
      const signInButton = page.locator('[data-testid="sign-in-button"]');
      await expect(signInButton).toHaveAttribute('role', 'button');
      await expect(signInButton).toHaveAttribute('aria-label');
      
      // Check form labels
      await page.click('[data-testid="sign-in-button"]');
      const emailInput = page.locator('[data-testid="email-input"]');
      await expect(emailInput).toHaveAttribute('aria-label');
    });

    it('should support dark mode toggle', async () => {
      await page.click('[data-testid="theme-toggle"]');
      
      // Verify dark mode is applied
      await expect(page.locator('body')).toHaveClass(/dark/);
      
      // Toggle back to light mode
      await page.click('[data-testid="theme-toggle"]');
      await expect(page.locator('body')).not.toHaveClass(/dark/);
    });
  });

  describe('Mobile Responsiveness', () => {
    beforeEach(async () => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(E2E_CONFIG.baseUrl);
    });

    it('should display mobile navigation menu', async () => {
      // Should show mobile menu button
      await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();
      
      // Click to open menu
      await page.click('[data-testid="mobile-menu-button"]');
      await expect(page.locator('[data-testid="mobile-nav-menu"]')).toBeVisible();
      
      // Test navigation
      await page.click('[data-testid="mobile-nav-job-finder"]');
      await expect(page.locator('[data-testid="job-finder-mobile"]')).toBeVisible();
    });

    it('should have responsive layout for job cards', async () => {
      // Sign in first
      await page.click('[data-testid="mobile-menu-button"]');
      await page.click('[data-testid="mobile-nav-sign-in"]');
      await page.fill('[data-testid="email-input"]', TEST_USER.email);
      await page.fill('[data-testid="password-input"]', TEST_USER.password);
      await page.click('[data-testid="submit-signin"]');
      
      // Navigate to job finder
      await page.click('[data-testid="mobile-menu-button"]');
      await page.click('[data-testid="mobile-nav-job-finder"]');
      
      // Job cards should stack vertically on mobile
      const jobCards = page.locator('[data-testid="job-match"]');
      if (await jobCards.count() > 1) {
        const firstCard = jobCards.first();
        const secondCard = jobCards.nth(1);
        
        const firstCardBox = await firstCard.boundingBox();
        const secondCardBox = await secondCard.boundingBox();
        
        // Second card should be below the first (stacked vertically)
        expect(secondCardBox?.y).toBeGreaterThan(firstCardBox?.y! + firstCardBox?.height!);
      }
    });
  });

  describe('Performance & Loading', () => {
    it('should load within acceptable time limits', async () => {
      const startTime = Date.now();
      
      await page.goto(E2E_CONFIG.baseUrl);
      await expect(page.locator('[data-testid="landing-hero"]')).toBeVisible();
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds
    });

    it('should show loading states for async operations', async () => {
      await page.goto(E2E_CONFIG.baseUrl);
      await page.click('[data-testid="sign-in-button"]');
      await page.fill('[data-testid="email-input"]', TEST_USER.email);
      await page.fill('[data-testid="password-input"]', TEST_USER.password);
      
      // Mock slow API response
      await page.route('**/api/auth/**', (route) => {
        setTimeout(() => {
          route.fulfill({
            status: 200,
            body: JSON.stringify({ user: TEST_USER })
          });
        }, 2000);
      });
      
      await page.click('[data-testid="submit-signin"]');
      
      // Should show loading indicator
      await expect(page.locator('[data-testid="loading-indicator"]')).toBeVisible();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      await page.goto(E2E_CONFIG.baseUrl);
      
      // Mock network error
      await page.route('**/api/**', (route) => {
        route.abort('networkfailure');
      });
      
      await page.click('[data-testid="sign-in-button"]');
      await page.fill('[data-testid="email-input"]', TEST_USER.email);
      await page.fill('[data-testid="password-input"]', TEST_USER.password);
      await page.click('[data-testid="submit-signin"]');
      
      // Should show error message
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Network error');
    });

    it('should handle API errors with proper user feedback', async () => {
      await page.goto(E2E_CONFIG.baseUrl);
      
      // Mock API error
      await page.route('**/api/auth/**', (route) => {
        route.fulfill({
          status: 400,
          body: JSON.stringify({ error: 'Invalid credentials' })
        });
      });
      
      await page.click('[data-testid="sign-in-button"]');
      await page.fill('[data-testid="email-input"]', TEST_USER.email);
      await page.fill('[data-testid="password-input"]', 'wrong-password');
      await page.click('[data-testid="submit-signin"]');
      
      // Should show specific error message
      await expect(page.locator('[data-testid="auth-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="auth-error"]')).toContainText('Invalid credentials');
    });
  });
});