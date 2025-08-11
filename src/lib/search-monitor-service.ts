// src/lib/search-monitor-service.ts
// Service for monitoring and managing job search executions

import { supabase } from './supabase';

export interface ActiveSearchInfo {
  id: string;
  user_id: string;
  user_email: string;
  search_name: string;
  job_board: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  started_at: string;
  estimated_completion?: string;
  progress?: {
    current_step: string;
    total_steps: number;
    completed_steps: number;
    current_url?: string;
    results_found: number;
  };
}

export interface SearchLogEntry {
  id: string;
  search_name: string;
  job_boards: string[];
  status: string;
  started_at: string;
  completed_at?: string;
  execution_time_ms?: number;
  total_results_found?: number;
  error_message?: string;
  progress_data?: any;
}

export class SearchMonitorService {
  // Get all currently active searches across all users (admin view)
  static async getActiveSearches(): Promise<ActiveSearchInfo[]> {
    try {
      const { data, error } = await supabase.functions.invoke('search-monitor', {
        body: { action: 'get_active_searches' }
      });

      if (error) {
        console.error('Error fetching active searches:', error);
        throw new Error('Failed to fetch active searches');
      }

      return data.data || [];
    } catch (error) {
      console.error('Error in getActiveSearches:', error);
      throw error;
    }
  }

  // Get status of a specific search
  static async getSearchStatus(searchId: string): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke('search-monitor', {
        body: { 
          action: 'get_search_status',
          searchId 
        }
      });

      if (error) {
        console.error('Error fetching search status:', error);
        throw new Error('Failed to fetch search status');
      }

      return data.data;
    } catch (error) {
      console.error('Error in getSearchStatus:', error);
      throw error;
    }
  }

  // Cancel a running search
  static async cancelSearch(searchId: string): Promise<void> {
    try {
      const { data, error } = await supabase.functions.invoke('search-monitor', {
        body: { 
          action: 'cancel_search',
          searchId 
        }
      });

      if (error) {
        console.error('Error cancelling search:', error);
        throw new Error('Failed to cancel search');
      }

      return data.data;
    } catch (error) {
      console.error('Error in cancelSearch:', error);
      throw error;
    }
  }

  // Get search execution logs
  static async getSearchLogs(searchId?: string): Promise<SearchLogEntry[]> {
    try {
      const { data, error } = await supabase.functions.invoke('search-monitor', {
        body: { 
          action: 'get_search_logs',
          searchId 
        }
      });

      if (error) {
        console.error('Error fetching search logs:', error);
        throw new Error('Failed to fetch search logs');
      }

      return data.data || [];
    } catch (error) {
      console.error('Error in getSearchLogs:', error);
      throw error;
    }
  }

  // Get detailed activity log for a specific search execution
  static async getSearchActivityLog(executionId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('search_activity_logs')
        .select('*')
        .eq('execution_id', executionId)
        .order('timestamp', { ascending: true });

      if (error) {
        // Handle missing table gracefully
        if (error.message.includes('relation "search_activity_logs" does not exist')) {
          console.log('search_activity_logs table does not exist yet, returning empty array');
          return [];
        }
        console.error('Error fetching search activity log:', error);
        return [];
      }

      return data?.map((log: any) => ({
        id: log.id,
        type: log.log_type,
        message: log.message,
        details: log.details,
        timestamp: log.timestamp
      })) || [];
    } catch (error) {
      console.error('Error fetching search activity log:', error);
      return []; // Return empty array instead of throwing to prevent UI crashes
    }
  }

  // Real-time subscription to search status changes
  static subscribeToSearchUpdates(callback: (update: any) => void) {
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
          console.log('Search execution update:', payload);
          callback(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  // Real-time subscription to activity logs for a specific execution
  static subscribeToActivityLogs(executionId: string, callback: (log: any) => void) {
    const channel = supabase
      .channel(`activity-logs-${executionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'search_activity_logs',
          filter: `execution_id=eq.${executionId}`
        },
        (payload) => {
          console.log('New activity log:', payload);
          if (payload.new) {
            callback({
              id: payload.new.id,
              type: payload.new.log_type,
              message: payload.new.message,
              details: payload.new.details,
              timestamp: payload.new.timestamp
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  // Update search progress (called from search execution)
  static async updateSearchProgress(
    searchId: string, 
    progress: {
      current_step: string;
      total_steps: number;
      completed_steps: number;
      current_url?: string;
      results_found: number;
    }
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('search_execution_log')
        .update({
          progress_data: progress,
          updated_at: new Date().toISOString()
        })
        .eq('id', searchId);

      if (error) {
        console.error('Error updating search progress:', error);
        throw new Error('Failed to update search progress');
      }
    } catch (error) {
      console.error('Error in updateSearchProgress:', error);
      throw error;
    }
  }

  // Log search activity with detailed info
  static async logSearchActivity(
    searchId: string,
    activity: {
      type: 'info' | 'warning' | 'error' | 'success';
      message: string;
      details?: any;
      url?: string;
    }
  ): Promise<void> {
    try {
      // First, get current logs
      const { data: currentLog } = await supabase
        .from('search_execution_log')
        .select('activity_log')
        .eq('id', searchId)
        .single();

      const currentLogs = currentLog?.activity_log || [];
      const newLog = {
        timestamp: new Date().toISOString(),
        ...activity
      };

      // Append new log entry
      const updatedLogs = [...currentLogs, newLog];

      const { error } = await supabase
        .from('search_execution_log')
        .update({
          activity_log: updatedLogs,
          updated_at: new Date().toISOString()
        })
        .eq('id', searchId);

      if (error) {
        console.error('Error logging search activity:', error);
      }
    } catch (error) {
      console.error('Error in logSearchActivity:', error);
    }
  }

  // Get comprehensive search statistics
  static async getSearchStatistics(timeRange: 'day' | 'week' | 'month' = 'week'): Promise<{
    total_searches: number;
    active_searches: number;
    completed_searches: number;
    failed_searches: number;
    avg_execution_time: number;
    total_results_found: number;
    top_job_boards: Array<{ board: string; count: number }>;
    hourly_distribution: Array<{ hour: number; count: number }>;
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Calculate date range
      const now = new Date();
      const startDate = new Date();
      switch (timeRange) {
        case 'day':
          startDate.setDate(now.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
      }

      // Get search execution data
      const { data: searchLogs, error } = await supabase
        .from('search_execution_log')
        .select(`
          *,
          enhanced_job_searches!inner (
            user_id,
            selected_job_boards
          )
        `)
        .eq('enhanced_job_searches.user_id', user.id)
        .gte('started_at', startDate.toISOString());

      if (error) {
        throw new Error('Failed to fetch search statistics');
      }

      // Calculate statistics
      const logs = searchLogs || [];
      const total_searches = logs.length;
      const active_searches = logs.filter(l => ['pending', 'running'].includes(l.status)).length;
      const completed_searches = logs.filter(l => l.status === 'completed').length;
      const failed_searches = logs.filter(l => l.status === 'failed').length;
      
      const completedLogs = logs.filter(l => l.execution_time_ms);
      const avg_execution_time = completedLogs.length > 0 
        ? completedLogs.reduce((sum, l) => sum + l.execution_time_ms, 0) / completedLogs.length 
        : 0;
      
      const total_results_found = logs.reduce((sum, l) => sum + (l.total_results_found || 0), 0);

      // Job board distribution
      const jobBoardCounts: { [key: string]: number } = {};
      logs.forEach(log => {
        const boards = log.enhanced_job_searches?.selected_job_boards || [];
        boards.forEach((board: string) => {
          jobBoardCounts[board] = (jobBoardCounts[board] || 0) + 1;
        });
      });
      
      const top_job_boards = Object.entries(jobBoardCounts)
        .map(([board, count]) => ({ board, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Hourly distribution
      const hourlyData: { [key: number]: number } = {};
      logs.forEach(log => {
        const hour = new Date(log.started_at).getHours();
        hourlyData[hour] = (hourlyData[hour] || 0) + 1;
      });
      
      const hourly_distribution = Array.from({ length: 24 }, (_, hour) => ({
        hour,
        count: hourlyData[hour] || 0
      }));

      return {
        total_searches,
        active_searches,
        completed_searches,
        failed_searches,
        avg_execution_time,
        total_results_found,
        top_job_boards,
        hourly_distribution
      };
    } catch (error) {
      console.error('Error fetching search statistics:', error);
      throw error;
    }
  }
}