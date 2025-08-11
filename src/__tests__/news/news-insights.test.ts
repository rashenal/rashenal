import { describe, it, expect, vi, beforeEach } from 'vitest';
import NewsAggregator from '../../lib/news/news-aggregator';
import PersonalizedNewsService from '../../lib/news/personalized-news-service';
import IndustryInsightsAnalyzer from '../../lib/news/industry-insights';

// Mock Supabase
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
    rpc: vi.fn(() => Promise.resolve({ data: 'mock-digest-id', error: null }))
  }
}));

// Mock DOMParser for RSS parsing
global.DOMParser = class {
  parseFromString(text: string, type: string) {
    return {
      querySelectorAll: vi.fn(() => []),
      querySelector: vi.fn(() => null)
    };
  }
};

// Mock fetch
global.fetch = vi.fn();

describe('News & Insights System', () => {
  let newsAggregator: NewsAggregator;
  let personalizedService: PersonalizedNewsService;
  let insightsAnalyzer: IndustryInsightsAnalyzer;

  beforeEach(() => {
    vi.clearAllMocks();
    newsAggregator = new NewsAggregator();
    personalizedService = new PersonalizedNewsService('test-user');
    insightsAnalyzer = new IndustryInsightsAnalyzer();

    // Mock fetch for RSS feeds
    (fetch as any).mockResolvedValue({
      text: () => Promise.resolve(`<?xml version="1.0"?>
        <rss>
          <channel>
            <item>
              <title>Test Article Title</title>
              <description>Test article description</description>
              <link>https://example.com/article</link>
              <pubDate>Wed, 02 Oct 2024 09:00:00 GMT</pubDate>
              <category>technology</category>
            </item>
          </channel>
        </rss>`)
    });
  });

  describe('NewsAggregator', () => {
    it('should load news sources successfully', async () => {
      const mockSources = [
        {
          id: 'source-1',
          name: 'Tech News',
          url: 'https://technews.com',
          feed_url: 'https://technews.com/rss',
          source_type: 'rss',
          category: ['technology'],
          reliability_score: 0.9,
          is_active: true,
          fetch_frequency_minutes: 360,
          metadata: {}
        }
      ];

      const mockSupabase = await import('../../lib/supabase');
      mockSupabase.supabase.from().select().eq().then.mockResolvedValueOnce({
        data: mockSources,
        error: null
      });

      await newsAggregator.loadSources();
      
      expect(mockSupabase.supabase.from).toHaveBeenCalledWith('news_sources');
    });

    it('should aggregate news from sources', async () => {
      const mockSupabase = await import('../../lib/supabase');
      
      // Mock sources response
      mockSupabase.supabase.from().select().eq().then.mockResolvedValueOnce({
        data: [{
          id: 'source-1',
          name: 'Tech News',
          url: 'https://technews.com',
          feed_url: 'https://technews.com/rss',
          source_type: 'rss',
          category: ['technology'],
          reliability_score: 0.9,
          is_active: true,
          last_fetched: null, // Should trigger fetch
          fetch_frequency_minutes: 360,
          metadata: {}
        }],
        error: null
      });

      // Mock article save response
      mockSupabase.supabase.from().upsert().mockResolvedValue({ error: null });
      mockSupabase.supabase.from().update().eq().mockResolvedValue({ error: null });

      const stats = await newsAggregator.aggregateNews();

      expect(stats.fetched).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(stats.errors)).toBe(true);
    });

    it('should search articles with filters', async () => {
      const mockArticles = [
        {
          id: 'article-1',
          title: 'AI Breakthrough in Healthcare',
          summary: 'New AI system diagnoses diseases',
          published_at: '2024-01-01',
          categories: ['technology', 'healthcare'],
          tags: ['ai', 'machine learning'],
          relevance_score: 0.9
        }
      ];

      const mockSupabase = await import('../../lib/supabase');
      mockSupabase.supabase.from().select().or().contains().gte().lte().in().order().limit().then
        .mockResolvedValueOnce({ data: mockArticles, error: null });

      const results = await newsAggregator.searchArticles('AI', {
        categories: ['technology'],
        minRelevance: 0.5
      });

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('AI Breakthrough in Healthcare');
    });

    it('should handle RSS parsing errors gracefully', async () => {
      (fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const mockSupabase = await import('../../lib/supabase');
      mockSupabase.supabase.from().select().eq().then.mockResolvedValueOnce({
        data: [{
          id: 'source-1',
          name: 'Tech News',
          url: 'https://technews.com',
          feed_url: 'https://technews.com/rss',
          source_type: 'rss',
          category: ['technology'],
          reliability_score: 0.9,
          is_active: true,
          last_fetched: null,
          fetch_frequency_minutes: 360,
          metadata: {}
        }],
        error: null
      });

      const stats = await newsAggregator.aggregateNews();
      
      expect(stats.errors).toContain('Failed to fetch from Tech News: Network error');
    });
  });

  describe('PersonalizedNewsService', () => {
    it('should get user preferences', async () => {
      const mockPreferences = {
        id: 'pref-1',
        user_id: 'test-user',
        categories: ['technology', 'business'],
        keywords: ['ai', 'startup'],
        companies: ['Google', 'Apple'],
        industries: ['technology'],
        excluded_sources: [],
        excluded_keywords: ['politics'],
        notification_settings: {
          dailyDigest: true,
          breakingNews: false,
          weeklySummary: true,
          digestTime: '09:00',
          timezone: 'UTC'
        },
        reading_history_retention_days: 30,
        ai_personalization_enabled: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      const mockSupabase = await import('../../lib/supabase');
      mockSupabase.supabase.from().select().eq().single.mockResolvedValueOnce({
        data: mockPreferences,
        error: null
      });

      const preferences = await personalizedService.getPreferences();

      expect(preferences).toBeDefined();
      expect(preferences?.categories).toEqual(['technology', 'business']);
      expect(preferences?.keywords).toEqual(['ai', 'startup']);
    });

    it('should update user preferences', async () => {
      const mockSupabase = await import('../../lib/supabase');
      
      // Mock existing preferences
      mockSupabase.supabase.from().select().eq().single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' } // No preferences found
      });

      // Mock upsert response
      mockSupabase.supabase.from().upsert().select().single.mockResolvedValueOnce({
        data: {
          id: 'pref-1',
          user_id: 'test-user',
          categories: ['technology'],
          keywords: ['ai'],
          notification_settings: { dailyDigest: true },
          ai_personalization_enabled: true
        },
        error: null
      });

      const updated = await personalizedService.updatePreferences({
        categories: ['technology'],
        keywords: ['ai']
      });

      expect(updated).toBeDefined();
      expect(updated?.categories).toEqual(['technology']);
    });

    it('should generate personalized feed', async () => {
      const mockArticles = [
        {
          id: 'article-1',
          title: 'AI in Healthcare',
          categories: ['technology', 'healthcare'],
          published_at: '2024-01-01',
          relevance_score: 0.9
        },
        {
          id: 'article-2',
          title: 'Startup Funding News',
          categories: ['business'],
          published_at: '2024-01-01',
          relevance_score: 0.7
        }
      ];

      const mockSupabase = await import('../../lib/supabase');
      
      // Mock preferences
      mockSupabase.supabase.from().select().eq().single.mockResolvedValueOnce({
        data: {
          categories: ['technology'],
          keywords: ['ai'],
          excluded_keywords: []
        },
        error: null
      });

      // Mock articles
      mockSupabase.supabase.from().select().order().contains().not().range().limit().then
        .mockResolvedValueOnce({ data: mockArticles, error: null, count: 2 });

      // Mock interactions for behavior analysis
      mockSupabase.supabase.from().select().eq().gte().then.mockResolvedValueOnce({ data: [], error: null });

      // Mock recommendations
      mockSupabase.supabase.from().select().gte().order().limit().then
        .mockResolvedValue({ data: [], error: null });

      const feed = await personalizedService.getPersonalizedFeed(10);

      expect(feed).toBeDefined();
      expect(feed.articles).toHaveLength(2);
      expect(feed.totalCount).toBe(2);
      expect(feed.recommendations).toBeDefined();
    });

    it('should record user interactions', async () => {
      const mockSupabase = await import('../../lib/supabase');
      mockSupabase.supabase.from().upsert().mockResolvedValueOnce({ error: null });

      const success = await personalizedService.recordInteraction('article-1', 'viewed', {
        readingTimeSeconds: 120,
        scrollDepth: 0.8
      });

      expect(success).toBe(true);
      expect(mockSupabase.supabase.from).toHaveBeenCalledWith('news_interactions');
    });

    it('should save articles', async () => {
      const mockSupabase = await import('../../lib/supabase');
      mockSupabase.supabase.from().upsert().select().single.mockResolvedValueOnce({
        data: {
          id: 'saved-1',
          user_id: 'test-user',
          article_id: 'article-1',
          folder: 'ai-research',
          tags: ['important'],
          created_at: '2024-01-01T00:00:00Z'
        },
        error: null
      });

      const saved = await personalizedService.saveArticle('article-1', {
        folder: 'ai-research',
        tags: ['important']
      });

      expect(saved).toBeDefined();
      expect(saved?.folder).toBe('ai-research');
      expect(saved?.tags).toEqual(['important']);
    });

    it('should generate daily digest', async () => {
      const mockSupabase = await import('../../lib/supabase');
      
      // Mock no existing digest
      mockSupabase.supabase.from().select().eq().gte().single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' }
      });

      // Mock digest generation
      mockSupabase.supabase.rpc.mockResolvedValueOnce({
        data: 'digest-123',
        error: null
      });

      // Mock digest retrieval
      mockSupabase.supabase.from().select().eq().single.mockResolvedValueOnce({
        data: {
          id: 'digest-123',
          user_id: 'test-user',
          digest_type: 'daily',
          summary: 'Your daily digest',
          article_ids: ['article-1', 'article-2'],
          created_at: '2024-01-01T00:00:00Z'
        },
        error: null
      });

      const digest = await personalizedService.generateDailyDigest();

      expect(digest).toBeDefined();
      expect(digest?.digestType).toBe('daily');
    });
  });

  describe('IndustryInsightsAnalyzer', () => {
    it('should analyze industry trends', async () => {
      const mockArticles = [
        {
          id: 'article-1',
          title: 'Tech Companies Hiring Surge',
          summary: 'Major hiring increases in tech sector',
          categories: ['technology'],
          tags: ['hiring', 'growth'],
          sentiment: 0.8,
          published_at: '2024-01-01',
          relevance_score: 0.9
        },
        {
          id: 'article-2',
          title: 'AI Investment Boom',
          summary: 'Record funding for AI startups',
          categories: ['technology'],
          tags: ['ai', 'funding'],
          sentiment: 0.6,
          published_at: '2024-01-01',
          relevance_score: 0.8
        },
        {
          id: 'article-3',
          title: 'Cloud Computing Growth',
          summary: 'Cloud adoption accelerating',
          categories: ['technology'],
          tags: ['cloud', 'growth'],
          sentiment: 0.7,
          published_at: '2024-01-01',
          relevance_score: 0.85
        }
      ];

      const mockSupabase = await import('../../lib/supabase');
      
      // Mock articles query
      mockSupabase.supabase.from().select().contains().gte().lte().order().limit().then
        .mockResolvedValueOnce({ data: mockArticles, error: null });

      // Mock insight saving
      mockSupabase.supabase.from().upsert().mockResolvedValue({ error: null });

      const report = await insightsAnalyzer.analyzeIndustryTrends('technology', 30);

      expect(report).toBeDefined();
      expect(report.industry).toBe('technology');
      expect(report.keyInsights).toBeDefined();
      expect(report.trendingTopics).toBeDefined();
      expect(report.marketSentiment).toBeCloseTo(0.7, 1);
      expect(report.recommendations).toBeDefined();
    });

    it('should extract themes from articles correctly', async () => {
      const mockArticles = [
        {
          id: 'article-1',
          title: 'Company announces massive layoffs',
          summary: 'Workforce reduction affects thousands',
          categories: ['technology'],
          tags: ['layoffs'],
          sentiment: -0.8,
          published_at: '2024-01-01',
          relevance_score: 0.9
        },
        {
          id: 'article-2',
          title: 'Startup raises Series A funding',
          summary: 'Successful investment round completed',
          categories: ['technology'],
          tags: ['funding'],
          sentiment: 0.7,
          published_at: '2024-01-01',
          relevance_score: 0.8
        }
      ];

      const mockSupabase = await import('../../lib/supabase');
      mockSupabase.supabase.from().select().contains().gte().lte().order().limit().then
        .mockResolvedValueOnce({ data: mockArticles, error: null });
      mockSupabase.supabase.from().upsert().mockResolvedValue({ error: null });

      const report = await insightsAnalyzer.analyzeIndustryTrends('technology');

      expect(report.keyInsights.length).toBeGreaterThan(0);
      
      // Should detect both workforce reduction and funding themes
      const insightTypes = report.keyInsights.map(i => i.insightType);
      expect(insightTypes).toContain('risk'); // for layoffs
    });

    it('should identify trending topics', async () => {
      const mockArticles = [
        {
          id: 'article-1',
          title: 'AI Revolution in Healthcare',
          categories: ['technology', 'healthcare'],
          tags: ['ai', 'machine learning', 'healthcare'],
          sentiment: 0.8
        },
        {
          id: 'article-2',
          title: 'AI Startup Success',
          categories: ['technology'],
          tags: ['ai', 'startup', 'funding'],
          sentiment: 0.6
        },
        {
          id: 'article-3',
          title: 'Machine Learning Breakthrough',
          categories: ['technology'],
          tags: ['ai', 'machine learning', 'research'],
          sentiment: 0.9
        }
      ];

      const mockSupabase = await import('../../lib/supabase');
      mockSupabase.supabase.from().select().contains().gte().lte().order().limit().then
        .mockResolvedValueOnce({ data: mockArticles, error: null });
      mockSupabase.supabase.from().upsert().mockResolvedValue({ error: null });

      const report = await insightsAnalyzer.analyzeIndustryTrends('technology');

      expect(report.trendingTopics.length).toBeGreaterThan(0);
      
      // Should identify 'ai' as a trending topic (appears in all 3 articles)
      const aiTopic = report.trendingTopics.find(t => t.topic === 'ai');
      expect(aiTopic).toBeDefined();
      expect(aiTopic?.mentionCount).toBe(3);
    });

    it('should get insights for user based on preferences', async () => {
      const mockInsights = [
        {
          id: 'insight-1',
          industry: 'technology',
          insight_type: 'trend',
          title: 'AI Hiring Boom',
          description: 'Increased demand for AI engineers',
          impact_level: 'high',
          confidence_score: 0.9,
          source_articles: ['article-1'],
          data_points: {},
          geographic_scope: ['global'],
          affected_roles: ['engineer'],
          recommended_actions: ['Learn AI skills'],
          valid_from: '2024-01-01',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ];

      const mockSupabase = await import('../../lib/supabase');
      
      // Mock user preferences
      mockSupabase.supabase.from().select().eq().single.mockResolvedValueOnce({
        data: { industries: ['technology'] },
        error: null
      });

      // Mock insights
      mockSupabase.supabase.from().select().in().gte().order().limit().then
        .mockResolvedValueOnce({ data: mockInsights, error: null });

      const insights = await insightsAnalyzer.getInsightsForUser('test-user');

      expect(insights).toHaveLength(1);
      expect(insights[0].industry).toBe('technology');
      expect(insights[0].title).toBe('AI Hiring Boom');
    });

    it('should handle market sentiment calculation', async () => {
      const mockArticles = [
        { sentiment: 0.8 },
        { sentiment: -0.2 },
        { sentiment: 0.5 },
        { sentiment: undefined } // Should be filtered out
      ];

      const mockSupabase = await import('../../lib/supabase');
      mockSupabase.supabase.from().select().contains().gte().lte().order().limit().then
        .mockResolvedValueOnce({ data: mockArticles, error: null });
      mockSupabase.supabase.from().upsert().mockResolvedValue({ error: null });

      const report = await insightsAnalyzer.analyzeIndustryTrends('technology');

      // Should average the 3 defined sentiment values: (0.8 + (-0.2) + 0.5) / 3 = 0.367
      expect(report.marketSentiment).toBeCloseTo(0.37, 1);
    });
  });

  describe('Integration Tests', () => {
    it('should create complete news workflow', async () => {
      const mockSupabase = await import('../../lib/supabase');
      
      // Mock all necessary database responses
      mockSupabase.supabase.from().select().eq().then.mockResolvedValue({ data: [], error: null });
      mockSupabase.supabase.from().upsert().mockResolvedValue({ error: null });
      mockSupabase.supabase.from().update().eq().mockResolvedValue({ error: null });

      // Test aggregation
      await newsAggregator.loadSources();
      const aggregationStats = await newsAggregator.aggregateNews();
      expect(typeof aggregationStats.fetched).toBe('number');

      // Test personalization
      const preferences = await personalizedService.updatePreferences({
        categories: ['technology'],
        keywords: ['ai']
      });
      expect(preferences?.categories).toEqual(['technology']);

      // Test insights
      mockSupabase.supabase.from().select().contains().gte().lte().order().limit().then
        .mockResolvedValueOnce({ data: [], error: null });
      
      const report = await insightsAnalyzer.analyzeIndustryTrends('technology');
      expect(report.industry).toBe('technology');
    });

    it('should handle database errors gracefully', async () => {
      const mockSupabase = await import('../../lib/supabase');
      mockSupabase.supabase.from().select().eq().then.mockRejectedValue(new Error('DB Error'));

      const preferences = await personalizedService.getPreferences();
      expect(preferences).toBeNull();

      const articles = await newsAggregator.searchArticles('test');
      expect(articles).toEqual([]);
    });
  });
});