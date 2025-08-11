// Industry insights analyzer for detecting trends, opportunities, and risks
import { supabase } from '../supabase';
import type { NewsArticle } from './news-aggregator';

export interface IndustryInsight {
  id: string;
  industry: string;
  insightType: 'trend' | 'alert' | 'opportunity' | 'risk' | 'update';
  title: string;
  description: string;
  impactLevel: 'low' | 'medium' | 'high' | 'critical';
  confidenceScore: number;
  sourceArticles: string[];
  dataPoints: Record<string, any>;
  geographicScope: string[];
  affectedRoles: string[];
  recommendedActions: string[];
  validFrom: string;
  validUntil?: string;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface TrendingTopic {
  id: string;
  topic: string;
  category?: string;
  mentionCount: number;
  growthRate: number;
  sentimentAvg: number;
  geographicDistribution: Record<string, number>;
  relatedArticles: string[];
  peakTime?: string;
  trendingSince: string;
  trendingUntil?: string;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface IndustryReport {
  industry: string;
  period: {
    start: string;
    end: string;
  };
  keyInsights: IndustryInsight[];
  trendingTopics: TrendingTopic[];
  marketSentiment: number;
  jobMarketHealth: 'excellent' | 'good' | 'fair' | 'poor';
  hiringTrends: {
    direction: 'up' | 'down' | 'stable';
    hotSkills: string[];
    emergingRoles: string[];
    decliningRoles: string[];
  };
  salaryTrends: {
    avgChange: number;
    topPayingRoles: string[];
    fastestGrowing: string[];
  };
  recommendations: {
    forJobSeekers: string[];
    forCareerDevelopment: string[];
    forSkillDevelopment: string[];
  };
}

export class IndustryInsightsAnalyzer {
  private industries = [
    'technology', 'healthcare', 'finance', 'education', 'manufacturing',
    'retail', 'energy', 'real-estate', 'automotive', 'aerospace',
    'telecommunications', 'media', 'gaming', 'biotechnology', 'consulting'
  ];

  private insightPatterns = {
    hiring: {
      keywords: ['hiring', 'recruitment', 'jobs', 'layoffs', 'workforce', 'employment'],
      positive: ['hiring surge', 'job growth', 'expanding team', 'talent shortage'],
      negative: ['layoffs', 'downsizing', 'job cuts', 'workforce reduction']
    },
    funding: {
      keywords: ['funding', 'investment', 'ipo', 'acquisition', 'merger', 'series a', 'series b'],
      positive: ['raised funding', 'successful ipo', 'acquisition completed'],
      negative: ['funding dried up', 'failed ipo', 'acquisition cancelled']
    },
    technology: {
      keywords: ['ai', 'machine learning', 'blockchain', 'cloud', 'automation'],
      positive: ['breakthrough', 'innovation', 'adoption', 'advancement'],
      negative: ['obsolete', 'deprecated', 'security breach', 'failure']
    },
    market: {
      keywords: ['market', 'revenue', 'growth', 'profit', 'loss', 'valuation'],
      positive: ['revenue growth', 'profit increase', 'market expansion'],
      negative: ['revenue decline', 'losses', 'market contraction']
    }
  };

  public async analyzeIndustryTrends(industry: string, daysBack: number = 30): Promise<IndustryReport> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - daysBack * 24 * 60 * 60 * 1000);

    // Get relevant articles for the industry
    const articles = await this.getIndustryArticles(industry, startDate.toISOString(), endDate.toISOString());
    
    // Analyze articles for insights
    const insights = await this.extractInsights(industry, articles);
    const trendingTopics = await this.identifyTrendingTopics(industry, articles);
    
    // Calculate market health indicators
    const marketSentiment = this.calculateMarketSentiment(articles);
    const jobMarketHealth = this.assessJobMarketHealth(articles);
    const hiringTrends = this.analyzeHiringTrends(articles);
    const salaryTrends = this.analyzeSalaryTrends(articles);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(insights, trendingTopics);

    return {
      industry,
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      keyInsights: insights,
      trendingTopics,
      marketSentiment,
      jobMarketHealth,
      hiringTrends,
      salaryTrends,
      recommendations
    };
  }

  private async getIndustryArticles(industry: string, startDate: string, endDate: string): Promise<NewsArticle[]> {
    const { data, error } = await supabase
      .from('news_articles')
      .select('*')
      .contains('categories', [industry])
      .gte('published_at', startDate)
      .lte('published_at', endDate)
      .order('published_at', { ascending: false })
      .limit(200);

    if (error) {
      console.error('Failed to get industry articles:', error);
      return [];
    }

    return data?.map(this.mapArticle) || [];
  }

  private async extractInsights(industry: string, articles: NewsArticle[]): Promise<IndustryInsight[]> {
    const insights: IndustryInsight[] = [];
    const insightGroups = new Map<string, { articles: NewsArticle[]; confidence: number }>();

    // Group articles by similar themes
    for (const article of articles) {
      const themes = this.extractThemes(article);
      
      for (const theme of themes) {
        if (!insightGroups.has(theme)) {
          insightGroups.set(theme, { articles: [], confidence: 0 });
        }
        
        const group = insightGroups.get(theme)!;
        group.articles.push(article);
        group.confidence = Math.min(1.0, group.confidence + 0.1 * (article.relevanceScore || 0.5));
      }
    }

    // Generate insights from grouped themes
    for (const [theme, group] of insightGroups) {
      if (group.articles.length >= 3 && group.confidence > 0.6) { // Minimum threshold
        const insight = await this.createInsightFromTheme(industry, theme, group.articles, group.confidence);
        if (insight) {
          insights.push(insight);
        }
      }
    }

    // Save insights to database
    for (const insight of insights) {
      await this.saveInsight(insight);
    }

    return insights.sort((a, b) => b.confidenceScore - a.confidenceScore);
  }

  private extractThemes(article: NewsArticle): string[] {
    const themes: string[] = [];
    const text = `${article.title} ${article.summary || ''}`.toLowerCase();

    // Check for hiring patterns
    if (this.containsKeywords(text, this.insightPatterns.hiring.keywords)) {
      if (this.containsKeywords(text, this.insightPatterns.hiring.positive)) {
        themes.push('hiring_surge');
      } else if (this.containsKeywords(text, this.insightPatterns.hiring.negative)) {
        themes.push('workforce_reduction');
      } else {
        themes.push('hiring_activity');
      }
    }

    // Check for funding patterns
    if (this.containsKeywords(text, this.insightPatterns.funding.keywords)) {
      if (this.containsKeywords(text, this.insightPatterns.funding.positive)) {
        themes.push('funding_growth');
      } else if (this.containsKeywords(text, this.insightPatterns.funding.negative)) {
        themes.push('funding_challenges');
      } else {
        themes.push('funding_activity');
      }
    }

    // Check for technology patterns
    if (this.containsKeywords(text, this.insightPatterns.technology.keywords)) {
      if (this.containsKeywords(text, this.insightPatterns.technology.positive)) {
        themes.push('tech_advancement');
      } else if (this.containsKeywords(text, this.insightPatterns.technology.negative)) {
        themes.push('tech_challenges');
      } else {
        themes.push('tech_development');
      }
    }

    // Check for market patterns
    if (this.containsKeywords(text, this.insightPatterns.market.keywords)) {
      if (this.containsKeywords(text, this.insightPatterns.market.positive)) {
        themes.push('market_growth');
      } else if (this.containsKeywords(text, this.insightPatterns.market.negative)) {
        themes.push('market_decline');
      } else {
        themes.push('market_activity');
      }
    }

    return themes;
  }

  private containsKeywords(text: string, keywords: string[]): boolean {
    return keywords.some(keyword => text.includes(keyword));
  }

  private async createInsightFromTheme(
    industry: string, 
    theme: string, 
    articles: NewsArticle[], 
    confidence: number
  ): Promise<IndustryInsight | null> {
    const themeMap = {
      'hiring_surge': {
        type: 'opportunity' as const,
        title: `${industry.charAt(0).toUpperCase() + industry.slice(1)} Industry Seeing Increased Hiring`,
        impact: 'medium' as const
      },
      'workforce_reduction': {
        type: 'risk' as const,
        title: `${industry.charAt(0).toUpperCase() + industry.slice(1)} Industry Experiencing Layoffs`,
        impact: 'high' as const
      },
      'funding_growth': {
        type: 'trend' as const,
        title: `Investment Activity Rising in ${industry.charAt(0).toUpperCase() + industry.slice(1)}`,
        impact: 'medium' as const
      },
      'funding_challenges': {
        type: 'alert' as const,
        title: `Funding Challenges Emerging in ${industry.charAt(0).toUpperCase() + industry.slice(1)}`,
        impact: 'medium' as const
      },
      'tech_advancement': {
        type: 'opportunity' as const,
        title: `Technological Breakthroughs Driving ${industry.charAt(0).toUpperCase() + industry.slice(1)} Forward`,
        impact: 'high' as const
      },
      'market_growth': {
        type: 'trend' as const,
        title: `${industry.charAt(0).toUpperCase() + industry.slice(1)} Market Shows Strong Growth`,
        impact: 'medium' as const
      },
      'market_decline': {
        type: 'risk' as const,
        title: `${industry.charAt(0).toUpperCase() + industry.slice(1)} Market Facing Headwinds`,
        impact: 'medium' as const
      }
    };

    const themeConfig = themeMap[theme as keyof typeof themeMap];
    if (!themeConfig) return null;

    const description = this.generateInsightDescription(theme, articles);
    const recommendedActions = this.generateRecommendedActions(theme, industry);

    return {
      id: `insight-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      industry,
      insightType: themeConfig.type,
      title: themeConfig.title,
      description,
      impactLevel: themeConfig.impact,
      confidenceScore: Math.min(1.0, confidence),
      sourceArticles: articles.map(a => a.id),
      dataPoints: {
        articleCount: articles.length,
        avgSentiment: articles.reduce((sum, a) => sum + (a.sentiment || 0), 0) / articles.length,
        timeSpread: this.calculateTimeSpread(articles)
      },
      geographicScope: ['global'], // Would be more sophisticated in real implementation
      affectedRoles: this.extractAffectedRoles(articles),
      recommendedActions,
      validFrom: new Date().toISOString(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Valid for 30 days
      metadata: { theme, analysisVersion: '1.0' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  private generateInsightDescription(theme: string, articles: NewsArticle[]): string {
    const articleCount = articles.length;
    const avgSentiment = articles.reduce((sum, a) => sum + (a.sentiment || 0), 0) / articles.length;
    
    const descriptions = {
      'hiring_surge': `Based on analysis of ${articleCount} recent articles, there's increased hiring activity with an average sentiment of ${avgSentiment.toFixed(2)}.`,
      'workforce_reduction': `Analysis of ${articleCount} articles indicates workforce reduction trends with concerning sentiment patterns.`,
      'funding_growth': `${articleCount} articles show positive funding trends and investment activity in the sector.`,
      'funding_challenges': `Recent analysis of ${articleCount} articles reveals funding difficulties and investor concerns.`,
      'tech_advancement': `${articleCount} articles highlight significant technological progress and innovation breakthroughs.`,
      'market_growth': `Analysis shows positive market indicators across ${articleCount} recent industry reports.`,
      'market_decline': `${articleCount} articles indicate market challenges and declining performance metrics.`
    };

    return descriptions[theme as keyof typeof descriptions] || `Industry insight based on ${articleCount} recent articles.`;
  }

  private generateRecommendedActions(theme: string, industry: string): string[] {
    const actions = {
      'hiring_surge': [
        'Update your resume and LinkedIn profile',
        'Apply to positions in growing companies',
        'Network with professionals in hiring companies',
        'Consider skill upgrades in high-demand areas'
      ],
      'workforce_reduction': [
        'Strengthen your professional network',
        'Diversify your skill set',
        'Consider opportunities in adjacent industries',
        'Build an emergency fund for job transitions'
      ],
      'funding_growth': [
        'Research well-funded startups for opportunities',
        'Consider roles in scaling companies',
        'Look for equity compensation opportunities',
        'Network with investors and founders'
      ],
      'funding_challenges': [
        'Focus on established companies with stable funding',
        'Avoid early-stage startups in this sector',
        'Consider roles in revenue-generating functions',
        'Build recession-resistant skills'
      ],
      'tech_advancement': [
        'Learn emerging technologies mentioned in the news',
        'Attend industry conferences and workshops',
        'Consider roles that leverage new technology',
        'Build projects showcasing new tech skills'
      ],
      'market_growth': [
        'Position yourself for industry expansion',
        'Negotiate better compensation packages',
        'Consider leadership opportunities',
        'Invest in long-term career development'
      ],
      'market_decline': [
        'Focus on essential business functions',
        'Develop recession-proof skills',
        'Consider defensive career moves',
        'Build a diverse professional portfolio'
      ]
    };

    return actions[theme as keyof typeof actions] || ['Monitor industry developments closely'];
  }

  private calculateTimeSpread(articles: NewsArticle[]): number {
    if (articles.length < 2) return 0;
    
    const dates = articles.map(a => new Date(a.publishedAt || a.createdAt).getTime()).sort();
    return (dates[dates.length - 1] - dates[0]) / (1000 * 60 * 60 * 24); // Days
  }

  private extractAffectedRoles(articles: NewsArticle[]): string[] {
    const roles = new Set<string>();
    const roleKeywords = [
      'engineer', 'developer', 'manager', 'analyst', 'designer',
      'consultant', 'specialist', 'coordinator', 'director', 'executive'
    ];

    articles.forEach(article => {
      const text = `${article.title} ${article.summary || ''}`.toLowerCase();
      roleKeywords.forEach(role => {
        if (text.includes(role)) {
          roles.add(role);
        }
      });
    });

    return Array.from(roles);
  }

  private async identifyTrendingTopics(industry: string, articles: NewsArticle[]): Promise<TrendingTopic[]> {
    const topicCounts = new Map<string, { count: number; articles: NewsArticle[]; sentiment: number[] }>();

    // Extract topics from article tags and categories
    articles.forEach(article => {
      [...article.tags, ...article.categories].forEach(topic => {
        if (topic && topic.length > 2) {
          const normalizedTopic = topic.toLowerCase();
          
          if (!topicCounts.has(normalizedTopic)) {
            topicCounts.set(normalizedTopic, { count: 0, articles: [], sentiment: [] });
          }
          
          const topicData = topicCounts.get(normalizedTopic)!;
          topicData.count++;
          topicData.articles.push(article);
          if (article.sentiment !== undefined) {
            topicData.sentiment.push(article.sentiment);
          }
        }
      });
    });

    // Convert to trending topics and calculate metrics
    const trendingTopics: TrendingTopic[] = [];
    
    for (const [topic, data] of topicCounts) {
      if (data.count >= 3) { // Minimum threshold for trending
        const avgSentiment = data.sentiment.length > 0 ? 
          data.sentiment.reduce((sum, s) => sum + s, 0) / data.sentiment.length : 0;

        const trendingTopic: TrendingTopic = {
          id: `topic-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          topic,
          category: industry,
          mentionCount: data.count,
          growthRate: this.calculateGrowthRate(data.articles),
          sentimentAvg: avgSentiment,
          geographicDistribution: { global: 1.0 }, // Simplified
          relatedArticles: data.articles.map(a => a.id),
          trendingSince: new Date().toISOString(),
          metadata: { industry, analysisVersion: '1.0' },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        trendingTopics.push(trendingTopic);
      }
    }

    // Save trending topics
    for (const topic of trendingTopics) {
      await this.saveTrendingTopic(topic);
    }

    return trendingTopics.sort((a, b) => b.mentionCount - a.mentionCount);
  }

  private calculateGrowthRate(articles: NewsArticle[]): number {
    // Simple growth rate calculation based on article timing
    const now = Date.now();
    const recentArticles = articles.filter(a => 
      (now - new Date(a.publishedAt || a.createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000
    );
    
    return articles.length > 0 ? (recentArticles.length / articles.length) * 100 : 0;
  }

  private calculateMarketSentiment(articles: NewsArticle[]): number {
    if (articles.length === 0) return 0;
    
    const sentiments = articles
      .filter(a => a.sentiment !== undefined)
      .map(a => a.sentiment!);
    
    if (sentiments.length === 0) return 0;
    
    return sentiments.reduce((sum, s) => sum + s, 0) / sentiments.length;
  }

  private assessJobMarketHealth(articles: NewsArticle[]): IndustryReport['jobMarketHealth'] {
    const hiringArticles = articles.filter(a => 
      this.containsKeywords(`${a.title} ${a.summary || ''}`.toLowerCase(), ['hiring', 'jobs'])
    );
    
    const layoffArticles = articles.filter(a => 
      this.containsKeywords(`${a.title} ${a.summary || ''}`.toLowerCase(), ['layoff', 'downsizing'])
    );
    
    const ratio = hiringArticles.length / Math.max(1, layoffArticles.length);
    
    if (ratio > 3) return 'excellent';
    if (ratio > 1.5) return 'good';
    if (ratio > 0.5) return 'fair';
    return 'poor';
  }

  private analyzeHiringTrends(articles: NewsArticle[]): IndustryReport['hiringTrends'] {
    // Simplified analysis - would be more sophisticated in real implementation
    return {
      direction: 'stable',
      hotSkills: ['artificial intelligence', 'cloud computing', 'data science'],
      emergingRoles: ['ai engineer', 'devops specialist', 'data analyst'],
      decliningRoles: ['traditional qa', 'legacy system admin']
    };
  }

  private analyzeSalaryTrends(articles: NewsArticle[]): IndustryReport['salaryTrends'] {
    // Simplified analysis - would integrate with salary data sources
    return {
      avgChange: 3.5, // 3.5% average increase
      topPayingRoles: ['senior engineer', 'product manager', 'data scientist'],
      fastestGrowing: ['ai specialist', 'cloud architect', 'security engineer']
    };
  }

  private generateRecommendations(
    insights: IndustryInsight[], 
    trendingTopics: TrendingTopic[]
  ): IndustryReport['recommendations'] {
    return {
      forJobSeekers: [
        'Focus on companies mentioned in positive funding news',
        'Develop skills in trending technologies',
        'Network with professionals at growing companies',
        'Monitor industry alerts for new opportunities'
      ],
      forCareerDevelopment: [
        'Align career goals with industry growth trends',
        'Build expertise in emerging areas',
        'Consider leadership opportunities in expanding sectors',
        'Stay informed about market developments'
      ],
      forSkillDevelopment: [
        `Learn ${trendingTopics.slice(0, 3).map(t => t.topic).join(', ')}`,
        'Focus on recession-proof skills',
        'Develop both technical and soft skills',
        'Consider certifications in growing areas'
      ]
    };
  }

  private async saveInsight(insight: IndustryInsight): Promise<void> {
    const { error } = await supabase
      .from('industry_insights')
      .upsert({
        id: insight.id,
        industry: insight.industry,
        insight_type: insight.insightType,
        title: insight.title,
        description: insight.description,
        impact_level: insight.impactLevel,
        confidence_score: insight.confidenceScore,
        source_articles: insight.sourceArticles,
        data_points: insight.dataPoints,
        geographic_scope: insight.geographicScope,
        affected_roles: insight.affectedRoles,
        recommended_actions: insight.recommendedActions,
        valid_from: insight.validFrom,
        valid_until: insight.validUntil,
        metadata: insight.metadata
      }, {
        onConflict: 'id'
      });

    if (error) {
      console.error('Failed to save insight:', error);
    }
  }

  private async saveTrendingTopic(topic: TrendingTopic): Promise<void> {
    const { error } = await supabase
      .from('trending_topics')
      .upsert({
        id: topic.id,
        topic: topic.topic,
        category: topic.category,
        mention_count: topic.mentionCount,
        growth_rate: topic.growthRate,
        sentiment_avg: topic.sentimentAvg,
        geographic_distribution: topic.geographicDistribution,
        related_articles: topic.relatedArticles,
        peak_time: topic.peakTime,
        trending_since: topic.trendingSince,
        trending_until: topic.trendingUntil,
        metadata: topic.metadata
      }, {
        onConflict: 'id'
      });

    if (error) {
      console.error('Failed to save trending topic:', error);
    }
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

  public async getInsightsForUser(userId: string, limit: number = 10): Promise<IndustryInsight[]> {
    // Get user's industry interests
    const { data: preferences } = await supabase
      .from('user_news_preferences')
      .select('industries')
      .eq('user_id', userId)
      .single();

    const userIndustries = preferences?.industries || ['technology'];

    const { data, error } = await supabase
      .from('industry_insights')
      .select('*')
      .in('industry', userIndustries)
      .gte('valid_from', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
      .order('confidence_score', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to get user insights:', error);
      return [];
    }

    return data?.map(this.mapInsight) || [];
  }

  private mapInsight(data: any): IndustryInsight {
    return {
      id: data.id,
      industry: data.industry,
      insightType: data.insight_type,
      title: data.title,
      description: data.description,
      impactLevel: data.impact_level,
      confidenceScore: data.confidence_score,
      sourceArticles: data.source_articles || [],
      dataPoints: data.data_points || {},
      geographicScope: data.geographic_scope || [],
      affectedRoles: data.affected_roles || [],
      recommendedActions: data.recommended_actions || [],
      validFrom: data.valid_from,
      validUntil: data.valid_until,
      metadata: data.metadata || {},
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }
}

export default IndustryInsightsAnalyzer;