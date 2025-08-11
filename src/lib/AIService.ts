// AI Service - Wrapper that routes requests through the optimization system
// Integrates AIRouter with existing Supabase function calls

import { aiRouter } from './AIRouter';
import { tokenAnalytics } from '../analytics/TokenAnalytics';
import { supabase } from './supabase';

interface AIServiceOptions {
  operation: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  category?: 'routine' | 'enhancement' | 'critical' | 'bulk';
  max_response_time_ms?: number;
  min_quality_threshold?: number;
  cost_sensitivity?: 'low' | 'medium' | 'high';
  fallback_to_original?: boolean;
}

interface AIResponse {
  message?: string;
  data?: any;
  context?: any;
  metadata: {
    strategy_used: string;
    model_used: string;
    tokens_consumed: number;
    cost: number;
    response_time_ms: number;
    quality_score: number;
  };
}

export class AIService {
  private static instance: AIService;
  private isOptimizationEnabled: boolean = true;
  private fallbackToOriginal: boolean = true;

  private constructor() {}

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  // Main method to replace supabase.functions.invoke calls
  async invokeAI(
    functionName: string,
    payload: any,
    options: AIServiceOptions
  ): Promise<AIResponse> {
    const startTime = Date.now();
    const user = await this.getCurrentUser();
    
    // If optimization is disabled, fallback to original
    if (!this.isOptimizationEnabled) {
      return await this.callOriginalFunction(functionName, payload);
    }

    try {
      // Extract the prompt from the payload
      const prompt = this.extractPromptFromPayload(payload, functionName);
      
      if (!prompt) {
        // If we can't extract a prompt, fallback to original
        return await this.callOriginalFunction(functionName, payload);
      }

      // Create request context for the router
      const requestContext = {
        operation: options.operation,
        user_id: user?.id || 'anonymous',
        priority: options.priority || 'medium',
        category: options.category || 'routine',
        max_response_time_ms: options.max_response_time_ms,
        min_quality_threshold: options.min_quality_threshold,
        cost_sensitivity: options.cost_sensitivity || 'medium'
      };

      // Route through optimization system
      const result = await aiRouter.processRequest(prompt, requestContext);
      
      // Format response to match Supabase function format
      const response: AIResponse = {
        message: result.response,
        data: { message: result.response },
        context: payload.userContext,
        metadata: {
          strategy_used: result.strategy_used,
          model_used: result.model_used,
          tokens_consumed: result.tokens_consumed,
          cost: result.actual_cost,
          response_time_ms: result.processing_time_ms,
          quality_score: result.quality_score
        }
      };

      // Log success metrics
      console.log(`✅ AI request optimized: ${result.strategy_used} (${result.processing_time_ms}ms, $${result.actual_cost.toFixed(4)})`);
      
      return response;

    } catch (error) {
      console.error('❌ AI optimization failed:', error);
      
      // Fallback to original function if enabled
      if (options.fallback_to_original !== false && this.fallbackToOriginal) {
        console.log('🔄 Falling back to original AI function...');
        return await this.callOriginalFunction(functionName, payload);
      }
      
      throw error;
    }
  }

  // Specific method for AI chat (most common use case)
  async invokeChat(
    message: string,
    userContext: any,
    options: Partial<AIServiceOptions> = {}
  ): Promise<AIResponse> {
    return await this.invokeAI('ai-chat', {
      message,
      userContext
    }, {
      operation: 'chat_response',
      priority: 'medium',
      category: 'routine',
      max_response_time_ms: 10000,
      ...options
    });
  }

  // Method for job analysis
  async invokeJobAnalysis(
    jobData: any,
    profileData: any,
    options: Partial<AIServiceOptions> = {}
  ): Promise<AIResponse> {
    return await this.invokeAI('job-discovery', {
      jobData,
      profileData
    }, {
      operation: 'job_classification',
      priority: 'high',
      category: 'critical',
      ...options
    });
  }

  // Method for CV parsing
  async invokeCVParsing(
    cvText: string,
    options: Partial<AIServiceOptions> = {}
  ): Promise<AIResponse> {
    return await this.invokeAI('cv-parser', {
      cvText
    }, {
      operation: 'cv_analysis',
      priority: 'high',
      category: 'critical',
      ...options
    });
  }

  // Method for email parsing
  async invokeEmailParsing(
    emailContent: string,
    options: Partial<AIServiceOptions> = {}
  ): Promise<AIResponse> {
    return await this.invokeAI('email-parser', {
      emailContent
    }, {
      operation: 'email_parsing',
      priority: 'medium',
      category: 'routine',
      ...options
    });
  }

  // Method for task extraction
  async invokeTaskExtraction(
    content: string,
    context: any,
    options: Partial<AIServiceOptions> = {}
  ): Promise<AIResponse> {
    return await this.invokeAI('task-extractor', {
      content,
      context
    }, {
      operation: 'task_extraction',
      priority: 'medium',
      category: 'routine',
      ...options
    });
  }

  // Method for habit analysis
  async invokeHabitAnalysis(
    habitData: any,
    userStats: any,
    options: Partial<AIServiceOptions> = {}
  ): Promise<AIResponse> {
    return await this.invokeAI('habit-analyzer', {
      habitData,
      userStats
    }, {
      operation: 'habit_analysis',
      priority: 'low',
      category: 'routine',
      ...options
    });
  }

  // Helper methods

  private extractPromptFromPayload(payload: any, functionName: string): string {
    // Extract the main text content that would be sent to the AI
    switch (functionName) {
      case 'ai-chat':
        return `User message: ${payload.message}\nContext: ${JSON.stringify(payload.userContext || {})}`;
      
      case 'job-discovery':
        return `Analyze job match: ${JSON.stringify(payload.jobData)} for profile: ${JSON.stringify(payload.profileData)}`;
      
      case 'cv-parser':
        return `Parse CV content: ${payload.cvText}`;
      
      case 'email-parser':
        return `Parse email: ${payload.emailContent}`;
      
      case 'task-extractor':
        return `Extract tasks from: ${payload.content} with context: ${JSON.stringify(payload.context || {})}`;
      
      case 'habit-analyzer':
        return `Analyze habits: ${JSON.stringify(payload.habitData)} with stats: ${JSON.stringify(payload.userStats || {})}`;
      
      default:
        // Generic extraction
        if (payload.message) return payload.message;
        if (payload.content) return payload.content;
        if (payload.text) return payload.text;
        return JSON.stringify(payload);
    }
  }

  private async callOriginalFunction(functionName: string, payload: any): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      // Get current session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: payload,
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) {
        throw error;
      }

      const responseTime = Date.now() - startTime;
      
      // Estimate tokens and cost for analytics
      const estimatedTokens = this.estimateTokens(JSON.stringify(payload) + JSON.stringify(data));
      const estimatedCost = (estimatedTokens / 1000) * 0.015; // Claude-3-Sonnet pricing

      return {
        message: data.message,
        data,
        context: data.context,
        metadata: {
          strategy_used: 'original_supabase_function',
          model_used: 'claude-3-sonnet',
          tokens_consumed: estimatedTokens,
          cost: estimatedCost,
          response_time_ms: responseTime,
          quality_score: 0.9 // Assume high quality for original
        }
      };

    } catch (error) {
      console.error(`Error calling original function ${functionName}:`, error);
      throw error;
    }
  }

  private async getCurrentUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  private estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  // Configuration methods

  setOptimizationEnabled(enabled: boolean): void {
    this.isOptimizationEnabled = enabled;
    console.log(`AI Optimization ${enabled ? 'enabled' : 'disabled'}`);
  }

  setFallbackEnabled(enabled: boolean): void {
    this.fallbackToOriginal = enabled;
    console.log(`AI Fallback ${enabled ? 'enabled' : 'disabled'}`);
  }

  getOptimizationStatus(): {
    optimization_enabled: boolean;
    fallback_enabled: boolean;
    daily_cost: number;
    daily_requests: number;
    optimization_rate: number;
  } {
    const metrics = tokenAnalytics.getRealTimeMetrics();
    
    return {
      optimization_enabled: this.isOptimizationEnabled,
      fallback_enabled: this.fallbackToOriginal,
      daily_cost: metrics.daily_cost,
      daily_requests: metrics.operations_count,
      optimization_rate: metrics.cache_hit_rate + metrics.local_processing_rate
    };
  }

  // Batch processing for multiple AI calls
  async batchInvokeAI(
    requests: Array<{
      functionName: string;
      payload: any;
      options: AIServiceOptions;
    }>
  ): Promise<AIResponse[]> {
    // Process requests in parallel with optimization
    const promises = requests.map(req => 
      this.invokeAI(req.functionName, req.payload, req.options)
    );

    try {
      const results = await Promise.all(promises);
      console.log(`✅ Batch processed ${requests.length} AI requests`);
      return results;
    } catch (error) {
      console.error('❌ Batch AI processing failed:', error);
      throw error;
    }
  }

  // Testing and monitoring methods
  async testOptimizationQuality(
    functionName: string,
    payload: any,
    options: AIServiceOptions
  ): Promise<{
    optimized_response: AIResponse;
    original_response: AIResponse;
    quality_comparison: {
      similarity_score: number;
      cost_savings: number;
      speed_improvement: number;
      recommendation: string;
    };
  }> {
    console.log('🧪 Running A/B test for optimization quality...');

    // Get both optimized and original responses
    const [optimizedResponse, originalResponse] = await Promise.all([
      this.invokeAI(functionName, payload, { ...options, fallback_to_original: false }),
      this.callOriginalFunction(functionName, payload)
    ]);

    // Calculate quality metrics
    const similarity = this.calculateSimilarity(
      optimizedResponse.data?.message || '',
      originalResponse.data?.message || ''
    );

    const costSavings = ((originalResponse.metadata.cost - optimizedResponse.metadata.cost) / originalResponse.metadata.cost) * 100;
    const speedImprovement = ((originalResponse.metadata.response_time_ms - optimizedResponse.metadata.response_time_ms) / originalResponse.metadata.response_time_ms) * 100;

    let recommendation = 'Use optimized version';
    if (similarity < 0.8) {
      recommendation = 'Quality too low - use original';
    } else if (costSavings < 20) {
      recommendation = 'Low cost savings - consider original';
    } else if (speedImprovement < 0) {
      recommendation = 'Slower than original - review optimization';
    }

    return {
      optimized_response: optimizedResponse,
      original_response: originalResponse,
      quality_comparison: {
        similarity_score: similarity,
        cost_savings: Math.round(costSavings * 100) / 100,
        speed_improvement: Math.round(speedImprovement * 100) / 100,
        recommendation
      }
    };
  }

  private calculateSimilarity(text1: string, text2: string): number {
    // Simple similarity calculation (in production, use more sophisticated methods)
    if (!text1 || !text2) return 0;
    
    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);
    
    const intersection = words1.filter(word => words2.includes(word)).length;
    const union = new Set([...words1, ...words2]).size;
    
    return intersection / union;
  }
}

// Export singleton instance
export const aiService = AIService.getInstance();

// Export convenience functions for easy migration
export const invokeOptimizedAI = aiService.invokeAI.bind(aiService);
export const invokeOptimizedChat = aiService.invokeChat.bind(aiService);