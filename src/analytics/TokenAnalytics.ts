// Token Analytics - Granular tracking and optimization insights
// Detailed monitoring of token usage across all AI operations

import { supabase } from '../lib/supabase';

export interface TokenUsageRecord {
  id: string;
  timestamp: string;
  operation: 'email_parsing' | 'task_extraction' | 'habit_analysis' | 'job_classification' | 'cv_analysis' | 'chat_response';
  agent_id: string;
  agent_type: 'job-finder' | 'task-extractor' | 'habit-tracker' | 'cv-parser' | 'chat-assistant';
  
  // Token breakdown
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  
  // Cost tracking
  cost: number;
  model_type: 'claude-3-sonnet' | 'claude-3-haiku' | 'gpt-4' | 'local-llama' | 'local-mistral' | 'local-phi3';
  
  // Classification
  category: 'critical' | 'enhancement' | 'routine' | 'bulk';
  priority: 'high' | 'medium' | 'low';
  
  // Optimization metrics
  cached: boolean;
  cache_hit_rate?: number;
  optimization_applied: string[]; // ['prompt_compression', 'context_reduction', 'local_routing']
  
  // Quality metrics
  confidence_score?: number;
  user_satisfaction?: number;
  
  // Performance
  response_time_ms: number;
  retry_count: number;
  
  // Context
  user_id: string;
  session_id?: string;
  request_size_chars: number;
  response_size_chars: number;
}

export interface TokenAnalytics {
  daily_usage: {
    date: string;
    total_tokens: number;
    total_cost: number;
    operations_count: number;
    avg_tokens_per_operation: number;
  }[];
  
  pipeline_breakdown: {
    email_parsing: { tokens: number; percentage: number; cost: number };
    task_extraction: { tokens: number; percentage: number; cost: number };
    habit_analysis: { tokens: number; percentage: number; cost: number };
    cv_analysis: { tokens: number; percentage: number; cost: number };
    chat_responses: { tokens: number; percentage: number; cost: number };
    other: { tokens: number; percentage: number; cost: number };
  };
  
  model_distribution: {
    model: string;
    tokens: number;
    cost: number;
    percentage: number;
    avg_response_time: number;
  }[];
  
  optimization_impact: {
    total_savings_tokens: number;
    total_savings_cost: number;
    cache_hit_rate: number;
    local_processing_rate: number;
    prompt_compression_savings: number;
  };
  
  waste_identification: {
    repeated_queries: number;
    unnecessary_context_tokens: number;
    verbose_prompt_waste: number;
    redundant_processing_instances: number;
  };
}

export class TokenAnalyticsService {
  private records: TokenUsageRecord[] = [];
  private cache = new Map<string, any>();
  
  // Token cost mapping (per 1k tokens)
  private readonly TOKEN_COSTS = {
    'claude-3-sonnet': 0.015,
    'claude-3-haiku': 0.0025,
    'gpt-4': 0.03,
    'local-llama': 0,
    'local-mistral': 0,
    'local-phi3': 0
  };

  async logTokenUsage(record: Omit<TokenUsageRecord, 'id' | 'timestamp' | 'cost'>): Promise<void> {
    const fullRecord: TokenUsageRecord = {
      ...record,
      id: `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      cost: this.calculateCost(record.total_tokens, record.model_type)
    };

    this.records.push(fullRecord);
    
    // Store in database for persistence
    await this.storeRecord(fullRecord);
    
    // Real-time optimization suggestions
    this.analyzeForOptimizations(fullRecord);
  }

  private calculateCost(tokens: number, modelType: string): number {
    const costPerThousand = this.TOKEN_COSTS[modelType as keyof typeof this.TOKEN_COSTS] || 0;
    return (tokens / 1000) * costPerThousand;
  }

  private async storeRecord(record: TokenUsageRecord): Promise<void> {
    try {
      // Store in Supabase for persistent analytics
      const { error } = await supabase
        .from('token_usage_analytics')
        .insert([record]);
      
      if (error) console.error('Error storing token analytics:', error);
    } catch (error) {
      console.error('Failed to store token record:', error);
    }
  }

  generateAnalytics(timeRange: 'day' | 'week' | 'month' = 'day'): TokenAnalytics {
    const now = new Date();
    const startTime = new Date(now);
    
    switch (timeRange) {
      case 'day':
        startTime.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startTime.setDate(now.getDate() - 7);
        break;
      case 'month':
        startTime.setDate(now.getDate() - 30);
        break;
    }

    const relevantRecords = this.records.filter(
      record => new Date(record.timestamp) >= startTime
    );

    return {
      daily_usage: this.calculateDailyUsage(relevantRecords),
      pipeline_breakdown: this.calculatePipelineBreakdown(relevantRecords),
      model_distribution: this.calculateModelDistribution(relevantRecords),
      optimization_impact: this.calculateOptimizationImpact(relevantRecords),
      waste_identification: this.identifyWaste(relevantRecords)
    };
  }

  private calculateDailyUsage(records: TokenUsageRecord[]): TokenAnalytics['daily_usage'] {
    const dailyData = new Map<string, {
      tokens: number;
      cost: number;
      operations: number;
    }>();

    records.forEach(record => {
      const date = record.timestamp.split('T')[0];
      const existing = dailyData.get(date) || { tokens: 0, cost: 0, operations: 0 };
      
      dailyData.set(date, {
        tokens: existing.tokens + record.total_tokens,
        cost: existing.cost + record.cost,
        operations: existing.operations + 1
      });
    });

    return Array.from(dailyData.entries()).map(([date, data]) => ({
      date,
      total_tokens: data.tokens,
      total_cost: data.cost,
      operations_count: data.operations,
      avg_tokens_per_operation: Math.round(data.tokens / data.operations)
    }));
  }

  private calculatePipelineBreakdown(records: TokenUsageRecord[]): TokenAnalytics['pipeline_breakdown'] {
    const totalTokens = records.reduce((sum, r) => sum + r.total_tokens, 0);
    const breakdown = {
      email_parsing: { tokens: 0, cost: 0 },
      task_extraction: { tokens: 0, cost: 0 },
      habit_analysis: { tokens: 0, cost: 0 },
      cv_analysis: { tokens: 0, cost: 0 },
      chat_responses: { tokens: 0, cost: 0 },
      other: { tokens: 0, cost: 0 }
    };

    records.forEach(record => {
      const category = this.mapOperationToCategory(record.operation);
      breakdown[category].tokens += record.total_tokens;
      breakdown[category].cost += record.cost;
    });

    // Calculate percentages
    Object.keys(breakdown).forEach(key => {
      const category = breakdown[key as keyof typeof breakdown];
      category.percentage = totalTokens > 0 ? (category.tokens / totalTokens) * 100 : 0;
    });

    return breakdown;
  }

  private mapOperationToCategory(operation: string): keyof TokenAnalytics['pipeline_breakdown'] {
    const mapping: Record<string, keyof TokenAnalytics['pipeline_breakdown']> = {
      'email_parsing': 'email_parsing',
      'task_extraction': 'task_extraction', 
      'habit_analysis': 'habit_analysis',
      'cv_analysis': 'cv_analysis',
      'chat_response': 'chat_responses'
    };
    return mapping[operation] || 'other';
  }

  private calculateModelDistribution(records: TokenUsageRecord[]): TokenAnalytics['model_distribution'] {
    const modelStats = new Map<string, {
      tokens: number;
      cost: number;
      response_times: number[];
    }>();

    records.forEach(record => {
      const existing = modelStats.get(record.model_type) || {
        tokens: 0,
        cost: 0,
        response_times: []
      };
      
      modelStats.set(record.model_type, {
        tokens: existing.tokens + record.total_tokens,
        cost: existing.cost + record.cost,
        response_times: [...existing.response_times, record.response_time_ms]
      });
    });

    const totalTokens = records.reduce((sum, r) => sum + r.total_tokens, 0);

    return Array.from(modelStats.entries()).map(([model, stats]) => ({
      model,
      tokens: stats.tokens,
      cost: stats.cost,
      percentage: totalTokens > 0 ? (stats.tokens / totalTokens) * 100 : 0,
      avg_response_time: stats.response_times.length > 0 
        ? stats.response_times.reduce((a, b) => a + b, 0) / stats.response_times.length
        : 0
    }));
  }

  private calculateOptimizationImpact(records: TokenUsageRecord[]): TokenAnalytics['optimization_impact'] {
    const cachedRecords = records.filter(r => r.cached);
    const localRecords = records.filter(r => r.model_type.startsWith('local-'));
    const compressedRecords = records.filter(r => 
      r.optimization_applied.includes('prompt_compression')
    );

    // Estimate savings (tokens that would have been used without optimizations)
    const estimatedOriginalTokens = records.reduce((sum, record) => {
      let multiplier = 1;
      if (record.cached) multiplier *= 0.1; // Cache saves 90%
      if (record.model_type.startsWith('local-')) multiplier *= 0; // Local is free
      if (record.optimization_applied.includes('prompt_compression')) multiplier *= 0.5; // Compression saves 50%
      
      return sum + (record.total_tokens / multiplier);
    }, 0);

    const actualTokens = records.reduce((sum, r) => sum + r.total_tokens, 0);
    const tokenSavings = estimatedOriginalTokens - actualTokens;
    const costSavings = records.reduce((sum, record) => {
      const originalCost = this.calculateCost(record.total_tokens, 'claude-3-sonnet');
      return sum + (originalCost - record.cost);
    }, 0);

    return {
      total_savings_tokens: Math.round(tokenSavings),
      total_savings_cost: Math.round(costSavings * 100) / 100,
      cache_hit_rate: records.length > 0 ? (cachedRecords.length / records.length) * 100 : 0,
      local_processing_rate: records.length > 0 ? (localRecords.length / records.length) * 100 : 0,
      prompt_compression_savings: Math.round(compressedRecords.reduce((sum, r) => 
        sum + (r.total_tokens * 0.5), 0)) // Estimate 50% compression savings
    };
  }

  private identifyWaste(records: TokenUsageRecord[]): TokenAnalytics['waste_identification'] {
    // Identify repeated queries (same operation within 1 hour)
    const repeatedQueries = new Map<string, number>();
    const oneHour = 60 * 60 * 1000;
    
    records.forEach(record => {
      const key = `${record.operation}_${record.user_id}`;
      const recentSimilar = records.filter(r => 
        r.operation === record.operation &&
        r.user_id === record.user_id &&
        new Date(record.timestamp).getTime() - new Date(r.timestamp).getTime() < oneHour
      );
      
      if (recentSimilar.length > 1) {
        repeatedQueries.set(key, recentSimilar.length);
      }
    });

    // Estimate unnecessary context (requests with >1000 prompt tokens)
    const unnecessaryContextTokens = records
      .filter(r => r.prompt_tokens > 1000)
      .reduce((sum, r) => sum + (r.prompt_tokens - 1000), 0);

    // Verbose prompt waste (completion tokens < 10% of prompt tokens)
    const verbosePrompts = records.filter(r => 
      r.completion_tokens < (r.prompt_tokens * 0.1)
    );
    const verboseWaste = verbosePrompts.reduce((sum, r) => 
      sum + (r.prompt_tokens - (r.completion_tokens * 10)), 0
    );

    return {
      repeated_queries: Array.from(repeatedQueries.values()).reduce((a, b) => a + b, 0),
      unnecessary_context_tokens: unnecessaryContextTokens,
      verbose_prompt_waste: Math.max(0, verboseWaste),
      redundant_processing_instances: repeatedQueries.size
    };
  }

  private analyzeForOptimizations(record: TokenUsageRecord): void {
    const suggestions: string[] = [];

    // High token usage without caching
    if (record.total_tokens > 2000 && !record.cached) {
      suggestions.push('Consider caching this type of request');
    }

    // Routine operations using expensive models
    if (record.category === 'routine' && record.model_type === 'claude-3-sonnet') {
      suggestions.push('Route routine operations to cheaper models or local LLM');
    }

    // Low completion/prompt ratio
    if (record.completion_tokens < (record.prompt_tokens * 0.2)) {
      suggestions.push('Prompt may be too verbose - consider compression');
    }

    if (suggestions.length > 0) {
      console.log(`Token optimization suggestions for ${record.operation}:`, suggestions);
    }
  }

  // Get real-time metrics for dashboard
  getRealTimeMetrics() {
    const last24h = this.records.filter(r => 
      new Date(r.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    );

    const currentUsage = last24h.reduce((sum, r) => sum + r.cost, 0);
    const tokenCount = last24h.reduce((sum, r) => sum + r.total_tokens, 0);
    
    return {
      daily_cost: Math.round(currentUsage * 100) / 100,
      daily_tokens: tokenCount,
      operations_count: last24h.length,
      avg_cost_per_operation: last24h.length > 0 ? currentUsage / last24h.length : 0,
      cache_hit_rate: last24h.filter(r => r.cached).length / last24h.length * 100,
      local_processing_rate: last24h.filter(r => r.model_type.startsWith('local')).length / last24h.length * 100
    };
  }
}

// Export singleton instance
export const tokenAnalytics = new TokenAnalyticsService();