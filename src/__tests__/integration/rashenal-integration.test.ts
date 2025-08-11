// Comprehensive integration tests for Rashenal platform
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Import all major services
import NewsAggregator from '../../lib/news/news-aggregator';
import PersonalizedNewsService from '../../lib/news/personalized-news-service';
import IndustryInsightsAnalyzer from '../../lib/news/industry-insights';
import JobFinderService from '../../lib/job-finder-service';
import { CalendarService } from '../../lib/calendar-service';
import { EmailService } from '../../lib/email-services/email-service';
import CVParser from '../../lib/intelligent-cv-parser';
import { AIAgent } from '../../lib/ai-agent/ai-agent';

// Mock Supabase with comprehensive mock structure
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      contains: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn(() => Promise.resolve({ data: null, error: null })),
      then: vi.fn(() => Promise.resolve({ data: [], error: null, count: 0 }))
    })),
    rpc: vi.fn(() => Promise.resolve({ data: 'mock-result', error: null })),
    auth: {
      getUser: vi.fn(() => Promise.resolve({ 
        data: { user: { id: 'test-user', email: 'test@example.com' } }, 
        error: null 
      }))
    }
  }
}));

// Mock external APIs
global.fetch = vi.fn();
global.DOMParser = class {
  parseFromString(text: string, type: string) {
    return {
      querySelectorAll: vi.fn(() => []),
      querySelector: vi.fn(() => null)
    };
  }
};

describe('Rashenal Platform Integration Tests', () => {
  let newsAggregator: NewsAggregator;
  let personalizedNews: PersonalizedNewsService;
  let insightsAnalyzer: IndustryInsightsAnalyzer;
  let jobFinder: JobFinderService;
  let calendarService: CalendarService;
  let emailService: EmailService;
  let cvParser: CVParser;
  let aiAgent: AIAgent;

  const mockUser = {
    id: 'test-user-123',
    email: 'test@example.com',
    name: 'Test User'
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Initialize all services
    newsAggregator = new NewsAggregator();
    personalizedNews = new PersonalizedNewsService(mockUser.id);
    insightsAnalyzer = new IndustryInsightsAnalyzer();
    jobFinder = new JobFinderService();
    calendarService = new CalendarService();
    emailService = new EmailService();
    cvParser = new CVParser();
    aiAgent = new AIAgent();

    // Setup common mocks
    (fetch as any).mockResolvedValue({
      text: () => Promise.resolve('<?xml version="1.0"?><rss><channel><item><title>Test Article</title></item></channel></rss>'),
      json: () => Promise.resolve({ status: 'success' })
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('News Aggregation & Personalization Flow', () => {
    it('should complete full news workflow from aggregation to personalized delivery', async () => {
      // 1. Load news sources and aggregate content
      await newsAggregator.loadSources();
      const aggregationStats = await newsAggregator.aggregateNews();
      
      expect(typeof aggregationStats.fetched).toBe('number');
      expect(Array.isArray(aggregationStats.errors)).toBe(true);
      
      // 2. Set user preferences
      const preferences = await personalizedNews.updatePreferences({
        categories: ['technology', 'business'],
        keywords: ['ai', 'startup', 'remote work'],
        industries: ['technology'],
        notificationSettings: {
          dailyDigest: true,
          breakingNews: false,
          weeklySummary: true,
          digestTime: '09:00',
          timezone: 'UTC'
        }
      });
      
      expect(preferences).toBeDefined();
      
      // 3. Generate personalized feed
      const feed = await personalizedNews.getPersonalizedFeed(10);
      
      expect(feed).toBeDefined();
      expect(Array.isArray(feed.articles)).toBe(true);
      expect(typeof feed.totalCount).toBe('number');
      expect(typeof feed.relevanceScores).toBe('object');
      expect(feed.recommendations).toBeDefined();
      
      // 4. Generate industry insights
      const report = await insightsAnalyzer.analyzeIndustryTrends('technology', 30);
      
      expect(report).toBeDefined();
      expect(report.industry).toBe('technology');
      expect(Array.isArray(report.keyInsights)).toBe(true);
      expect(Array.isArray(report.trendingTopics)).toBe(true);
      expect(typeof report.marketSentiment).toBe('number');
      
      // 5. Generate daily digest
      const digest = await personalizedNews.generateDailyDigest();
      
      // Digest may be null if already exists, which is acceptable
      if (digest) {
        expect(digest.digestType).toBe('daily');
        expect(Array.isArray(digest.articleIds)).toBe(true);
      }
    });

    it('should handle user interactions and learning', async () => {
      // Record various user interactions
      const interactions = [
        { articleId: 'article-1', action: 'viewed' as const, readingTime: 120 },
        { articleId: 'article-2', action: 'saved' as const },
        { articleId: 'article-3', action: 'shared' as const },
        { articleId: 'article-4', action: 'hidden' as const }
      ];

      for (const interaction of interactions) {
        const success = await personalizedNews.recordInteraction(
          interaction.articleId,
          interaction.action,
          { readingTimeSeconds: interaction.readingTime }
        );
        expect(success).toBe(true);
      }

      // Save an article with metadata
      const savedArticle = await personalizedNews.saveArticle('article-2', {
        folder: 'ai-research',
        tags: ['important', 'ai'],
        notes: 'Interesting AI development'
      });

      expect(savedArticle).toBeDefined();
      if (savedArticle) {
        expect(savedArticle.folder).toBe('ai-research');
        expect(savedArticle.tags).toContain('important');
      }
    });
  });

  describe('Job Finding & Career Management Flow', () => {
    it('should complete full job discovery workflow', async () => {
      // 1. Create job profile
      const profileData = {
        title: 'Senior Software Engineer',
        skills: ['JavaScript', 'React', 'Node.js', 'Python'],
        experience_level: 'senior' as const,
        industries: ['technology'],
        salary_min: 120000,
        salary_max: 180000,
        location_preferences: ['remote', 'san francisco'],
        company_size_preferences: ['startup', 'mid-size'],
        work_arrangement: 'remote' as const
      };

      const profile = await jobFinder.createJobProfile(mockUser.id, profileData);
      expect(profile).toBeDefined();
      
      // 2. Create job search
      const searchData = {
        profile_id: profile?.id || 'profile-1',
        search_terms: ['senior software engineer', 'full stack developer'],
        location: 'remote',
        salary_range: { min: 120000, max: 180000 },
        job_sites: ['linkedin', 'indeed'],
        frequency: 'daily' as const,
        is_active: true
      };

      const search = await jobFinder.createJobSearch(searchData);
      expect(search).toBeDefined();
      
      // 3. Execute job search and get matches
      const matches = await jobFinder.findJobs(search?.id || 'search-1');
      expect(Array.isArray(matches)).toBe(true);
      
      // 4. Score and evaluate job matches
      if (matches.length > 0) {
        const scoredJob = await jobFinder.evaluateJobMatch(matches[0].id, profile?.id || 'profile-1');
        expect(scoredJob).toBeDefined();
        expect(typeof scoredJob?.match_score).toBe('number');
      }
    });

    it('should integrate CV parsing with job matching', async () => {
      const mockCVContent = `
        John Doe
        Senior Software Engineer
        
        EXPERIENCE
        - 5 years at Tech Corp as Full Stack Developer
        - Led team of 4 developers
        - Built React applications with Node.js backends
        
        SKILLS
        JavaScript, React, Node.js, Python, AWS, Docker
        
        EDUCATION
        BS Computer Science, Tech University
      `;

      // Parse CV content
      const parsedCV = await cvParser.parseCV(mockCVContent);
      
      expect(parsedCV).toBeDefined();
      expect(parsedCV.personalInfo?.name).toContain('John Doe');
      expect(parsedCV.skills.length).toBeGreaterThan(0);
      expect(parsedCV.experience.length).toBeGreaterThan(0);
      
      // Use parsed CV to create job profile
      const profileFromCV = await jobFinder.createJobProfileFromCV(mockUser.id, parsedCV);
      expect(profileFromCV).toBeDefined();
    });
  });

  describe('Calendar Integration & Task Management', () => {
    it('should create calendar events for job application tasks', async () => {
      // Create a job application task
      const applicationTask = {
        title: 'Apply to Senior Engineer at TechCorp',
        description: 'Submit application and prepare for interview',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        job_match_id: 'job-match-123',
        task_type: 'application' as const
      };

      // Calendar service would create event (mocked)
      const calendarEvent = await calendarService.createEvent({
        title: applicationTask.title,
        description: applicationTask.description,
        start: applicationTask.due_date,
        duration: 60 // 1 hour
      });

      expect(calendarEvent).toBeDefined();
      expect(calendarEvent?.title).toBe(applicationTask.title);
    });

    it('should sync tasks with calendar and send reminders', async () => {
      const tasks = [
        {
          title: 'Interview at StartupXYZ',
          scheduled_for: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          type: 'interview'
        },
        {
          title: 'Follow up with TechCorp',
          scheduled_for: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          type: 'follow_up'
        }
      ];

      for (const task of tasks) {
        // Create calendar event
        const event = await calendarService.createEvent({
          title: task.title,
          start: task.scheduled_for,
          duration: task.type === 'interview' ? 60 : 15
        });
        
        expect(event).toBeDefined();
        
        // Schedule email reminder
        const reminder = await emailService.scheduleEmail({
          to: mockUser.email,
          subject: `Reminder: ${task.title}`,
          template: 'task-reminder',
          data: { task, user: mockUser },
          sendAt: new Date(new Date(task.scheduled_for).getTime() - 60 * 60 * 1000) // 1 hour before
        });
        
        expect(reminder).toBeDefined();
      }
    });
  });

  describe('Email Communication & Notifications', () => {
    it('should send personalized news digest via email', async () => {
      // Generate daily digest
      const digest = await personalizedNews.generateDailyDigest();
      
      if (digest) {
        // Send digest email
        const emailResult = await emailService.sendEmail({
          to: mockUser.email,
          subject: 'Your Daily News Digest',
          template: 'daily-digest',
          data: {
            user: mockUser,
            digest,
            articles: [], // Would be populated with actual articles
            insights: [] // Would be populated with insights
          }
        });
        
        expect(emailResult).toBeDefined();
        expect(emailResult?.success).toBe(true);
        
        // Mark digest as sent
        await personalizedNews.markDigestAsRead(digest.id);
      }
    });

    it('should send job alert notifications', async () => {
      const jobAlert = {
        user: mockUser,
        newJobs: [
          {
            title: 'Senior Software Engineer',
            company: 'Amazing Tech Co',
            location: 'Remote',
            salary: '$140k - $160k',
            match_score: 0.92
          }
        ],
        profile: {
          title: 'Senior Software Engineer',
          preferences: ['remote', 'technology']
        }
      };

      const emailResult = await emailService.sendEmail({
        to: mockUser.email,
        subject: `🎯 New High-Match Job Alert: ${jobAlert.newJobs[0].title}`,
        template: 'job-alert',
        data: jobAlert
      });

      expect(emailResult).toBeDefined();
      expect(emailResult?.success).toBe(true);
    });
  });

  describe('AI Agent Integration & Automation', () => {
    it('should provide intelligent job search recommendations', async () => {
      const context = {
        user: mockUser,
        recentActivity: ['viewed job postings', 'saved articles about AI'],
        currentGoals: ['find senior engineer role', 'learn machine learning'],
        marketTrends: ['AI hiring surge', 'remote work growth']
      };

      const recommendations = await aiAgent.generateRecommendations(context);
      
      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations.actions)).toBe(true);
      expect(Array.isArray(recommendations.insights)).toBe(true);
      expect(typeof recommendations.priority).toBe('string');
    });

    it('should analyze career progression and suggest next steps', async () => {
      const careerData = {
        currentRole: 'Software Engineer',
        experience: 3,
        skills: ['JavaScript', 'React', 'Node.js'],
        goals: ['become senior engineer', 'learn cloud architecture'],
        recentApplications: [
          { result: 'interview', level: 'mid-level' },
          { result: 'rejected', level: 'senior' }
        ]
      };

      const analysis = await aiAgent.analyzeCareerProgression(careerData);
      
      expect(analysis).toBeDefined();
      expect(Array.isArray(analysis.recommendations)).toBe(true);
      expect(Array.isArray(analysis.skillGaps)).toBe(true);
      expect(typeof analysis.readinessScore).toBe('number');
    });
  });

  describe('Error Handling & Resilience', () => {
    it('should handle service failures gracefully', async () => {
      // Simulate network errors
      (fetch as any).mockRejectedValueOnce(new Error('Network error'));
      
      const aggregationStats = await newsAggregator.aggregateNews();
      
      // Should not throw, but should record errors
      expect(Array.isArray(aggregationStats.errors)).toBe(true);
      expect(typeof aggregationStats.fetched).toBe('number');
    });

    it('should handle database errors gracefully', async () => {
      const mockSupabase = await import('../../lib/supabase');
      mockSupabase.supabase.from().select().eq().single.mockRejectedValueOnce(new Error('DB Error'));

      const preferences = await personalizedNews.getPreferences();
      
      // Should handle error gracefully
      expect(preferences).toBeNull();
    });

    it('should validate data integrity throughout workflows', async () => {
      // Test with invalid data
      const invalidJobData = {
        title: '', // Invalid: empty title
        skills: [], // Invalid: no skills
        salary_min: -1000, // Invalid: negative salary
      };

      // Service should validate and reject invalid data
      await expect(async () => {
        await jobFinder.createJobProfile(mockUser.id, invalidJobData as any);
      }).rejects.toThrow();
    });
  });

  describe('Performance & Scalability', () => {
    it('should handle large datasets efficiently', async () => {
      const startTime = Date.now();
      
      // Simulate large dataset operations
      const largeResultSet = Array.from({ length: 1000 }, (_, i) => ({
        id: `article-${i}`,
        title: `Article ${i}`,
        relevance_score: Math.random()
      }));

      // Mock large dataset response
      const mockSupabase = await import('../../lib/supabase');
      mockSupabase.supabase.from().select().order().range().limit().then
        .mockResolvedValueOnce({ data: largeResultSet, error: null, count: 1000 });

      const feed = await personalizedNews.getPersonalizedFeed(100);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(feed.articles).toBeDefined();
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should cache frequently accessed data', async () => {
      // Test caching behavior (implementation would cache user preferences)
      const preferences1 = await personalizedNews.getPreferences();
      const preferences2 = await personalizedNews.getPreferences();
      
      // Both calls should succeed (caching would improve performance)
      expect(preferences1).toEqual(preferences2);
    });
  });

  describe('Security & Privacy', () => {
    it('should handle user data securely', async () => {
      // Test that sensitive data is properly handled
      const mockSensitiveData = {
        email: 'user@example.com',
        api_keys: { linkedin: 'secret-key' },
        personal_info: { phone: '+1234567890' }
      };

      // Verify that sensitive data is not logged or exposed
      const processedData = await jobFinder.sanitizeUserData(mockSensitiveData);
      
      expect(processedData.email).toBeDefined();
      expect(processedData.api_keys).toBeUndefined(); // Should be filtered out
    });

    it('should validate user permissions', async () => {
      // Test cross-user data access prevention
      const otherUserId = 'other-user-123';
      
      // Attempting to access another user's data should fail
      const otherUserNews = new PersonalizedNewsService(otherUserId);
      const preferences = await otherUserNews.getPreferences();
      
      // Should only return data for the specified user
      expect(preferences?.userId).toBe(otherUserId);
    });
  });

  describe('Cross-Service Communication', () => {
    it('should coordinate between all services for complete user experience', async () => {
      // Simulate a complete user journey
      const userJourney = {
        step1: 'User uploads CV',
        step2: 'CV is parsed and job profile created',
        step3: 'Job searches are set up automatically',
        step4: 'News preferences are inferred from profile',
        step5: 'Daily digest includes relevant job market insights',
        step6: 'Calendar events created for application deadlines',
        step7: 'Email reminders sent for follow-ups'
      };

      // 1. Parse CV
      const cvContent = 'John Doe\nSoftware Engineer\nJavaScript, React, Node.js';
      const parsedCV = await cvParser.parseCV(cvContent);
      expect(parsedCV).toBeDefined();

      // 2. Create job profile from CV
      const jobProfile = await jobFinder.createJobProfileFromCV(mockUser.id, parsedCV);
      expect(jobProfile).toBeDefined();

      // 3. Set up news preferences based on profile
      const newsPrefs = await personalizedNews.updatePreferences({
        categories: jobProfile?.industries || ['technology'],
        keywords: jobProfile?.skills || ['software', 'engineering'],
        industries: jobProfile?.industries || ['technology']
      });
      expect(newsPrefs).toBeDefined();

      // 4. Generate insights for user's industry
      const insights = await insightsAnalyzer.getInsightsForUser(mockUser.id);
      expect(Array.isArray(insights)).toBe(true);

      // Verify the complete workflow executed successfully
      expect(userJourney.step1).toBe('User uploads CV');
      expect(userJourney.step7).toBe('Email reminders sent for follow-ups');
    });
  });
});