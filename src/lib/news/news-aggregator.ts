// News aggregation service for fetching and processing news from various sources
import { supabase } from '../supabase';

export interface NewsSource {
  id: string;
  name: string;
  url: string;
  feedUrl?: string;
  sourceType: 'rss' | 'api' | 'scraper' | 'newsletter';
  category: string[];
  reliabilityScore: number;
  isActive: boolean;
  lastFetched?: string;
  fetchFrequencyMinutes: number;
  metadata: Record<string, any>;
}

export interface NewsArticle {
  id: string;
  sourceId: string;
  externalId?: string;
  title: string;
  summary?: string;
  content?: string;
  author?: string;
  publishedAt?: string;
  url: string;
  imageUrl?: string;
  categories: string[];
  tags: string[];
  sentiment?: number;
  relevanceScore?: number;
  engagementMetrics?: {
    views?: number;
    shares?: number;
    comments?: number;
    likes?: number;
  };
  aiSummary?: string;
  aiKeyPoints?: string[];
  aiActionItems?: string[];
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface FeedParser {
  parse(feedUrl: string): Promise<ParsedArticle[]>;
}

export interface ParsedArticle {
  title: string;
  summary?: string;
  content?: string;
  author?: string;
  publishedAt?: string;
  url: string;
  imageUrl?: string;
  categories?: string[];
  tags?: string[];
}

export class NewsAggregator {
  private sources: Map<string, NewsSource> = new Map();
  private parsers: Map<string, FeedParser> = new Map();
  private fetchQueue: Set<string> = new Set();
  private isAggregating = false;

  constructor() {
    this.initializeParsers();
  }

  private initializeParsers(): void {
    // Initialize different parsers for different source types
    this.parsers.set('rss', new RSSFeedParser());
    this.parsers.set('api', new APIFeedParser());
  }

  public async loadSources(): Promise<void> {
    const { data: sources, error } = await supabase
      .from('news_sources')
      .select('*')
      .eq('is_active', true);

    if (error) {
      console.error('Failed to load news sources:', error);
      return;
    }

    sources?.forEach(source => {
      this.sources.set(source.id, this.mapSource(source));
    });
  }

  private mapSource(dbSource: any): NewsSource {
    return {
      id: dbSource.id,
      name: dbSource.name,
      url: dbSource.url,
      feedUrl: dbSource.feed_url,
      sourceType: dbSource.source_type,
      category: dbSource.category,
      reliabilityScore: parseFloat(dbSource.reliability_score),
      isActive: dbSource.is_active,
      lastFetched: dbSource.last_fetched,
      fetchFrequencyMinutes: dbSource.fetch_frequency_minutes,
      metadata: dbSource.metadata
    };
  }

  public async aggregateNews(): Promise<{ fetched: number; errors: string[] }> {
    if (this.isAggregating) {
      return { fetched: 0, errors: ['Aggregation already in progress'] };
    }

    this.isAggregating = true;
    const stats = { fetched: 0, errors: [] as string[] };

    try {
      await this.loadSources();

      for (const [sourceId, source] of this.sources) {
        if (this.shouldFetchSource(source)) {
          try {
            const articles = await this.fetchFromSource(source);
            const saved = await this.saveArticles(sourceId, articles);
            stats.fetched += saved;
            
            // Update last fetched time
            await this.updateSourceFetchTime(sourceId);
          } catch (error) {
            stats.errors.push(`Failed to fetch from ${source.name}: ${error.message}`);
          }
        }
      }
    } finally {
      this.isAggregating = false;
    }

    return stats;
  }

  private shouldFetchSource(source: NewsSource): boolean {
    if (!source.isActive) return false;
    if (!source.lastFetched) return true;

    const lastFetched = new Date(source.lastFetched);
    const now = new Date();
    const minutesSinceLastFetch = (now.getTime() - lastFetched.getTime()) / 60000;

    return minutesSinceLastFetch >= source.fetchFrequencyMinutes;
  }

  private async fetchFromSource(source: NewsSource): Promise<ParsedArticle[]> {
    const parser = this.parsers.get(source.sourceType);
    if (!parser) {
      throw new Error(`No parser available for source type: ${source.sourceType}`);
    }

    const feedUrl = source.feedUrl || source.url;
    return await parser.parse(feedUrl);
  }

  private async saveArticles(sourceId: string, articles: ParsedArticle[]): Promise<number> {
    let saved = 0;

    for (const article of articles) {
      try {
        const newsArticle = await this.processArticle(sourceId, article);
        
        const { error } = await supabase
          .from('news_articles')
          .upsert({
            source_id: sourceId,
            external_id: this.generateExternalId(article.url),
            title: newsArticle.title,
            summary: newsArticle.summary,
            content: newsArticle.content,
            author: newsArticle.author,
            published_at: newsArticle.publishedAt,
            url: newsArticle.url,
            image_url: newsArticle.imageUrl,
            categories: newsArticle.categories,
            tags: newsArticle.tags,
            sentiment: newsArticle.sentiment,
            relevance_score: newsArticle.relevanceScore,
            metadata: newsArticle.metadata
          }, {
            onConflict: 'source_id,external_id'
          });

        if (!error) saved++;
      } catch (error) {
        console.error(`Failed to save article: ${article.title}`, error);
      }
    }

    return saved;
  }

  private async processArticle(sourceId: string, article: ParsedArticle): Promise<Partial<NewsArticle>> {
    const source = this.sources.get(sourceId);
    
    return {
      sourceId,
      title: article.title,
      summary: article.summary || this.generateSummary(article.content),
      content: article.content,
      author: article.author,
      publishedAt: article.publishedAt || new Date().toISOString(),
      url: article.url,
      imageUrl: article.imageUrl,
      categories: this.mergeCategories(source?.category || [], article.categories || []),
      tags: await this.extractTags(article),
      sentiment: await this.analyzeSentiment(article),
      relevanceScore: 0.5, // Base relevance, will be updated based on user interactions
      metadata: {
        source: source?.name,
        originalCategories: article.categories
      }
    };
  }

  private generateSummary(content?: string): string {
    if (!content) return '';
    
    // Simple summary: first 200 characters
    const cleaned = content.replace(/<[^>]*>/g, '').trim();
    return cleaned.length > 200 ? cleaned.substring(0, 197) + '...' : cleaned;
  }

  private mergeCategories(sourceCategories: string[], articleCategories: string[]): string[] {
    return [...new Set([...sourceCategories, ...articleCategories])];
  }

  private async extractTags(article: ParsedArticle): Promise<string[]> {
    const tags = new Set<string>();
    
    // Extract from existing tags
    article.tags?.forEach(tag => tags.add(tag.toLowerCase()));
    
    // Extract common tech/business keywords
    const keywords = [
      'ai', 'machine learning', 'blockchain', 'cloud', 'cybersecurity',
      'startup', 'funding', 'ipo', 'acquisition', 'layoffs',
      'remote work', 'hybrid', 'career', 'hiring', 'interview'
    ];
    
    const text = `${article.title} ${article.summary || ''} ${article.content || ''}`.toLowerCase();
    
    keywords.forEach(keyword => {
      if (text.includes(keyword)) {
        tags.add(keyword);
      }
    });
    
    return Array.from(tags);
  }

  private async analyzeSentiment(article: ParsedArticle): Promise<number> {
    // Simple sentiment analysis based on keywords
    const positiveWords = ['success', 'growth', 'innovation', 'breakthrough', 'opportunity', 'rising', 'profit'];
    const negativeWords = ['layoff', 'decline', 'loss', 'risk', 'threat', 'falling', 'crisis'];
    
    const text = `${article.title} ${article.summary || ''}`.toLowerCase();
    
    let sentiment = 0;
    positiveWords.forEach(word => {
      if (text.includes(word)) sentiment += 0.2;
    });
    
    negativeWords.forEach(word => {
      if (text.includes(word)) sentiment -= 0.2;
    });
    
    return Math.max(-1, Math.min(1, sentiment));
  }

  private generateExternalId(url: string): string {
    // Generate a unique ID from the URL
    return Buffer.from(url).toString('base64').substring(0, 32);
  }

  private async updateSourceFetchTime(sourceId: string): Promise<void> {
    await supabase
      .from('news_sources')
      .update({ last_fetched: new Date().toISOString() })
      .eq('id', sourceId);
    
    const source = this.sources.get(sourceId);
    if (source) {
      source.lastFetched = new Date().toISOString();
    }
  }

  public async searchArticles(query: string, filters?: {
    categories?: string[];
    dateFrom?: string;
    dateTo?: string;
    sources?: string[];
    minRelevance?: number;
  }): Promise<NewsArticle[]> {
    let queryBuilder = supabase
      .from('news_articles')
      .select('*')
      .or(`title.ilike.%${query}%,summary.ilike.%${query}%,content.ilike.%${query}%`);

    if (filters?.categories?.length) {
      queryBuilder = queryBuilder.contains('categories', filters.categories);
    }

    if (filters?.dateFrom) {
      queryBuilder = queryBuilder.gte('published_at', filters.dateFrom);
    }

    if (filters?.dateTo) {
      queryBuilder = queryBuilder.lte('published_at', filters.dateTo);
    }

    if (filters?.sources?.length) {
      queryBuilder = queryBuilder.in('source_id', filters.sources);
    }

    if (filters?.minRelevance) {
      queryBuilder = queryBuilder.gte('relevance_score', filters.minRelevance);
    }

    const { data, error } = await queryBuilder
      .order('published_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Failed to search articles:', error);
      return [];
    }

    return data?.map(this.mapArticle) || [];
  }

  private mapArticle(dbArticle: any): NewsArticle {
    return {
      id: dbArticle.id,
      sourceId: dbArticle.source_id,
      externalId: dbArticle.external_id,
      title: dbArticle.title,
      summary: dbArticle.summary,
      content: dbArticle.content,
      author: dbArticle.author,
      publishedAt: dbArticle.published_at,
      url: dbArticle.url,
      imageUrl: dbArticle.image_url,
      categories: dbArticle.categories,
      tags: dbArticle.tags,
      sentiment: dbArticle.sentiment,
      relevanceScore: dbArticle.relevance_score,
      engagementMetrics: dbArticle.engagement_metrics,
      aiSummary: dbArticle.ai_summary,
      aiKeyPoints: dbArticle.ai_key_points,
      aiActionItems: dbArticle.ai_action_items,
      metadata: dbArticle.metadata,
      createdAt: dbArticle.created_at,
      updatedAt: dbArticle.updated_at
    };
  }
}

// RSS Feed Parser Implementation
class RSSFeedParser implements FeedParser {
  public async parse(feedUrl: string): Promise<ParsedArticle[]> {
    try {
      const response = await fetch(feedUrl);
      const text = await response.text();
      
      // Parse RSS/XML
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/xml');
      
      const items = doc.querySelectorAll('item, entry');
      const articles: ParsedArticle[] = [];
      
      items.forEach(item => {
        const article: ParsedArticle = {
          title: this.getElementText(item, 'title'),
          summary: this.getElementText(item, 'description, summary'),
          content: this.getElementText(item, 'content:encoded, content'),
          author: this.getElementText(item, 'author, dc:creator'),
          publishedAt: this.getElementText(item, 'pubDate, published'),
          url: this.getElementText(item, 'link') || this.getElementAttribute(item, 'link', 'href'),
          categories: this.getElementTexts(item, 'category'),
        };
        
        // Extract image
        const enclosure = item.querySelector('enclosure[type^="image"]');
        if (enclosure) {
          article.imageUrl = enclosure.getAttribute('url') || undefined;
        }
        
        articles.push(article);
      });
      
      return articles;
    } catch (error) {
      console.error('Failed to parse RSS feed:', error);
      return [];
    }
  }

  private getElementText(parent: Element, selectors: string): string {
    const element = parent.querySelector(selectors);
    return element?.textContent?.trim() || '';
  }

  private getElementAttribute(parent: Element, selector: string, attribute: string): string {
    const element = parent.querySelector(selector);
    return element?.getAttribute(attribute) || '';
  }

  private getElementTexts(parent: Element, selector: string): string[] {
    const elements = parent.querySelectorAll(selector);
    return Array.from(elements).map(el => el.textContent?.trim() || '').filter(Boolean);
  }
}

// API Feed Parser Implementation (mock for now)
class APIFeedParser implements FeedParser {
  public async parse(feedUrl: string): Promise<ParsedArticle[]> {
    // This would integrate with specific news APIs
    // For now, return mock data
    return [];
  }
}

export default NewsAggregator;