// Engagement Tracking System - Monitor and analyze social media performance
import { supabase } from '../lib/supabase';

export interface EngagementMetrics {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
  saves: number;
  reach: number;
  impressions: number;
  engagement_rate: number;
  click_through_rate: number;
}

export interface PlatformMetrics {
  platform: string;
  total_posts: number;
  total_engagement: number;
  avg_engagement_rate: number;
  best_performing_post_id: string;
  top_performing_time: string;
  top_performing_day: string;
  follower_growth: number;
  reach_growth: number;
}

export interface ContentAnalytics {
  content_type: string;
  avg_engagement_rate: number;
  total_posts: number;
  best_performing_length: number;
  optimal_hashtag_count: number;
  top_hashtags: string[];
}

export interface TimeAnalytics {
  hour: number;
  day_of_week: number;
  avg_engagement_rate: number;
  total_posts: number;
  reach_multiplier: number;
}

export interface CompetitorAnalysis {
  competitor_name: string;
  platform: string;
  avg_engagement_rate: number;
  posting_frequency: number;
  top_content_types: string[];
  estimated_reach: number;
}

export interface EngagementInsight {
  type: 'opportunity' | 'warning' | 'achievement' | 'recommendation';
  title: string;
  description: string;
  action_items: string[];
  impact_score: number; // 1-10
  confidence: number; // 0-1
  data_points: any;
}

class EngagementTrackingService {
  private userId: string | null = null;
  private platformTokens: Map<string, string> = new Map();

  async initialize(userId: string) {
    this.userId = userId;
    await this.loadPlatformTokens();
  }

  private async loadPlatformTokens() {
    if (!this.userId) return;

    try {
      const { data: tokens } = await supabase
        .from('platform_integrations')
        .select('platform, access_token, refresh_token, expires_at')
        .eq('user_id', this.userId)
        .eq('is_active', true);

      if (tokens) {
        tokens.forEach(token => {
          this.platformTokens.set(token.platform, token.access_token);
        });
      }
    } catch (error) {
      console.error('Error loading platform tokens:', error);
    }
  }

  // Import engagement data from platforms
  async importEngagementData(platform: string, timeRange: 'day' | 'week' | 'month' = 'week'): Promise<void> {
    if (!this.userId) return;

    try {
      const token = this.platformTokens.get(platform);
      if (!token) {
        console.warn(`No access token found for platform: ${platform}`);
        return;
      }

      // Get posts from the specified time range
      const { data: posts } = await supabase
        .from('social_posts')
        .select('id, platform_post_id, scheduled_date')
        .eq('user_id', this.userId)
        .eq('platform', platform)
        .eq('status', 'published')
        .gte('scheduled_date', this.getTimeRangeStart(timeRange));

      if (!posts || posts.length === 0) return;

      // Import metrics for each post
      for (const post of posts) {
        const metrics = await this.fetchPlatformMetrics(platform, post.platform_post_id, token);
        if (metrics) {
          await this.saveEngagementMetrics(post.id, metrics);
        }
        
        // Rate limiting
        await this.delay(1000);
      }

      console.log(`Successfully imported engagement data for ${posts.length} posts on ${platform}`);
    } catch (error) {
      console.error(`Error importing engagement data for ${platform}:`, error);
    }
  }

  private async fetchPlatformMetrics(platform: string, postId: string, token: string): Promise<EngagementMetrics | null> {
    try {
      switch (platform) {
        case 'linkedin':
          return await this.fetchLinkedInMetrics(postId, token);
        case 'twitter':
          return await this.fetchTwitterMetrics(postId, token);
        case 'instagram':
          return await this.fetchInstagramMetrics(postId, token);
        case 'facebook':
          return await this.fetchFacebookMetrics(postId, token);
        default:
          console.warn(`Unsupported platform for metrics: ${platform}`);
          return null;
      }
    } catch (error) {
      console.error(`Error fetching metrics for ${platform} post ${postId}:`, error);
      return null;
    }
  }

  private async fetchLinkedInMetrics(postId: string, token: string): Promise<EngagementMetrics> {
    const response = await fetch(`https://api.linkedin.com/v2/socialActions/${postId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Restli-Protocol-Version': '2.0.0'
      }
    });

    if (!response.ok) {
      throw new Error(`LinkedIn API error: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      views: data.totalShares || 0,
      likes: data.numLikes || 0,
      comments: data.numComments || 0,
      shares: data.numShares || 0,
      clicks: data.clickCount || 0,
      saves: 0, // LinkedIn doesn't provide saves
      reach: data.reach || 0,
      impressions: data.impressions || 0,
      engagement_rate: this.calculateEngagementRate(data),
      click_through_rate: data.clickCount && data.impressions ? (data.clickCount / data.impressions) * 100 : 0
    };
  }

  private async fetchTwitterMetrics(postId: string, token: string): Promise<EngagementMetrics> {
    const response = await fetch(`https://api.twitter.com/2/tweets/${postId}?tweet.fields=public_metrics`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Twitter API error: ${response.status}`);
    }

    const data = await response.json();
    const metrics = data.data.public_metrics;
    
    return {
      views: metrics.impression_count || 0,
      likes: metrics.like_count || 0,
      comments: metrics.reply_count || 0,
      shares: metrics.retweet_count + metrics.quote_count || 0,
      clicks: 0, // Requires additional API call
      saves: 0, // Not available in basic API
      reach: metrics.impression_count || 0,
      impressions: metrics.impression_count || 0,
      engagement_rate: this.calculateEngagementRate(metrics),
      click_through_rate: 0
    };
  }

  private async fetchInstagramMetrics(postId: string, token: string): Promise<EngagementMetrics> {
    const response = await fetch(`https://graph.instagram.com/${postId}/insights?metric=engagement,impressions,reach,saved&access_token=${token}`);

    if (!response.ok) {
      throw new Error(`Instagram API error: ${response.status}`);
    }

    const data = await response.json();
    const insights = data.data.reduce((acc, insight) => {
      acc[insight.name] = insight.values[0]?.value || 0;
      return acc;
    }, {});
    
    return {
      views: insights.impressions || 0,
      likes: 0, // Requires separate API call
      comments: 0, // Requires separate API call
      shares: 0, // Not directly available
      clicks: 0,
      saves: insights.saved || 0,
      reach: insights.reach || 0,
      impressions: insights.impressions || 0,
      engagement_rate: insights.engagement ? (insights.engagement / insights.reach) * 100 : 0,
      click_through_rate: 0
    };
  }

  private async fetchFacebookMetrics(postId: string, token: string): Promise<EngagementMetrics> {
    const response = await fetch(`https://graph.facebook.com/${postId}/insights?metric=post_impressions,post_engaged_users&access_token=${token}`);

    if (!response.ok) {
      throw new Error(`Facebook API error: ${response.status}`);
    }

    const data = await response.json();
    const insights = data.data.reduce((acc, insight) => {
      acc[insight.name] = insight.values[0]?.value || 0;
      return acc;
    }, {});
    
    return {
      views: insights.post_impressions || 0,
      likes: 0, // Requires separate API call
      comments: 0, // Requires separate API call
      shares: 0, // Requires separate API call
      clicks: 0,
      saves: 0,
      reach: insights.post_impressions || 0,
      impressions: insights.post_impressions || 0,
      engagement_rate: insights.post_engaged_users && insights.post_impressions 
        ? (insights.post_engaged_users / insights.post_impressions) * 100 : 0,
      click_through_rate: 0
    };
  }

  private calculateEngagementRate(metrics: any): number {
    const totalEngagement = (metrics.numLikes || metrics.like_count || 0) + 
                          (metrics.numComments || metrics.reply_count || 0) + 
                          (metrics.numShares || metrics.retweet_count || 0);
    const totalReach = metrics.reach || metrics.impression_count || metrics.impressions || 1;
    
    return (totalEngagement / totalReach) * 100;
  }

  private async saveEngagementMetrics(postId: string, metrics: EngagementMetrics): Promise<void> {
    try {
      const { error } = await supabase
        .from('social_posts')
        .update({
          engagement_metrics: metrics,
          updated_at: new Date().toISOString()
        })
        .eq('id', postId);

      if (error) {
        console.error('Error saving engagement metrics:', error);
      }

      // Also save to engagement history for trend analysis
      await supabase
        .from('engagement_history')
        .insert({
          post_id: postId,
          user_id: this.userId,
          metrics,
          recorded_at: new Date().toISOString()
        });

    } catch (error) {
      console.error('Error saving engagement metrics:', error);
    }
  }

  // Analytics and insights
  async getPlatformAnalytics(platform?: string, timeRange: string = '30d'): Promise<PlatformMetrics[]> {
    if (!this.userId) return [];

    try {
      let query = supabase
        .from('social_posts')
        .select(`
          platform,
          engagement_metrics,
          created_at,
          scheduled_date,
          content_type
        `)
        .eq('user_id', this.userId)
        .eq('status', 'published')
        .gte('scheduled_date', this.getTimeRangeStart(timeRange));

      if (platform) {
        query = query.eq('platform', platform);
      }

      const { data: posts } = await query;
      if (!posts) return [];

      // Group by platform and calculate metrics
      const platformData = this.groupByPlatform(posts);
      
      const analytics: PlatformMetrics[] = Object.entries(platformData).map(([platformName, posts]: [string, any]) => {
        const totalEngagement = posts.reduce((sum, post) => {
          const metrics = post.engagement_metrics || {};
          return sum + (metrics.likes || 0) + (metrics.comments || 0) + (metrics.shares || 0);
        }, 0);

        const avgEngagementRate = posts.reduce((sum, post) => {
          return sum + (post.engagement_metrics?.engagement_rate || 0);
        }, 0) / posts.length;

        const bestPerformingPost = posts.reduce((best, post) => {
          const currentRate = post.engagement_metrics?.engagement_rate || 0;
          const bestRate = best.engagement_metrics?.engagement_rate || 0;
          return currentRate > bestRate ? post : best;
        }, posts[0]);

        const timeAnalysis = this.analyzeOptimalTiming(posts);

        return {
          platform: platformName,
          total_posts: posts.length,
          total_engagement: totalEngagement,
          avg_engagement_rate: Math.round(avgEngagementRate * 100) / 100,
          best_performing_post_id: bestPerformingPost.id,
          top_performing_time: timeAnalysis.bestTime,
          top_performing_day: timeAnalysis.bestDay,
          follower_growth: 0, // TODO: Implement follower tracking
          reach_growth: 0 // TODO: Implement reach tracking
        };
      });

      return analytics;
    } catch (error) {
      console.error('Error getting platform analytics:', error);
      return [];
    }
  }

  async getContentAnalytics(timeRange: string = '30d'): Promise<ContentAnalytics[]> {
    if (!this.userId) return [];

    try {
      const { data: posts } = await supabase
        .from('social_posts')
        .select('content_type, content, engagement_metrics, hashtags')
        .eq('user_id', this.userId)
        .eq('status', 'published')
        .gte('scheduled_date', this.getTimeRangeStart(timeRange));

      if (!posts) return [];

      // Group by content type
      const contentTypeData = posts.reduce((acc, post) => {
        const type = post.content_type || 'general';
        if (!acc[type]) acc[type] = [];
        acc[type].push(post);
        return acc;
      }, {});

      return Object.entries(contentTypeData).map(([contentType, typePosts]: [string, any]) => {
        const avgEngagementRate = typePosts.reduce((sum, post) => {
          return sum + (post.engagement_metrics?.engagement_rate || 0);
        }, 0) / typePosts.length;

        const avgLength = typePosts.reduce((sum, post) => {
          return sum + (post.content?.length || 0);
        }, 0) / typePosts.length;

        // Find optimal hashtag count
        const hashtagAnalysis = this.analyzeHashtagPerformance(typePosts);

        // Extract top hashtags
        const allHashtags = typePosts.flatMap(post => post.hashtags || []);
        const hashtagFreq = allHashtags.reduce((freq, tag) => {
          freq[tag] = (freq[tag] || 0) + 1;
          return freq;
        }, {});
        
        const topHashtags = Object.entries(hashtagFreq)
          .sort(([,a], [,b]) => (b as number) - (a as number))
          .slice(0, 10)
          .map(([tag]) => tag);

        return {
          content_type: contentType,
          avg_engagement_rate: Math.round(avgEngagementRate * 100) / 100,
          total_posts: typePosts.length,
          best_performing_length: Math.round(avgLength),
          optimal_hashtag_count: hashtagAnalysis.optimalCount,
          top_hashtags: topHashtags
        };
      });
    } catch (error) {
      console.error('Error getting content analytics:', error);
      return [];
    }
  }

  async getTimeAnalytics(platform?: string, timeRange: string = '30d'): Promise<TimeAnalytics[]> {
    if (!this.userId) return [];

    try {
      let query = supabase
        .from('social_posts')
        .select('scheduled_date, engagement_metrics')
        .eq('user_id', this.userId)
        .eq('status', 'published')
        .gte('scheduled_date', this.getTimeRangeStart(timeRange));

      if (platform) {
        query = query.eq('platform', platform);
      }

      const { data: posts } = await query;
      if (!posts) return [];

      // Group by hour and day of week
      const timeData = posts.reduce((acc, post) => {
        const date = new Date(post.scheduled_date);
        const hour = date.getHours();
        const dayOfWeek = date.getDay();
        const key = `${hour}-${dayOfWeek}`;

        if (!acc[key]) {
          acc[key] = {
            hour,
            day_of_week: dayOfWeek,
            posts: [],
            total_engagement: 0
          };
        }

        acc[key].posts.push(post);
        const metrics = post.engagement_metrics || {};
        acc[key].total_engagement += (metrics.likes || 0) + (metrics.comments || 0) + (metrics.shares || 0);

        return acc;
      }, {});

      return Object.values(timeData).map((data: any) => {
        const avgEngagementRate = data.posts.reduce((sum, post) => {
          return sum + (post.engagement_metrics?.engagement_rate || 0);
        }, 0) / data.posts.length;

        return {
          hour: data.hour,
          day_of_week: data.day_of_week,
          avg_engagement_rate: Math.round(avgEngagementRate * 100) / 100,
          total_posts: data.posts.length,
          reach_multiplier: this.calculateReachMultiplier(data.hour, data.day_of_week)
        };
      }).sort((a, b) => b.avg_engagement_rate - a.avg_engagement_rate);
    } catch (error) {
      console.error('Error getting time analytics:', error);
      return [];
    }
  }

  async generateInsights(timeRange: string = '30d'): Promise<EngagementInsight[]> {
    if (!this.userId) return [];

    try {
      const [platformAnalytics, contentAnalytics, timeAnalytics] = await Promise.all([
        this.getPlatformAnalytics(undefined, timeRange),
        this.getContentAnalytics(timeRange),
        this.getTimeAnalytics(undefined, timeRange)
      ]);

      const insights: EngagementInsight[] = [];

      // Platform performance insights
      if (platformAnalytics.length > 1) {
        const bestPlatform = platformAnalytics.reduce((best, current) => 
          current.avg_engagement_rate > best.avg_engagement_rate ? current : best
        );
        
        const worstPlatform = platformAnalytics.reduce((worst, current) => 
          current.avg_engagement_rate < worst.avg_engagement_rate ? current : worst
        );

        if (bestPlatform.avg_engagement_rate > worstPlatform.avg_engagement_rate * 2) {
          insights.push({
            type: 'opportunity',
            title: `${bestPlatform.platform} significantly outperforms other platforms`,
            description: `Your content on ${bestPlatform.platform} has ${bestPlatform.avg_engagement_rate.toFixed(1)}% engagement vs ${worstPlatform.avg_engagement_rate.toFixed(1)}% on ${worstPlatform.platform}`,
            action_items: [
              `Increase posting frequency on ${bestPlatform.platform}`,
              `Adapt successful ${bestPlatform.platform} content for other platforms`,
              `Analyze what makes your ${bestPlatform.platform} content more engaging`
            ],
            impact_score: 8,
            confidence: 0.9,
            data_points: { bestPlatform, worstPlatform }
          });
        }
      }

      // Content type insights
      if (contentAnalytics.length > 1) {
        const bestContentType = contentAnalytics.reduce((best, current) => 
          current.avg_engagement_rate > best.avg_engagement_rate ? current : best
        );

        if (bestContentType.avg_engagement_rate > 5) {
          insights.push({
            type: 'achievement',
            title: `${bestContentType.content_type} content performs exceptionally well`,
            description: `Your ${bestContentType.content_type} posts average ${bestContentType.avg_engagement_rate.toFixed(1)}% engagement`,
            action_items: [
              `Create more ${bestContentType.content_type} content`,
              `Use ${bestContentType.optimal_hashtag_count} hashtags for optimal performance`,
              `Keep content length around ${bestContentType.best_performing_length} characters`
            ],
            impact_score: 7,
            confidence: 0.8,
            data_points: { bestContentType }
          });
        }
      }

      // Timing insights
      if (timeAnalytics.length > 0) {
        const bestTime = timeAnalytics[0];
        const avgEngagement = timeAnalytics.reduce((sum, time) => sum + time.avg_engagement_rate, 0) / timeAnalytics.length;

        if (bestTime.avg_engagement_rate > avgEngagement * 1.5) {
          const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          insights.push({
            type: 'recommendation',
            title: 'Optimal posting time identified',
            description: `Posting at ${bestTime.hour}:00 on ${days[bestTime.day_of_week]}s yields ${bestTime.avg_engagement_rate.toFixed(1)}% engagement`,
            action_items: [
              `Schedule more posts for ${days[bestTime.day_of_week]}s at ${bestTime.hour}:00`,
              'Test similar time slots on other days',
              'Use automatic scheduling to hit optimal times consistently'
            ],
            impact_score: 6,
            confidence: 0.7,
            data_points: { bestTime, avgEngagement }
          });
        }
      }

      // Hashtag insights
      const hashtagInsights = this.generateHashtagInsights(contentAnalytics);
      insights.push(...hashtagInsights);

      // Frequency insights
      const frequencyInsights = await this.generateFrequencyInsights(platformAnalytics, timeRange);
      insights.push(...frequencyInsights);

      return insights.sort((a, b) => b.impact_score - a.impact_score);
    } catch (error) {
      console.error('Error generating insights:', error);
      return [];
    }
  }

  // Helper methods
  private getTimeRangeStart(timeRange: string): string {
    const now = new Date();
    const days = {
      'day': 1,
      'week': 7,
      '30d': 30,
      'month': 30,
      '90d': 90,
      'quarter': 90
    };

    const daysBack = days[timeRange] || 30;
    const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));
    return startDate.toISOString();
  }

  private groupByPlatform(posts: any[]): any {
    return posts.reduce((acc, post) => {
      if (!acc[post.platform]) acc[post.platform] = [];
      acc[post.platform].push(post);
      return acc;
    }, {});
  }

  private analyzeOptimalTiming(posts: any[]): { bestTime: string; bestDay: string } {
    const timeData = posts.reduce((acc, post) => {
      const date = new Date(post.scheduled_date);
      const hour = date.getHours();
      const day = date.getDay();
      const engagement = post.engagement_metrics?.engagement_rate || 0;

      const timeKey = `${hour}:00`;
      if (!acc.hours[timeKey]) acc.hours[timeKey] = { total: 0, count: 0 };
      acc.hours[timeKey].total += engagement;
      acc.hours[timeKey].count += 1;

      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayKey = days[day];
      if (!acc.days[dayKey]) acc.days[dayKey] = { total: 0, count: 0 };
      acc.days[dayKey].total += engagement;
      acc.days[dayKey].count += 1;

      return acc;
    }, { hours: {}, days: {} });

    const bestTime = Object.entries(timeData.hours)
      .map(([time, data]: [string, any]) => ({ time, avg: data.total / data.count }))
      .sort((a, b) => b.avg - a.avg)[0]?.time || '12:00';

    const bestDay = Object.entries(timeData.days)
      .map(([day, data]: [string, any]) => ({ day, avg: data.total / data.count }))
      .sort((a, b) => b.avg - a.avg)[0]?.day || 'Monday';

    return { bestTime, bestDay };
  }

  private analyzeHashtagPerformance(posts: any[]): { optimalCount: number } {
    const hashtagData = posts.map(post => ({
      count: (post.hashtags || []).length,
      engagement: post.engagement_metrics?.engagement_rate || 0
    }));

    const grouped = hashtagData.reduce((acc, data) => {
      const bucket = Math.floor(data.count / 2) * 2; // Group into buckets of 2
      if (!acc[bucket]) acc[bucket] = { total: 0, count: 0 };
      acc[bucket].total += data.engagement;
      acc[bucket].count += 1;
      return acc;
    }, {});

    const optimal = Object.entries(grouped)
      .map(([count, data]: [string, any]) => ({ count: parseInt(count), avg: data.total / data.count }))
      .sort((a, b) => b.avg - a.avg)[0];

    return { optimalCount: optimal?.count || 5 };
  }

  private calculateReachMultiplier(hour: number, dayOfWeek: number): number {
    // Peak hours: 9-10am, 12-1pm, 7-9pm
    const peakHours = [9, 10, 12, 13, 19, 20, 21];
    const hourMultiplier = peakHours.includes(hour) ? 1.2 : 1.0;

    // Peak days: Tuesday-Thursday
    const dayMultiplier = [2, 3, 4].includes(dayOfWeek) ? 1.1 : 1.0;

    return Math.round((hourMultiplier * dayMultiplier) * 100) / 100;
  }

  private generateHashtagInsights(contentAnalytics: ContentAnalytics[]): EngagementInsight[] {
    const insights: EngagementInsight[] = [];

    const overallTopHashtags = contentAnalytics
      .flatMap(content => content.top_hashtags)
      .reduce((freq, tag) => {
        freq[tag] = (freq[tag] || 0) + 1;
        return freq;
      }, {});

    const topHashtags = Object.entries(overallTopHashtags)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([tag]) => tag);

    if (topHashtags.length > 0) {
      insights.push({
        type: 'recommendation',
        title: 'Leverage your top-performing hashtags',
        description: `Your best hashtags: ${topHashtags.join(', ')} appear in your highest-engagement content`,
        action_items: [
          'Use these hashtags consistently in future posts',
          'Find related hashtags in the same niche',
          'Monitor hashtag performance over time'
        ],
        impact_score: 5,
        confidence: 0.6,
        data_points: { topHashtags }
      });
    }

    return insights;
  }

  private async generateFrequencyInsights(platformAnalytics: PlatformMetrics[], timeRange: string): Promise<EngagementInsight[]> {
    const insights: EngagementInsight[] = [];
    const days = timeRange === '30d' ? 30 : 7;

    platformAnalytics.forEach(platform => {
      const postsPerDay = platform.total_posts / days;
      
      if (postsPerDay < 0.2) { // Less than 1 post per 5 days
        insights.push({
          type: 'opportunity',
          title: `Increase posting frequency on ${platform.platform}`,
          description: `You're posting ${postsPerDay.toFixed(1)} times per day on ${platform.platform}. Consistent posting could boost engagement.`,
          action_items: [
            `Aim for at least 1 post per day on ${platform.platform}`,
            'Use content batching to maintain consistency',
            'Set up automatic scheduling'
          ],
          impact_score: 6,
          confidence: 0.5,
          data_points: { platform, postsPerDay }
        });
      } else if (postsPerDay > 3) { // More than 3 posts per day
        insights.push({
          type: 'warning',
          title: `Consider reducing posting frequency on ${platform.platform}`,
          description: `You're posting ${postsPerDay.toFixed(1)} times per day. This might lead to audience fatigue.`,
          action_items: [
            'Focus on quality over quantity',
            'Analyze which posts perform best',
            'Space out posts more evenly'
          ],
          impact_score: 4,
          confidence: 0.4,
          data_points: { platform, postsPerDay }
        });
      }
    });

    return insights;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // A/B Testing functionality
  async createABTest(testName: string, variants: any[]): Promise<string> {
    if (!this.userId) throw new Error('User not authenticated');

    const testId = `ab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      const { error } = await supabase
        .from('ab_tests')
        .insert({
          id: testId,
          user_id: this.userId,
          test_name: testName,
          variants,
          status: 'active',
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      return testId;
    } catch (error) {
      console.error('Error creating A/B test:', error);
      throw error;
    }
  }

  async getABTestResults(testId: string): Promise<any> {
    if (!this.userId) return null;

    try {
      const { data: test } = await supabase
        .from('ab_tests')
        .select(`
          *,
          social_posts(engagement_metrics, created_at)
        `)
        .eq('id', testId)
        .eq('user_id', this.userId)
        .single();

      if (!test) return null;

      // Analyze results by variant
      const variantResults = test.variants.map(variant => {
        const variantPosts = test.social_posts.filter(post => 
          post.ab_test_variant === variant.id
        );

        const avgEngagement = variantPosts.reduce((sum, post) => {
          return sum + (post.engagement_metrics?.engagement_rate || 0);
        }, 0) / variantPosts.length;

        return {
          ...variant,
          post_count: variantPosts.length,
          avg_engagement_rate: avgEngagement,
          confidence: this.calculateStatisticalSignificance(variantPosts, test.social_posts)
        };
      });

      return {
        test,
        results: variantResults.sort((a, b) => b.avg_engagement_rate - a.avg_engagement_rate)
      };
    } catch (error) {
      console.error('Error getting A/B test results:', error);
      return null;
    }
  }

  private calculateStatisticalSignificance(variantPosts: any[], allPosts: any[]): number {
    // Simplified statistical significance calculation
    // In production, use proper statistical methods
    const sampleSize = variantPosts.length;
    const totalSize = allPosts.length;
    
    if (sampleSize < 30 || totalSize < 100) return 0; // Insufficient data
    
    const sampleRatio = sampleSize / totalSize;
    const confidenceScore = Math.min(0.95, sampleRatio * 2); // Max 95% confidence
    
    return Math.round(confidenceScore * 100);
  }
}

// Export singleton instance
export const EngagementTracker = new EngagementTrackingService();