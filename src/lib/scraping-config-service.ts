// src/lib/scraping-config-service.ts
// Configuration service for job board scraping with user preferences

import { supabase } from './supabase';

export interface ScrapingPreferences {
  id?: string;
  user_id: string;
  
  // LinkedIn specific settings
  linkedin_enabled: boolean;
  linkedin_use_login?: boolean;
  linkedin_email?: string;
  linkedin_rate_limit_ms?: number;
  linkedin_max_results_per_search?: number;
  linkedin_user_agent_rotation?: boolean;
  
  // General scraping settings
  respect_rate_limits: boolean;
  enable_anti_bot_measures: boolean;
  max_concurrent_requests: number;
  default_delay_ms: number;
  max_retries: number;
  
  // Privacy settings
  store_raw_html: boolean;
  anonymize_searches: boolean;
  
  created_at?: string;
  updated_at?: string;
}

export class ScrapingConfigService {
  // Default configuration for safe, respectful scraping
  private static readonly DEFAULT_CONFIG: Omit<ScrapingPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
    linkedin_enabled: true,
    linkedin_use_login: false,
    linkedin_rate_limit_ms: 3000, // 3 seconds between requests
    linkedin_max_results_per_search: 50,
    linkedin_user_agent_rotation: true,
    
    respect_rate_limits: true,
    enable_anti_bot_measures: true,
    max_concurrent_requests: 1, // Conservative: one request at a time
    default_delay_ms: 2000, // 2 seconds default delay
    max_retries: 3,
    
    store_raw_html: false, // Don't store HTML for privacy
    anonymize_searches: true
  };

  // Get user's scraping preferences
  static async getUserPreferences(userId: string): Promise<ScrapingPreferences> {
    try {
      const { data, error } = await supabase
        .from('scraping_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching scraping preferences:', error);
        throw new Error(`Failed to fetch scraping preferences: ${error.message}`);
      }

      if (data) {
        return data;
      }

      // Create default preferences for new user
      return await this.createDefaultPreferences(userId);

    } catch (error) {
      console.error('Error in getUserPreferences:', error);
      
      // Return safe defaults if database fails
      return {
        user_id: userId,
        ...this.DEFAULT_CONFIG
      };
    }
  }

  // Create default preferences for a new user
  private static async createDefaultPreferences(userId: string): Promise<ScrapingPreferences> {
    try {
      const defaultPrefs = {
        user_id: userId,
        ...this.DEFAULT_CONFIG
      };

      const { data, error } = await supabase
        .from('scraping_preferences')
        .insert([defaultPrefs])
        .select()
        .single();

      if (error) {
        console.error('Error creating default preferences:', error);
        // Return defaults without database storage
        return defaultPrefs;
      }

      return data;

    } catch (error) {
      console.error('Error creating default preferences:', error);
      return {
        user_id: userId,
        ...this.DEFAULT_CONFIG
      };
    }
  }

  // Update user's scraping preferences
  static async updatePreferences(userId: string, updates: Partial<ScrapingPreferences>): Promise<ScrapingPreferences> {
    try {
      // Validate updates for safety
      const safeUpdates = this.validatePreferences(updates);

      const { data, error } = await supabase
        .from('scraping_preferences')
        .update(safeUpdates)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating scraping preferences:', error);
        throw new Error(`Failed to update preferences: ${error.message}`);
      }

      return data;

    } catch (error) {
      console.error('Error in updatePreferences:', error);
      throw error;
    }
  }

  // Validate preferences to ensure safe scraping
  private static validatePreferences(prefs: Partial<ScrapingPreferences>): Partial<ScrapingPreferences> {
    const validated: Partial<ScrapingPreferences> = { ...prefs };

    // Enforce minimum rate limits for respectful scraping
    if (validated.linkedin_rate_limit_ms !== undefined) {
      validated.linkedin_rate_limit_ms = Math.max(validated.linkedin_rate_limit_ms, 1000); // Min 1 second
    }

    if (validated.default_delay_ms !== undefined) {
      validated.default_delay_ms = Math.max(validated.default_delay_ms, 500); // Min 0.5 seconds
    }

    // Limit concurrent requests to prevent overwhelming servers
    if (validated.max_concurrent_requests !== undefined) {
      validated.max_concurrent_requests = Math.min(Math.max(validated.max_concurrent_requests, 1), 3); // 1-3 max
    }

    // Limit max results to prevent excessive scraping
    if (validated.linkedin_max_results_per_search !== undefined) {
      validated.linkedin_max_results_per_search = Math.min(validated.linkedin_max_results_per_search, 100); // Max 100
    }

    // Ensure rate limiting and anti-bot measures are respected
    validated.respect_rate_limits = validated.respect_rate_limits !== false; // Default to true
    validated.enable_anti_bot_measures = validated.enable_anti_bot_measures !== false; // Default to true

    return validated;
  }

  // Check if LinkedIn scraping is enabled and configured safely
  static async isLinkedInScrapingAllowed(userId: string): Promise<{
    allowed: boolean;
    config?: ScrapingPreferences;
    reason?: string;
  }> {
    try {
      const prefs = await this.getUserPreferences(userId);

      if (!prefs.linkedin_enabled) {
        return {
          allowed: false,
          reason: 'LinkedIn scraping is disabled in user preferences'
        };
      }

      if (!prefs.respect_rate_limits || !prefs.enable_anti_bot_measures) {
        return {
          allowed: false,
          reason: 'Safe scraping measures must be enabled'
        };
      }

      return {
        allowed: true,
        config: prefs
      };

    } catch (error) {
      console.error('Error checking LinkedIn scraping permissions:', error);
      return {
        allowed: false,
        reason: 'Error checking permissions'
      };
    }
  }

  // Get scraping statistics for monitoring
  static async getScrapingStats(userId: string, timeframe: 'hour' | 'day' | 'week' = 'day'): Promise<{
    requests_made: number;
    successful_requests: number;
    failed_requests: number;
    rate_limited_requests: number;
    last_request_at?: string;
  }> {
    try {
      const timeframeHours = timeframe === 'hour' ? 1 : timeframe === 'day' ? 24 : 168; // week = 168 hours
      const since = new Date(Date.now() - timeframeHours * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('scraping_request_log')
        .select('status, created_at')
        .eq('user_id', userId)
        .gte('created_at', since);

      if (error) {
        console.error('Error fetching scraping stats:', error);
        return {
          requests_made: 0,
          successful_requests: 0,
          failed_requests: 0,
          rate_limited_requests: 0
        };
      }

      const stats = {
        requests_made: data.length,
        successful_requests: data.filter(r => r.status === 'success').length,
        failed_requests: data.filter(r => r.status === 'failed').length,
        rate_limited_requests: data.filter(r => r.status === 'rate_limited').length,
        last_request_at: data.length > 0 ? data[data.length - 1].created_at : undefined
      };

      return stats;

    } catch (error) {
      console.error('Error getting scraping stats:', error);
      return {
        requests_made: 0,
        successful_requests: 0,
        failed_requests: 0,
        rate_limited_requests: 0
      };
    }
  }

  // Log scraping request for monitoring and rate limiting
  static async logScrapingRequest(
    userId: string, 
    jobBoard: string, 
    status: 'success' | 'failed' | 'rate_limited' | 'blocked',
    details?: {
      url?: string;
      results_count?: number;
      error_message?: string;
      response_time_ms?: number;
    }
  ): Promise<void> {
    try {
      await supabase
        .from('scraping_request_log')
        .insert([{
          user_id: userId,
          job_board: jobBoard,
          status,
          url: details?.url,
          results_count: details?.results_count,
          error_message: details?.error_message,
          response_time_ms: details?.response_time_ms
        }]);

    } catch (error) {
      console.error('Error logging scraping request:', error);
      // Don't throw error - logging failures shouldn't break scraping
    }
  }

  // Check if user has exceeded rate limits
  static async checkRateLimit(userId: string, jobBoard: string): Promise<{
    allowed: boolean;
    requests_in_last_hour: number;
    next_allowed_at?: Date;
  }> {
    try {
      const lastHour = new Date(Date.now() - 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('scraping_request_log')
        .select('created_at')
        .eq('user_id', userId)
        .eq('job_board', jobBoard.toLowerCase())
        .gte('created_at', lastHour)
        .order('created_at', { ascending: false });

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking rate limit:', error);
        return { allowed: true, requests_in_last_hour: 0 }; // Allow if we can't check
      }

      const requestsInLastHour = data?.length || 0;
      const maxRequestsPerHour = jobBoard.toLowerCase() === 'linkedin' ? 10 : 20; // Conservative limits

      if (requestsInLastHour >= maxRequestsPerHour) {
        // Calculate when next request is allowed
        const lastRequestTime = data?.[0]?.created_at;
        const nextAllowedAt = lastRequestTime 
          ? new Date(new Date(lastRequestTime).getTime() + 60 * 60 * 1000) // 1 hour from last request
          : new Date();

        return {
          allowed: false,
          requests_in_last_hour: requestsInLastHour,
          next_allowed_at: nextAllowedAt
        };
      }

      return {
        allowed: true,
        requests_in_last_hour: requestsInLastHour
      };

    } catch (error) {
      console.error('Error checking rate limit:', error);
      return { allowed: true, requests_in_last_hour: 0 }; // Allow if we can't check
    }
  }
}