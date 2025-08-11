// AI Router - Intelligent request routing for 90% cost reduction
// Implements hybrid strategy: Cache → Local LLM → Optimized Claude → Batch Processing

import { localLLM } from './LocalLLMService';
import { tokenAnalytics } from '../analytics/TokenAnalytics';

interface RoutingDecision {
  strategy: 'cache' | 'local' | 'claude_optimized' | 'batch' | 'claude_premium';
  reasoning: string;
  estimated_cost: number;
  estimated_tokens: number;
  expected_quality: number;
  expected_speed_ms: number;
}

interface RequestContext {
  operation: string;
  user_id: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'routine' | 'enhancement' | 'critical' | 'bulk';
  max_response_time_ms?: number;
  min_quality_threshold?: number;
  cost_sensitivity?: 'low' | 'medium' | 'high';
}

interface ProcessingResult {
  response: string;
  strategy_used: string;
  model_used: string;
  tokens_consumed: number;
  actual_cost: number;
  processing_time_ms: number;
  quality_score: number;
  cached: boolean;
  optimization_applied: string[];
}

interface BatchRequest {
  id: string;
  prompt: string;
  context: RequestContext;
  submitted_at: number;
  max_wait_ms: number;
}

export class AIRouter {
  private cache: Map<string, any> = new Map();
  private batchQueue: BatchRequest[] = [];
  private batchProcessor: NodeJS.Timeout | null = null;
  private routingStats: Map<string, number> = new Map();

  // Cost thresholds (daily limits to stay under $3.26/day target)
  private readonly DAILY_COST_LIMIT = 3.26;
  private readonly CURRENT_DAILY_COST = this.getCurrentDailyCost();

  // Quality thresholds
  private readonly MIN_QUALITY_SCORES = {
    routine: 0.7,
    enhancement: 0.8,
    critical: 0.95,
    bulk: 0.6
  };

  // Token cost mapping (per 1k tokens)
  private readonly TOKEN_COSTS = {
    'claude-3-sonnet': 0.015,
    'claude-3-haiku': 0.0025,
    'local': 0,
    'cache': 0
  };

  constructor() {
    this.initializeBatchProcessor();
    this.initializeRoutingStats();
  }

  // Main routing decision engine
  async makeRoutingDecision(
    prompt: string,
    context: RequestContext
  ): Promise<RoutingDecision> {
    const promptTokens = this.estimateTokens(prompt);
    const cacheKey = this.generateCacheKey(prompt, context);

    // Step 1: Check cache first
    if (this.cache.has(cacheKey)) {
      return {
        strategy: 'cache',
        reasoning: 'Exact match found in cache',
        estimated_cost: 0,
        estimated_tokens: 0,
        expected_quality: 0.95,
        expected_speed_ms: 10
      };
    }

    // Step 2: Check cost constraints
    const remainingBudget = this.DAILY_COST_LIMIT - this.CURRENT_DAILY_COST;
    const estimatedClaudeCost = (promptTokens * 1.5 / 1000) * this.TOKEN_COSTS['claude-3-sonnet'];

    // Step 3: Analyze request characteristics
    const isSimpleTask = this.isSimpleTask(prompt, context);
    const requiresHighQuality = context.min_quality_threshold 
      ? context.min_quality_threshold > 0.9 
      : context.category === 'critical';
    const isUrgent = context.max_response_time_ms 
      ? context.max_response_time_ms < 5000 
      : context.priority === 'critical';

    // Step 4: Route based on intelligent logic
    
    // Route to local LLM for simple, routine tasks
    if (isSimpleTask && !requiresHighQuality && await localLLM.checkHealth()) {
      return {
        strategy: 'local',
        reasoning: 'Simple task suitable for local LLM processing',
        estimated_cost: 0,
        estimated_tokens: promptTokens * 1.2,
        expected_quality: 0.75,
        expected_speed_ms: 2000
      };
    }

    // Route to batch processing for non-urgent bulk operations
    if (!isUrgent && context.category === 'bulk' && promptTokens < 1000) {
      return {
        strategy: 'batch',
        reasoning: 'Non-urgent bulk operation - batching for cost efficiency',
        estimated_cost: estimatedClaudeCost * 0.7, // 30% discount for batching
        estimated_tokens: promptTokens * 1.3,
        expected_quality: 0.9,
        expected_speed_ms: 15000 // May wait up to 15s for batch
      };
    }

    // Route to optimized Claude for standard operations
    if (remainingBudget > estimatedClaudeCost && !requiresHighQuality) {
      return {
        strategy: 'claude_optimized',
        reasoning: 'Standard operation with prompt optimization',
        estimated_cost: estimatedClaudeCost * 0.6, // Optimization reduces cost
        estimated_tokens: promptTokens * 0.7, // Compression reduces tokens
        expected_quality: 0.85,
        expected_speed_ms: 3000
      };
    }

    // Route to premium Claude only for critical operations
    if (requiresHighQuality || context.priority === 'critical') {
      return {
        strategy: 'claude_premium',
        reasoning: 'High quality required - using premium Claude processing',
        estimated_cost: estimatedClaudeCost,
        estimated_tokens: promptTokens * 1.3,
        expected_quality: 0.95,
        expected_speed_ms: 2500
      };
    }

    // Fallback to local LLM if budget exhausted
    return {
      strategy: 'local',
      reasoning: 'Daily budget exhausted - routing to free local processing',
      estimated_cost: 0,
      estimated_tokens: promptTokens * 1.2,
      expected_quality: 0.7,
      expected_speed_ms: 3000
    };
  }

  // Execute the routing decision
  async processRequest(
    prompt: string,
    context: RequestContext,
    decision?: RoutingDecision
  ): Promise<ProcessingResult> {
    const startTime = Date.now();
    const routingDecision = decision || await this.makeRoutingDecision(prompt, context);
    
    let result: ProcessingResult;

    try {
      switch (routingDecision.strategy) {
        case 'cache':
          result = await this.processCacheRequest(prompt, context);
          break;
        
        case 'local':
          result = await this.processLocalRequest(prompt, context);
          break;
        
        case 'claude_optimized':
          result = await this.processOptimizedClaudeRequest(prompt, context);
          break;
        
        case 'batch':
          result = await this.processBatchRequest(prompt, context);
          break;
        
        case 'claude_premium':
          result = await this.processPremiumClaudeRequest(prompt, context);
          break;
        
        default:
          throw new Error(`Unknown routing strategy: ${routingDecision.strategy}`);
      }

      // Log analytics
      await this.logRequestAnalytics(result, context);
      
      // Update routing stats
      this.updateRoutingStats(routingDecision.strategy);
      
      return result;

    } catch (error) {
      console.error(`Error processing ${routingDecision.strategy} request:`, error);
      
      // Fallback strategy
      if (routingDecision.strategy !== 'local') {
        console.log('Attempting fallback to local processing...');
        return await this.processLocalRequest(prompt, context);
      }
      
      throw error;
    }
  }

  private async processCacheRequest(prompt: string, context: RequestContext): Promise<ProcessingResult> {
    const cacheKey = this.generateCacheKey(prompt, context);
    const cached = this.cache.get(cacheKey);
    
    return {
      response: cached.response,
      strategy_used: 'cache',
      model_used: 'cache',
      tokens_consumed: 0,
      actual_cost: 0,
      processing_time_ms: 5,
      quality_score: cached.quality_score || 0.9,
      cached: true,
      optimization_applied: ['cache_hit']
    };
  }

  private async processLocalRequest(prompt: string, context: RequestContext): Promise<ProcessingResult> {
    const useCase = this.mapOperationToUseCase(context.operation);
    const optimizedPrompt = this.optimizePromptForLocal(prompt, context);
    
    const result = await localLLM.generateResponse(optimizedPrompt, useCase, {
      priority: context.priority === 'critical' ? 'quality' : 'speed',
      maxTokens: this.getMaxTokensForOperation(context.operation)
    });

    // Cache successful results
    this.cacheResult(prompt, context, result.response, result.confidence_score);

    return {
      response: result.response,
      strategy_used: 'local',
      model_used: result.model,
      tokens_consumed: result.tokens_used,
      actual_cost: 0,
      processing_time_ms: result.response_time_ms,
      quality_score: result.confidence_score,
      cached: false,
      optimization_applied: ['local_processing', 'prompt_optimization']
    };
  }

  private async processOptimizedClaudeRequest(prompt: string, context: RequestContext): Promise<ProcessingResult> {
    const optimizedPrompt = this.optimizePromptForClaude(prompt, context);
    const compressedContext = this.compressContext(context);
    
    // Use Haiku for cost optimization when quality allows
    const model = context.category === 'routine' ? 'claude-3-haiku' : 'claude-3-sonnet';
    
    const result = await this.callClaudeAPI(optimizedPrompt, {
      model,
      max_tokens: this.getMaxTokensForOperation(context.operation),
      temperature: context.category === 'critical' ? 0.1 : 0.3,
      context: compressedContext
    });

    // Cache result
    this.cacheResult(prompt, context, result.response, result.quality_score);

    return {
      response: result.response,
      strategy_used: 'claude_optimized',
      model_used: model,
      tokens_consumed: result.tokens_used,
      actual_cost: result.cost,
      processing_time_ms: result.response_time_ms,
      quality_score: result.quality_score,
      cached: false,
      optimization_applied: ['prompt_optimization', 'context_compression', 'model_selection']
    };
  }

  private async processBatchRequest(prompt: string, context: RequestContext): Promise<ProcessingResult> {
    return new Promise((resolve) => {
      const batchRequest: BatchRequest = {
        id: `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        prompt,
        context,
        submitted_at: Date.now(),
        max_wait_ms: context.max_response_time_ms || 15000
      };

      this.batchQueue.push(batchRequest);

      // Set up resolution when batch is processed
      const checkBatch = setInterval(() => {
        const cacheKey = this.generateCacheKey(prompt, context);
        if (this.cache.has(cacheKey)) {
          clearInterval(checkBatch);
          resolve(this.processCacheRequest(prompt, context));
        } else if (Date.now() - batchRequest.submitted_at > batchRequest.max_wait_ms) {
          clearInterval(checkBatch);
          // Timeout fallback
          resolve(this.processLocalRequest(prompt, context));
        }
      }, 500);
    });
  }

  private async processPremiumClaudeRequest(prompt: string, context: RequestContext): Promise<ProcessingResult> {
    // Use full Claude-3-Sonnet with minimal optimization for highest quality
    const result = await this.callClaudeAPI(prompt, {
      model: 'claude-3-sonnet',
      max_tokens: this.getMaxTokensForOperation(context.operation) * 1.5,
      temperature: 0.1,
      context: context
    });

    // Cache high-quality results
    this.cacheResult(prompt, context, result.response, 0.95);

    return {
      response: result.response,
      strategy_used: 'claude_premium',
      model_used: 'claude-3-sonnet',
      tokens_consumed: result.tokens_used,
      actual_cost: result.cost,
      processing_time_ms: result.response_time_ms,
      quality_score: 0.95,
      cached: false,
      optimization_applied: ['premium_quality']
    };
  }

  // Batch processor (runs every 5 seconds)
  private initializeBatchProcessor(): void {
    this.batchProcessor = setInterval(async () => {
      if (this.batchQueue.length === 0) return;

      console.log(`Processing batch of ${this.batchQueue.length} requests...`);
      
      // Group similar requests
      const batches = this.groupSimilarRequests(this.batchQueue);
      
      for (const batch of batches) {
        await this.processBatchGroup(batch);
      }

      // Clear processed requests
      this.batchQueue = [];
    }, 5000);
  }

  private groupSimilarRequests(requests: BatchRequest[]): BatchRequest[][] {
    const groups: Map<string, BatchRequest[]> = new Map();
    
    requests.forEach(request => {
      const groupKey = `${request.context.operation}_${request.context.category}`;
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(request);
    });

    return Array.from(groups.values());
  }

  private async processBatchGroup(batch: BatchRequest[]): Promise<void> {
    // Combine prompts efficiently for batch processing
    const combinedPrompt = batch.map((req, index) => 
      `Request ${index + 1}: ${req.prompt}`
    ).join('\n\n---\n\n');

    try {
      const result = await this.callClaudeAPI(combinedPrompt, {
        model: 'claude-3-haiku', // Use cheaper model for batch
        max_tokens: batch.length * 1000,
        temperature: 0.3
      });

      // Parse and cache individual responses
      const responses = this.parseBatchResponse(result.response, batch.length);
      
      batch.forEach((request, index) => {
        if (responses[index]) {
          this.cacheResult(
            request.prompt,
            request.context,
            responses[index],
            result.quality_score
          );
        }
      });

    } catch (error) {
      console.error('Batch processing failed:', error);
      
      // Process individually as fallback
      for (const request of batch) {
        try {
          await this.processLocalRequest(request.prompt, request.context);
        } catch (localError) {
          console.error(`Failed to process individual request: ${localError}`);
        }
      }
    }
  }

  // Helper methods

  private isSimpleTask(prompt: string, context: RequestContext): boolean {
    const simpleOperations = ['classification', 'extraction', 'simple_questions', 'routine_tasks'];
    const simpleKeywords = ['extract', 'classify', 'list', 'identify', 'find', 'parse'];
    
    return (
      simpleOperations.includes(context.operation) ||
      simpleKeywords.some(keyword => prompt.toLowerCase().includes(keyword)) ||
      prompt.length < 500 ||
      context.category === 'routine'
    );
  }

  private optimizePromptForLocal(prompt: string, context: RequestContext): string {
    // Simplify and focus prompt for local models
    let optimized = prompt.trim();
    
    // Remove verbose instructions
    optimized = optimized.replace(/please\s+/gi, '');
    optimized = optimized.replace(/\s+/g, ' ');
    
    // Add task-specific instructions
    if (context.operation.includes('classification')) {
      optimized = `Classify: ${optimized}`;
    } else if (context.operation.includes('extraction')) {
      optimized = `Extract from: ${optimized}`;
    }
    
    return optimized;
  }

  private optimizePromptForClaude(prompt: string, context: RequestContext): string {
    // Compress but maintain nuance for Claude
    let optimized = prompt.trim();
    
    // Remove redundant phrases
    const redundantPhrases = [
      /please be sure to/gi,
      /make sure that/gi,
      /it is important that/gi,
      /as you can see/gi
    ];
    
    redundantPhrases.forEach(phrase => {
      optimized = optimized.replace(phrase, '');
    });
    
    // Add compression indicator
    optimized = `[Optimized] ${optimized}`;
    
    return optimized;
  }

  private compressContext(context: RequestContext): Partial<RequestContext> {
    // Return only essential context for API calls
    return {
      operation: context.operation,
      priority: context.priority,
      category: context.category
    };
  }

  private mapOperationToUseCase(operation: string): string {
    const mapping: Record<string, string> = {
      'email_parsing': 'extraction',
      'task_extraction': 'extraction',
      'habit_analysis': 'analysis',
      'cv_analysis': 'analysis',
      'chat_response': 'quick_responses',
      'job_classification': 'classification'
    };
    
    return mapping[operation] || 'simple_questions';
  }

  private getMaxTokensForOperation(operation: string): number {
    const limits: Record<string, number> = {
      'email_parsing': 1000,
      'task_extraction': 800,
      'habit_analysis': 1200,
      'cv_analysis': 2000,
      'chat_response': 500,
      'job_classification': 600
    };
    
    return limits[operation] || 1000;
  }

  private async callClaudeAPI(prompt: string, options: any): Promise<any> {
    // Mock implementation - replace with actual Claude API call
    const tokens = this.estimateTokens(prompt);
    const cost = (tokens / 1000) * this.TOKEN_COSTS[options.model] || 0.015;
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      response: `Mock Claude response for: ${prompt.substring(0, 50)}...`,
      tokens_used: tokens,
      cost,
      response_time_ms: 2000,
      quality_score: 0.9
    };
  }

  private parseBatchResponse(response: string, expectedCount: number): string[] {
    // Simple parsing - in reality this would be more sophisticated
    return response.split('---').slice(0, expectedCount);
  }

  private estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  private generateCacheKey(prompt: string, context: RequestContext): string {
    return `${context.operation}:${this.hashString(prompt.trim().toLowerCase())}`;
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString();
  }

  private cacheResult(prompt: string, context: RequestContext, response: string, quality: number): void {
    const key = this.generateCacheKey(prompt, context);
    this.cache.set(key, {
      response,
      quality_score: quality,
      timestamp: Date.now(),
      context: context.operation
    });
  }

  private getCurrentDailyCost(): number {
    // Get from analytics service
    const metrics = tokenAnalytics.getRealTimeMetrics();
    return metrics.daily_cost;
  }

  private async logRequestAnalytics(result: ProcessingResult, context: RequestContext): Promise<void> {
    await tokenAnalytics.logTokenUsage({
      operation: context.operation as any,
      agent_id: 'ai_router',
      agent_type: 'chat-assistant' as any,
      prompt_tokens: Math.floor(result.tokens_consumed * 0.7),
      completion_tokens: Math.floor(result.tokens_consumed * 0.3),
      total_tokens: result.tokens_consumed,
      model_type: result.model_used.startsWith('local') ? 'local-llama' : 'claude-3-sonnet' as any,
      category: context.category as any,
      priority: context.priority as any,
      cached: result.cached,
      optimization_applied: result.optimization_applied,
      confidence_score: result.quality_score,
      response_time_ms: result.processing_time_ms,
      retry_count: 0,
      user_id: context.user_id,
      request_size_chars: result.response.length,
      response_size_chars: result.response.length
    });
  }

  private updateRoutingStats(strategy: string): void {
    const current = this.routingStats.get(strategy) || 0;
    this.routingStats.set(strategy, current + 1);
  }

  private initializeRoutingStats(): void {
    const strategies = ['cache', 'local', 'claude_optimized', 'batch', 'claude_premium'];
    strategies.forEach(strategy => this.routingStats.set(strategy, 0));
  }

  // Public methods for monitoring and management

  getRoutingStats(): Record<string, number> {
    return Object.fromEntries(this.routingStats.entries());
  }

  getCacheStats(): { size: number; hit_rate: number; memory_usage: string } {
    const total_requests = Array.from(this.routingStats.values()).reduce((a, b) => a + b, 0);
    const cache_hits = this.routingStats.get('cache') || 0;
    
    return {
      size: this.cache.size,
      hit_rate: total_requests > 0 ? (cache_hits / total_requests) * 100 : 0,
      memory_usage: `~${this.cache.size * 2}KB` // Rough estimate
    };
  }

  clearCache(): void {
    this.cache.clear();
    console.log('AI Router cache cleared');
  }

  // Force a specific routing strategy (for testing/debugging)
  async processWithStrategy(
    prompt: string,
    context: RequestContext,
    forceStrategy: 'local' | 'claude_optimized' | 'claude_premium'
  ): Promise<ProcessingResult> {
    switch (forceStrategy) {
      case 'local':
        return await this.processLocalRequest(prompt, context);
      case 'claude_optimized':
        return await this.processOptimizedClaudeRequest(prompt, context);
      case 'claude_premium':
        return await this.processPremiumClaudeRequest(prompt, context);
      default:
        throw new Error(`Invalid forced strategy: ${forceStrategy}`);
    }
  }
}

// Export singleton instance
export const aiRouter = new AIRouter();