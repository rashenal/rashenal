// Personalized news service for delivering curated content to users
import { supabase } from '../supabase';
import type { NewsArticle } from './news-aggregator';

export interface UserNewsPreferences {
  id: string;
  userId: string;
  categories: string[];
  keywords: string[];
  companies: string[];
  industries: string[];
  excludedSources: string[];
  excludedKeywords: string[];
  notificationSettings: {
    dailyDigest: boolean;
    breakingNews: boolean;
    weeklySummary: boolean;
    digestTime: string;
    timezone: string;
  };
  readingHistoryRetentionDays: number;
  aiPersonalizationEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NewsInteraction {
  id: string;
  userId: string;
  articleId: string;
  action: 'viewed' | 'clicked' | 'saved' | 'shared' | 'hidden' | 'reported';
  readingTimeSeconds?: number;
  scrollDepth?: number;
  feedback?: 'helpful' | 'not_helpful' | 'irrelevant';
  notes?: string;
  createdAt: string;
}

export interface SavedArticle {
  id: string;
  userId: string;
  articleId: string;
  folder: string;
  tags: string[];
  notes?: string;
  priority: number;
  isArchived: boolean;
  reminderDate?: string;
  createdAt: string;
  updatedAt: string;
  article?: NewsArticle;
}

export interface PersonalizedFeed {
  articles: NewsArticle[];
  totalCount: number;
  relevanceScores: { [articleId: string]: number };
  recommendations: {
    trending: NewsArticle[];
    forYou: NewsArticle[];
    breaking: NewsArticle[];
    industry: NewsArticle[];
  };
}

export interface NewsDigest {
  id: string;
  userId: string;
  digestType: 'daily' | 'weekly' | 'monthly' | 'custom';
  periodStart: string;
  periodEnd: string;
  articleIds: string[];
  insightIds: string[];
  summary: string;
  keyTrends: string[];
  actionItems: string[];
  personalizationScore: number;
  wasSent: boolean;
  sentAt?: string;
  wasRead: boolean;
  readAt?: string;
  userFeedback?: 'excellent' | 'good' | 'fair' | 'poor';
  metadata: Record<string, any>;
  createdAt: string;
}

export class PersonalizedNewsService {
  constructor(private userId: string) {}

  // User Preferences Management
  public async getPreferences(): Promise<UserNewsPreferences | null> {
    const { data, error } = await supabase
      .from('user_news_preferences')
      .select('*')
      .eq('user_id', this.userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No preferences found
      console.error('Failed to get user preferences:', error);
      return null;
    }

    return this.mapPreferences(data);
  }

  public async updatePreferences(preferences: Partial<UserNewsPreferences>): Promise<UserNewsPreferences | null> {
    const existing = await this.getPreferences();
    
    const updateData = {
      user_id: this.userId,
      categories: preferences.categories || existing?.categories || [],
      keywords: preferences.keywords || existing?.keywords || [],
      companies: preferences.companies || existing?.companies || [],
      industries: preferences.industries || existing?.industries || [],
      excluded_sources: preferences.excludedSources || existing?.excludedSources || [],
      excluded_keywords: preferences.excludedKeywords || existing?.excludedKeywords || [],
      notification_settings: preferences.notificationSettings || existing?.notificationSettings || {
        dailyDigest: true,
        breakingNews: false,
        weeklySummary: true,
        digestTime: '09:00',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      reading_history_retention_days: preferences.readingHistoryRetentionDays || existing?.readingHistoryRetentionDays || 30,
      ai_personalization_enabled: preferences.aiPersonalizationEnabled ?? existing?.aiPersonalizationEnabled ?? true
    };

    const { data, error } = await supabase
      .from('user_news_preferences')
      .upsert(updateData, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      console.error('Failed to update preferences:', error);
      return null;
    }

    return this.mapPreferences(data);
  }

  private mapPreferences(data: any): UserNewsPreferences {
    return {
      id: data.id,
      userId: data.user_id,
      categories: data.categories,
      keywords: data.keywords,
      companies: data.companies,
      industries: data.industries,
      excludedSources: data.excluded_sources,
      excludedKeywords: data.excluded_keywords,
      notificationSettings: data.notification_settings,
      readingHistoryRetentionDays: data.reading_history_retention_days,
      aiPersonalizationEnabled: data.ai_personalization_enabled,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  // Personalized Feed Generation
  public async getPersonalizedFeed(limit: number = 20, offset: number = 0): Promise<PersonalizedFeed> {
    const preferences = await this.getPreferences();
    
    let query = supabase
      .from('news_articles')
      .select('*')
      .order('published_at', { ascending: false });

    // Apply user preferences
    if (preferences) {
      if (preferences.categories.length > 0) {
        query = query.contains('categories', preferences.categories);
      }

      if (preferences.excludedSources.length > 0) {
        query = query.not('source_id', 'in', `(${preferences.excludedSources.join(',')})`);
      }

      // Filter out articles with excluded keywords
      if (preferences.excludedKeywords.length > 0) {
        const excludePattern = preferences.excludedKeywords.join('|');
        query = query.not('title', 'ilike', `%${excludePattern}%`);
      }
    }

    const { data: articles, error, count } = await query
      .range(offset, offset + limit - 1)
      .limit(limit);

    if (error) {
      console.error('Failed to get personalized feed:', error);
      return { articles: [], totalCount: 0, relevanceScores: {}, recommendations: { trending: [], forYou: [], breaking: [], industry: [] } };
    }

    const newsArticles = articles?.map(this.mapArticle) || [];

    // Calculate relevance scores
    const relevanceScores = await this.calculateRelevanceScores(newsArticles, preferences);

    // Sort by relevance
    const sortedArticles = newsArticles
      .map(article => ({ article, score: relevanceScores[article.id] || 0 }))
      .sort((a, b) => b.score - a.score)
      .map(item => item.article);

    // Get recommendations
    const recommendations = await this.getRecommendations(preferences);

    return {
      articles: sortedArticles,
      totalCount: count || 0,
      relevanceScores,
      recommendations
    };
  }

  private async calculateRelevanceScores(
    articles: NewsArticle[], 
    preferences: UserNewsPreferences | null
  ): Promise<{ [articleId: string]: number }> {
    const scores: { [articleId: string]: number } = {};

    if (!preferences) {
      // Default scoring without personalization
      articles.forEach(article => {
        scores[article.id] = article.relevanceScore || 0.5;
      });
      return scores;
    }

    // Get user interaction history for learning
    const { data: interactions } = await supabase
      .from('news_interactions')
      .select('article_id, action, reading_time_seconds, feedback')
      .eq('user_id', this.userId)
      .gte('created_at', new Date(Date.now() - preferences.readingHistoryRetentionDays * 24 * 60 * 60 * 1000).toISOString());

    const userBehavior = this.analyzeUserBehavior(interactions || []);

    for (const article of articles) {
      let score = 0.5; // Base score

      // Category preference scoring
      if (preferences.categories.length > 0) {
        const categoryMatch = article.categories.some(cat => preferences.categories.includes(cat));
        if (categoryMatch) score += 0.25;
      }

      // Keyword preference scoring
      if (preferences.keywords.length > 0) {
        const text = `${article.title} ${article.summary || ''}`.toLowerCase();
        const keywordMatches = preferences.keywords.filter(keyword => 
          text.includes(keyword.toLowerCase())
        ).length;
        score += Math.min(0.3, keywordMatches * 0.1);
      }

      // Company/Industry interest scoring
      const text = `${article.title} ${article.summary || ''}`.toLowerCase();
      
      if (preferences.companies.length > 0) {
        const companyMatches = preferences.companies.filter(company =>
          text.includes(company.toLowerCase())
        ).length;
        score += Math.min(0.2, companyMatches * 0.1);
      }

      if (preferences.industries.length > 0) {
        const industryMatches = preferences.industries.filter(industry =>
          text.includes(industry.toLowerCase())
        ).length;
        score += Math.min(0.2, industryMatches * 0.1);
      }

      // Behavioral adjustment
      if (userBehavior.preferredCategories.some(cat => article.categories.includes(cat))) {
        score += 0.15;
      }

      // Recency boost
      const hoursOld = (Date.now() - new Date(article.publishedAt || article.createdAt).getTime()) / (1000 * 60 * 60);
      if (hoursOld < 24) score += 0.1;
      else if (hoursOld < 72) score += 0.05;

      // Sentiment adjustment based on user preferences
      if (article.sentiment && userBehavior.preferredSentiment !== null) {
        const sentimentDiff = Math.abs(article.sentiment - userBehavior.preferredSentiment);
        score += Math.max(0, 0.1 - sentimentDiff * 0.1);
      }

      scores[article.id] = Math.max(0, Math.min(1, score));
    }

    return scores;
  }

  private analyzeUserBehavior(interactions: any[]): {
    preferredCategories: string[];
    preferredSentiment: number | null;
    avgReadingTime: number;
  } {
    const categoryInteractions: { [category: string]: number } = {};
    const sentiments: number[] = [];
    const readingTimes: number[] = [];

    // This would be more sophisticated in a real implementation
    // For now, return basic analysis
    return {
      preferredCategories: ['technology', 'business'], // Mock preferred categories
      preferredSentiment: null,
      avgReadingTime: 120 // seconds
    };
  }

  private async getRecommendations(preferences: UserNewsPreferences | null): Promise<PersonalizedFeed['recommendations']> {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Trending articles (high engagement)
    const { data: trendingData } = await supabase
      .from('news_articles')
      .select('*')
      .gte('published_at', oneDayAgo.toISOString())
      .order('relevance_score', { ascending: false })
      .limit(5);

    // Breaking news (recent + high impact)
    const { data: breakingData } = await supabase
      .from('news_articles')
      .select('*')
      .gte('published_at', new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString()) // Last 6 hours
      .order('published_at', { ascending: false })
      .limit(5);

    // Industry-specific news
    const { data: industryData } = preferences?.industries.length ? await supabase
      .from('news_articles')
      .select('*')
      .contains('categories', preferences.industries)
      .gte('published_at', oneDayAgo.toISOString())
      .order('relevance_score', { ascending: false })
      .limit(5) : { data: [] };

    return {
      trending: trendingData?.map(this.mapArticle) || [],
      forYou: [], // Would be based on ML recommendations
      breaking: breakingData?.map(this.mapArticle) || [],
      industry: industryData?.map(this.mapArticle) || []
    };
  }

  // Article Interactions
  public async recordInteraction(
    articleId: string, 
    action: NewsInteraction['action'],
    options?: {
      readingTimeSeconds?: number;
      scrollDepth?: number;
      feedback?: NewsInteraction['feedback'];
      notes?: string;
    }
  ): Promise<boolean> {
    const { error } = await supabase
      .from('news_interactions')
      .upsert({
        user_id: this.userId,
        article_id: articleId,
        action,
        reading_time_seconds: options?.readingTimeSeconds,
        scroll_depth: options?.scrollDepth,
        feedback: options?.feedback,
        notes: options?.notes
      }, {
        onConflict: 'user_id,article_id,action'
      });

    if (error) {
      console.error('Failed to record interaction:', error);
      return false;
    }

    return true;
  }

  // Saved Articles Management
  public async saveArticle(
    articleId: string, 
    options?: {
      folder?: string;
      tags?: string[];
      notes?: string;
      priority?: number;
      reminderDate?: string;
    }
  ): Promise<SavedArticle | null> {
    const { data, error } = await supabase
      .from('saved_articles')
      .upsert({
        user_id: this.userId,
        article_id: articleId,
        folder: options?.folder || 'default',
        tags: options?.tags || [],
        notes: options?.notes,
        priority: options?.priority || 0,
        reminder_date: options?.reminderDate
      }, {
        onConflict: 'user_id,article_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to save article:', error);
      return null;
    }

    // Record the save interaction
    await this.recordInteraction(articleId, 'saved');

    return this.mapSavedArticle(data);
  }

  public async getSavedArticles(folder?: string): Promise<SavedArticle[]> {
    let query = supabase
      .from('saved_articles')
      .select(`
        *,
        article:news_articles(*)
      `)
      .eq('user_id', this.userId)
      .eq('is_archived', false)
      .order('created_at', { ascending: false });

    if (folder) {
      query = query.eq('folder', folder);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to get saved articles:', error);
      return [];
    }

    return data?.map(item => ({
      ...this.mapSavedArticle(item),
      article: item.article ? this.mapArticle(item.article) : undefined
    })) || [];
  }

  public async removeSavedArticle(articleId: string): Promise<boolean> {
    const { error } = await supabase
      .from('saved_articles')
      .delete()
      .eq('user_id', this.userId)
      .eq('article_id', articleId);

    if (error) {
      console.error('Failed to remove saved article:', error);
      return false;
    }

    return true;
  }

  // News Digests
  public async generateDailyDigest(): Promise<NewsDigest | null> {
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    
    // Check if digest already exists
    const { data: existingDigest } = await supabase
      .from('news_digests')
      .select('id')
      .eq('user_id', this.userId)
      .eq('digest_type', 'daily')
      .gte('period_start', yesterday.toISOString())
      .single();

    if (existingDigest) {
      return null; // Already generated
    }

    // Generate digest using database function
    const { data: digestId, error } = await supabase.rpc('generate_news_digest', {
      p_user_id: this.userId,
      p_digest_type: 'daily',
      p_period_start: yesterday.toISOString(),
      p_period_end: today.toISOString()
    });

    if (error) {
      console.error('Failed to generate daily digest:', error);
      return null;
    }

    // Get the generated digest
    const { data: digest } = await supabase
      .from('news_digests')
      .select('*')
      .eq('id', digestId)
      .single();

    return digest ? this.mapDigest(digest) : null;
  }

  public async getDigest(digestId: string): Promise<NewsDigest | null> {
    const { data, error } = await supabase
      .from('news_digests')
      .select('*')
      .eq('id', digestId)
      .eq('user_id', this.userId)
      .single();

    if (error) {
      console.error('Failed to get digest:', error);
      return null;
    }

    return this.mapDigest(data);
  }

  public async markDigestAsRead(digestId: string): Promise<boolean> {
    const { error } = await supabase
      .from('news_digests')
      .update({ 
        was_read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', digestId)
      .eq('user_id', this.userId);

    if (error) {
      console.error('Failed to mark digest as read:', error);
      return false;
    }

    return true;
  }

  private mapArticle(data: any): NewsArticle {
    return {
      id: data.id,
      sourceId: data.source_id,
      externalId: data.external_id,
      title: data.title,
      summary: data.summary,
      content: data.content,
      author: data.author,
      publishedAt: data.published_at,
      url: data.url,
      imageUrl: data.image_url,
      categories: data.categories || [],
      tags: data.tags || [],
      sentiment: data.sentiment,
      relevanceScore: data.relevance_score,
      engagementMetrics: data.engagement_metrics,
      aiSummary: data.ai_summary,
      aiKeyPoints: data.ai_key_points,
      aiActionItems: data.ai_action_items,
      metadata: data.metadata,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  private mapSavedArticle(data: any): SavedArticle {
    return {
      id: data.id,
      userId: data.user_id,
      articleId: data.article_id,
      folder: data.folder,
      tags: data.tags || [],
      notes: data.notes,
      priority: data.priority,
      isArchived: data.is_archived,
      reminderDate: data.reminder_date,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  private mapDigest(data: any): NewsDigest {
    return {
      id: data.id,
      userId: data.user_id,
      digestType: data.digest_type,
      periodStart: data.period_start,
      periodEnd: data.period_end,
      articleIds: data.article_ids || [],
      insightIds: data.insight_ids || [],
      summary: data.summary,
      keyTrends: data.key_trends || [],
      actionItems: data.action_items || [],
      personalizationScore: data.personalization_score,
      wasSent: data.was_sent,
      sentAt: data.sent_at,
      wasRead: data.was_read,
      readAt: data.read_at,
      userFeedback: data.user_feedback,
      metadata: data.metadata,
      createdAt: data.created_at
    };
  }
}

export default PersonalizedNewsService;