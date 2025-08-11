// src/lib/background-search-service.ts
// Service for managing background job search execution

import { supabase } from './supabase';

export interface BackgroundSearchConfig {
  jobBoards: string[];
  maxResults: number;
  delayMs: number;
  respectRateLimit: boolean;
}

export interface SearchExecution {
  executionId: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled' | 'cancelling';
  startTime: number;
  progress?: {
    current_step: string;
    total_steps: number;
    completed_steps: number;
    current_url?: string;
    results_found: number;
  };
  uptime?: number;
}

export class BackgroundSearchService {
  // Start a background search execution
  static async startBackgroundSearch(
    searchId: string, 
    config: BackgroundSearchConfig = {
      jobBoards: ['linkedin'],
      maxResults: 50,
      delayMs: 3000,
      respectRateLimit: true
    }
  ): Promise<{ executionId: string; status: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('search-executor', {
        body: { 
          action: 'start_search',
          searchId,
          config
        }
      });

      if (error) {
        console.error('Error starting background search:', error);
        throw new Error('Failed to start background search');
      }

      return data.data;
    } catch (error) {
      console.error('Error in startBackgroundSearch:', error);
      throw error;
    }
  }

  // Get the status of a running background search
  static async getSearchExecutionStatus(executionId: string): Promise<SearchExecution> {
    try {
      const { data, error } = await supabase.functions.invoke('search-executor', {
        body: { 
          action: 'get_status',
          searchId: executionId // Note: using searchId param for executionId
        }
      });

      if (error) {
        console.error('Error getting search status:', error);
        throw new Error('Failed to get search status');
      }

      return data.data;
    } catch (error) {
      console.error('Error in getSearchExecutionStatus:', error);
      throw error;
    }
  }

  // Cancel a running background search
  static async cancelBackgroundSearch(executionId: string): Promise<void> {
    try {
      const { data, error } = await supabase.functions.invoke('search-executor', {
        body: { 
          action: 'cancel_search',
          searchId: executionId // Note: using searchId param for executionId
        }
      });

      if (error) {
        console.error('Error cancelling background search:', error);
        throw new Error('Failed to cancel background search');
      }

      return data.data;
    } catch (error) {
      console.error('Error in cancelBackgroundSearch:', error);
      throw error;
    }
  }

  // Enhanced search execution with automatic background processing
  static async executeSearchWithMonitoring(
    searchId: string,
    onProgress?: (progress: any) => void,
    onComplete?: (results: any) => void,
    onError?: (error: any) => void
  ): Promise<string> {
    try {
      console.log(`Starting monitored background search for search ID: ${searchId}`);

      // Start the background search
      const { executionId } = await this.startBackgroundSearch(searchId, {
        jobBoards: ['linkedin', 'indeed'],
        maxResults: 100,
        delayMs: 2000,
        respectRateLimit: true
      });

      console.log(`Background search started with execution ID: ${executionId}`);

      // Set up monitoring
      if (onProgress || onComplete || onError) {
        this.monitorSearchExecution(executionId, onProgress, onComplete, onError);
      }

      return executionId;
    } catch (error) {
      console.error('Error in executeSearchWithMonitoring:', error);
      if (onError) onError(error);
      throw error;
    }
  }

  // Monitor a search execution with callbacks
  private static async monitorSearchExecution(
    executionId: string,
    onProgress?: (progress: any) => void,
    onComplete?: (results: any) => void,
    onError?: (error: any) => void
  ): Promise<void> {
    const pollInterval = 2000; // Poll every 2 seconds
    let isCompleted = false;
    let pollAttempts = 0;
    const maxPollAttempts = 150; // Stop after 5 minutes (150 * 2 seconds)

    const poll = async () => {
      pollAttempts++;
      
      // Stop polling after max attempts to prevent infinite loops
      if (pollAttempts > maxPollAttempts) {
        console.log(`Stopping polling for execution ${executionId} after ${maxPollAttempts} attempts`);
        if (onError) onError(new Error('Search monitoring timed out'));
        return;
      }
      try {
        const status = await this.getSearchExecutionStatus(executionId);
        
        if (status.status === 'not_found') {
          // Fall back to database polling
          const dbStatus = await this.getSearchExecutionFromDB(executionId);
          if (!dbStatus) {
            // Search may still be initializing or table doesn't exist yet
            // Continue polling instead of immediately failing
            console.log(`Search execution ${executionId} not found in database, continuing to poll...`);
            setTimeout(poll, pollInterval);
            return;
          }
          
          // Use database status
          if (onProgress && dbStatus.progress_data) {
            onProgress(dbStatus.progress_data);
          }

          if (['completed', 'failed', 'cancelled'].includes(dbStatus.status)) {
            isCompleted = true;
            if (dbStatus.status === 'completed' && onComplete) {
              onComplete({
                executionId,
                totalResults: dbStatus.total_results_found,
                executionTime: dbStatus.execution_time_ms
              });
            } else if (dbStatus.status === 'failed' && onError) {
              onError(new Error(dbStatus.error_message || 'Search failed'));
            }
          }
        } else {
          // Use real-time status
          if (onProgress && status.progress) {
            onProgress(status.progress);
          }

          if (['completed', 'failed', 'cancelled'].includes(status.status)) {
            isCompleted = true;
            if (status.status === 'completed' && onComplete) {
              onComplete({
                executionId,
                uptime: status.uptime
              });
            } else if (status.status === 'failed' && onError) {
              onError(new Error('Search failed'));
            }
          }
        }

        // Continue polling if not completed
        if (!isCompleted) {
          setTimeout(poll, pollInterval);
        }
      } catch (error) {
        console.error('Error polling search status:', error);
        if (onError) onError(error);
      }
    };

    // Start polling
    poll();
  }

  // Get search execution details from database
  private static async getSearchExecutionFromDB(executionId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('search_execution_log')
        .select('*')
        .eq('id', executionId)
        .single();

      if (error) {
        // Handle specific error cases gracefully
        if (error.code === 'PGRST116' || error.message.includes('no rows returned')) {
          // No execution record found yet - this is normal during startup
          console.log(`No execution record found for ${executionId} - search may still be initializing`);
          return null;
        }
        if (error.message.includes('relation "search_execution_log" does not exist')) {
          console.log('search_execution_log table does not exist yet');
          return null;
        }
        console.error('Error fetching search execution from DB:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getSearchExecutionFromDB:', error);
      return null;
    }
  }

  // Get all search executions for current user
  static async getUserSearchExecutions(limit: number = 20): Promise<any[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('search_execution_log')
        .select(`
          *,
          enhanced_job_searches!inner (
            name,
            user_id
          )
        `)
        .eq('enhanced_job_searches.user_id', user.id)
        .order('started_at', { ascending: false })
        .limit(limit);

      if (error) {
        // Handle missing table gracefully
        if (error.message.includes('relation "search_execution_log" does not exist')) {
          console.log('search_execution_log table does not exist yet, returning empty array');
          return [];
        }
        console.error('Error fetching user search executions:', error);
        throw new Error('Failed to fetch search executions');
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserSearchExecutions:', error);
      // Return empty array instead of throwing for missing table
      if (error.message.includes('search_execution_log')) {
        return [];
      }
      throw error;
    }
  }

  // Get detailed activity log for a search execution
  static async getSearchActivityLog(executionId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('search_execution_log')
        .select('activity_log, enhanced_job_searches!inner (user_id)')
        .eq('id', executionId)
        .single();

      if (error) {
        // Handle missing table or no rows gracefully
        if (error.message.includes('relation "search_execution_log" does not exist')) {
          console.log('search_execution_log table does not exist yet, returning empty activity log');
          return [];
        }
        if (error.code === 'PGRST116' || error.message.includes('no rows returned')) {
          console.log(`No activity log found for execution ${executionId}`);
          return [];
        }
        console.error('Error fetching search activity log:', error);
        throw new Error('Failed to fetch activity log');
      }

      // Verify user has access to this search
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || data.enhanced_job_searches.user_id !== user.id) {
        throw new Error('Access denied');
      }

      return data.activity_log || [];
    } catch (error) {
      console.error('Error in getSearchActivityLog:', error);
      // Return empty array for missing table
      if (error.message.includes('search_execution_log')) {
        return [];
      }
      throw error;
    }
  }

  // Subscribe to real-time search execution updates
  static subscribeToSearchExecutions(callback: (update: any) => void) {
    const channel = supabase
      .channel('search-execution-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'search_execution_log'
        },
        (payload) => {
          console.log('Search execution real-time update:', payload);
          callback(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}