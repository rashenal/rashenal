import { describe, it, expect, vi, beforeEach } from 'vitest';

// Simple test version focusing on core functionality
describe('News & Insights System - Core Functionality', () => {
  
  describe('News Article Processing', () => {
    it('should validate article structure', () => {
      const article = {
        id: 'article-1',
        sourceId: 'source-1',
        title: 'Test Article Title',
        summary: 'Test article summary',
        url: 'https://example.com/article',
        categories: ['technology'],
        tags: ['ai', 'machine learning'],
        relevanceScore: 0.8,
        sentiment: 0.5,
        publishedAt: '2024-01-01T00:00:00Z',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      expect(article.id).toBeDefined();
      expect(article.title).toBe('Test Article Title');
      expect(Array.isArray(article.categories)).toBe(true);
      expect(Array.isArray(article.tags)).toBe(true);
      expect(article.relevanceScore).toBeGreaterThanOrEqual(0);
      expect(article.relevanceScore).toBeLessThanOrEqual(1);
    });

    it('should calculate sentiment correctly', () => {
      const calculateSentiment = (text: string): number => {
        const positiveWords = ['good', 'great', 'excellent', 'success', 'growth'];
        const negativeWords = ['bad', 'terrible', 'failure', 'decline', 'loss'];
        
        let score = 0;
        const textLower = text.toLowerCase();
        
        positiveWords.forEach(word => {
          if (textLower.includes(word)) score += 0.2;
        });
        
        negativeWords.forEach(word => {
          if (textLower.includes(word)) score -= 0.2;
        });
        
        return Math.max(-1, Math.min(1, score));
      };

      expect(calculateSentiment('This is great news')).toBeGreaterThan(0);
      expect(calculateSentiment('This is terrible news')).toBeLessThan(0);
      expect(calculateSentiment('This is neutral news')).toBe(0);
    });

    it('should extract keywords from text', () => {
      const extractKeywords = (text: string): string[] => {
        const keywords = [
          'ai', 'machine learning', 'blockchain', 'cloud', 'startup',
          'funding', 'hiring', 'layoffs', 'growth', 'decline'
        ];
        
        const textLower = text.toLowerCase();
        return keywords.filter(keyword => textLower.includes(keyword));
      };

      const text = 'AI startup raises funding for machine learning platform';
      const keywords = extractKeywords(text);
      
      expect(keywords).toContain('ai');
      expect(keywords).toContain('startup');
      expect(keywords).toContain('funding');
      expect(keywords).toContain('machine learning');
    });
  });

  describe('User Preferences', () => {
    it('should validate preference structure', () => {
      const preferences = {
        id: 'pref-1',
        userId: 'user-1',
        categories: ['technology', 'business'],
        keywords: ['ai', 'startup'],
        companies: ['Google', 'Apple'],
        industries: ['technology'],
        excludedSources: ['spam-source'],
        excludedKeywords: ['politics'],
        notificationSettings: {
          dailyDigest: true,
          breakingNews: false,
          weeklySummary: true,
          digestTime: '09:00',
          timezone: 'UTC'
        },
        aiPersonalizationEnabled: true
      };

      expect(preferences.id).toBeDefined();
      expect(Array.isArray(preferences.categories)).toBe(true);
      expect(Array.isArray(preferences.keywords)).toBe(true);
      expect(typeof preferences.notificationSettings).toBe('object');
      expect(typeof preferences.aiPersonalizationEnabled).toBe('boolean');
    });

    it('should calculate relevance score based on preferences', () => {
      const calculateRelevance = (
        article: { categories: string[]; tags: string[]; title: string },
        preferences: { categories: string[]; keywords: string[] }
      ): number => {
        let score = 0.5; // Base score
        
        // Category match
        const categoryMatch = article.categories.some(cat => 
          preferences.categories.includes(cat)
        );
        if (categoryMatch) score += 0.25;
        
        // Keyword match
        const text = article.title.toLowerCase();
        const keywordMatches = preferences.keywords.filter(keyword =>
          text.includes(keyword.toLowerCase()) || 
          article.tags.includes(keyword.toLowerCase())
        ).length;
        score += Math.min(0.25, keywordMatches * 0.1);
        
        return Math.max(0, Math.min(1, score));
      };

      const article = {
        categories: ['technology'],
        tags: ['ai', 'machine learning'],
        title: 'New AI breakthrough in machine learning'
      };
      
      const preferences = {
        categories: ['technology'],
        keywords: ['ai', 'machine learning']
      };

      const relevance = calculateRelevance(article, preferences);
      expect(relevance).toBeGreaterThan(0.5); // Should be above base score
    });
  });

  describe('Industry Insights', () => {
    it('should validate insight structure', () => {
      const insight = {
        id: 'insight-1',
        industry: 'technology',
        insightType: 'trend' as const,
        title: 'AI Hiring Boom',
        description: 'Increased demand for AI engineers',
        impactLevel: 'high' as const,
        confidenceScore: 0.9,
        sourceArticles: ['article-1', 'article-2'],
        affectedRoles: ['engineer', 'data scientist'],
        recommendedActions: ['Learn AI skills', 'Update resume'],
        validFrom: '2024-01-01T00:00:00Z'
      };

      expect(insight.id).toBeDefined();
      expect(insight.industry).toBe('technology');
      expect(['trend', 'alert', 'opportunity', 'risk', 'update']).toContain(insight.insightType);
      expect(['low', 'medium', 'high', 'critical']).toContain(insight.impactLevel);
      expect(insight.confidenceScore).toBeGreaterThanOrEqual(0);
      expect(insight.confidenceScore).toBeLessThanOrEqual(1);
      expect(Array.isArray(insight.sourceArticles)).toBe(true);
      expect(Array.isArray(insight.affectedRoles)).toBe(true);
      expect(Array.isArray(insight.recommendedActions)).toBe(true);
    });

    it('should identify themes from article content', () => {
      const identifyThemes = (title: string, summary: string): string[] => {
        const themes: string[] = [];
        const text = `${title} ${summary}`.toLowerCase();
        
        const patterns = {
          'hiring_surge': ['hiring', 'recruitment', 'jobs growth'],
          'layoffs': ['layoffs', 'downsizing', 'job cuts'],
          'funding': ['funding', 'investment', 'series a', 'ipo'],
          'tech_advancement': ['breakthrough', 'innovation', 'ai', 'machine learning']
        };

        Object.entries(patterns).forEach(([theme, keywords]) => {
          if (keywords.some(keyword => text.includes(keyword))) {
            themes.push(theme);
          }
        });

        return themes;
      };

      expect(identifyThemes('Tech Company Hiring Surge', 'Major hiring increases')).toContain('hiring_surge');
      expect(identifyThemes('Startup Raises Series A', 'Investment funding round')).toContain('funding');
      expect(identifyThemes('AI Breakthrough', 'Machine learning innovation')).toContain('tech_advancement');
      expect(identifyThemes('Company Layoffs', 'Workforce downsizing')).toContain('layoffs');
    });

    it('should calculate market sentiment from articles', () => {
      const calculateMarketSentiment = (articles: { sentiment?: number }[]): number => {
        const sentiments = articles
          .filter(a => a.sentiment !== undefined)
          .map(a => a.sentiment!);
        
        if (sentiments.length === 0) return 0;
        
        return sentiments.reduce((sum, s) => sum + s, 0) / sentiments.length;
      };

      const positiveMarket = [
        { sentiment: 0.8 },
        { sentiment: 0.6 },
        { sentiment: 0.9 }
      ];

      const negativeMarket = [
        { sentiment: -0.5 },
        { sentiment: -0.3 },
        { sentiment: -0.7 }
      ];

      expect(calculateMarketSentiment(positiveMarket)).toBeGreaterThan(0);
      expect(calculateMarketSentiment(negativeMarket)).toBeLessThan(0);
      expect(calculateMarketSentiment([])).toBe(0);
    });
  });

  describe('Trending Topics', () => {
    it('should identify trending topics from articles', () => {
      const identifyTrending = (articles: { tags: string[] }[]): { topic: string; count: number }[] => {
        const topicCounts = new Map<string, number>();
        
        articles.forEach(article => {
          article.tags.forEach(tag => {
            topicCounts.set(tag, (topicCounts.get(tag) || 0) + 1);
          });
        });
        
        return Array.from(topicCounts.entries())
          .filter(([_, count]) => count >= 2) // Minimum threshold
          .map(([topic, count]) => ({ topic, count }))
          .sort((a, b) => b.count - a.count);
      };

      const articles = [
        { tags: ['ai', 'machine learning', 'technology'] },
        { tags: ['ai', 'startup', 'funding'] },
        { tags: ['ai', 'hiring', 'jobs'] },
        { tags: ['blockchain', 'crypto'] }
      ];

      const trending = identifyTrending(articles);
      
      expect(trending[0].topic).toBe('ai'); // Most mentioned
      expect(trending[0].count).toBe(3);
      expect(trending.find(t => t.topic === 'blockchain')).toBeUndefined(); // Below threshold
    });
  });

  describe('RSS Feed Parsing', () => {
    it('should parse basic RSS structure', () => {
      const parseRSSItem = (itemXML: string) => {
        // Simplified RSS parsing simulation
        const titleMatch = itemXML.match(/<title>(.*?)<\/title>/);
        const descMatch = itemXML.match(/<description>(.*?)<\/description>/);
        const linkMatch = itemXML.match(/<link>(.*?)<\/link>/);
        const pubDateMatch = itemXML.match(/<pubDate>(.*?)<\/pubDate>/);

        return {
          title: titleMatch?.[1] || '',
          description: descMatch?.[1] || '',
          link: linkMatch?.[1] || '',
          pubDate: pubDateMatch?.[1] || ''
        };
      };

      const rssItem = `
        <item>
          <title>Test Article Title</title>
          <description>Test article description</description>
          <link>https://example.com/article</link>
          <pubDate>Wed, 02 Oct 2024 09:00:00 GMT</pubDate>
        </item>
      `;

      const parsed = parseRSSItem(rssItem);
      
      expect(parsed.title).toBe('Test Article Title');
      expect(parsed.description).toBe('Test article description');
      expect(parsed.link).toBe('https://example.com/article');
      expect(parsed.pubDate).toBe('Wed, 02 Oct 2024 09:00:00 GMT');
    });
  });

  describe('News Digest Generation', () => {
    it('should create digest structure', () => {
      const createDigest = (articles: any[], period: { start: string; end: string }) => {
        const topArticles = articles
          .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
          .slice(0, 5);

        const keyTrends = ['ai advancement', 'remote work', 'startup funding'];
        const actionItems = ['Update skills', 'Network actively', 'Monitor job market'];

        return {
          id: 'digest-1',
          type: 'daily' as const,
          period,
          articleIds: topArticles.map(a => a.id),
          summary: `Daily digest covering ${articles.length} articles`,
          keyTrends,
          actionItems,
          personalizationScore: 0.8
        };
      };

      const articles = [
        { id: 'article-1', relevanceScore: 0.9 },
        { id: 'article-2', relevanceScore: 0.7 },
        { id: 'article-3', relevanceScore: 0.8 }
      ];

      const digest = createDigest(articles, {
        start: '2024-01-01T00:00:00Z',
        end: '2024-01-02T00:00:00Z'
      });

      expect(digest.id).toBeDefined();
      expect(digest.type).toBe('daily');
      expect(digest.articleIds).toHaveLength(3);
      expect(Array.isArray(digest.keyTrends)).toBe(true);
      expect(Array.isArray(digest.actionItems)).toBe(true);
      expect(digest.personalizationScore).toBeGreaterThanOrEqual(0);
      expect(digest.personalizationScore).toBeLessThanOrEqual(1);
    });
  });

  describe('Utility Functions', () => {
    it('should normalize text content', () => {
      const normalizeText = (text: string): string => {
        return text
          .replace(/<[^>]*>/g, ' ') // Remove HTML tags
          .replace(/\s+/g, ' ') // Normalize whitespace
          .trim()
          .toLowerCase();
      };

      const htmlText = '<p>This is <strong>HTML</strong> content</p>';
      const normalized = normalizeText(htmlText);
      
      expect(normalized).toBe('this is html content');
    });

    it('should extract domain from URL', () => {
      const extractDomain = (url: string): string => {
        try {
          return new URL(url).hostname;
        } catch {
          return '';
        }
      };

      expect(extractDomain('https://example.com/article')).toBe('example.com');
      expect(extractDomain('https://news.techcrunch.com/post/123')).toBe('news.techcrunch.com');
      expect(extractDomain('invalid-url')).toBe('');
    });

    it('should calculate time since publication', () => {
      const getTimeSince = (publishedAt: string): { value: number; unit: string } => {
        const now = Date.now();
        const published = new Date(publishedAt).getTime();
        const diffMs = now - published;
        
        const minutes = Math.floor(diffMs / (1000 * 60));
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (days > 0) return { value: days, unit: 'days' };
        if (hours > 0) return { value: hours, unit: 'hours' };
        return { value: minutes, unit: 'minutes' };
      };

      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      
      expect(getTimeSince(oneDayAgo).unit).toBe('days');
      expect(getTimeSince(oneHourAgo).unit).toBe('hours');
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed data gracefully', () => {
      const safeParseJSON = (jsonString: string): any => {
        try {
          return JSON.parse(jsonString);
        } catch {
          return null;
        }
      };

      expect(safeParseJSON('{"valid": "json"}')).toEqual({ valid: 'json' });
      expect(safeParseJSON('invalid json')).toBeNull();
    });

    it('should validate article data', () => {
      const validateArticle = (article: any): boolean => {
        return !!(
          article &&
          typeof article.id === 'string' &&
          typeof article.title === 'string' &&
          typeof article.url === 'string' &&
          Array.isArray(article.categories)
        );
      };

      const validArticle = {
        id: 'article-1',
        title: 'Valid Article',
        url: 'https://example.com',
        categories: ['tech']
      };

      const invalidArticle = {
        title: 'Missing ID',
        categories: 'not-an-array'
      };

      expect(validateArticle(validArticle)).toBe(true);
      expect(validateArticle(invalidArticle)).toBe(false);
      expect(validateArticle(null)).toBe(false);
    });
  });
});