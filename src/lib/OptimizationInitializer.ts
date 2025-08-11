// Optimization Initializer - Sets up and configures the token optimization system
// Initializes all services and performs health checks

import { tokenAnalytics } from '../analytics/TokenAnalytics';
import { localLLM } from './LocalLLMService';
import { aiRouter } from './AIRouter';
import { promptOptimizer } from './PromptOptimizer';
import { responseCache } from './ResponseCache';
import { aiService } from './AIService';

interface InitializationStatus {
  analytics: boolean;
  local_llm: boolean;
  router: boolean;
  optimizer: boolean;
  cache: boolean;
  ai_service: boolean;
  overall_health: boolean;
}

interface OptimizationConfig {
  enable_local_llm: boolean;
  enable_caching: boolean;
  enable_optimization: boolean;
  daily_cost_limit: number;
  cache_size_limit: number;
  similarity_threshold: number;
  fallback_enabled: boolean;
}

export class OptimizationInitializer {
  private static instance: OptimizationInitializer;
  private initialized: boolean = false;
  private config: OptimizationConfig;
  private status: InitializationStatus;

  private constructor() {
    this.config = {
      enable_local_llm: true,
      enable_caching: true,
      enable_optimization: true,
      daily_cost_limit: 3.26,
      cache_size_limit: 5000,
      similarity_threshold: 0.85,
      fallback_enabled: true
    };

    this.status = {
      analytics: false,
      local_llm: false,
      router: false,
      optimizer: false,
      cache: false,
      ai_service: false,
      overall_health: false
    };
  }

  static getInstance(): OptimizationInitializer {
    if (!OptimizationInitializer.instance) {
      OptimizationInitializer.instance = new OptimizationInitializer();
    }
    return OptimizationInitializer.instance;
  }

  async initialize(): Promise<InitializationStatus> {
    if (this.initialized) {
      console.log('✅ Optimization system already initialized');
      return this.status;
    }

    console.log('🚀 Initializing token optimization system...');

    try {
      // Initialize services in order of dependency
      await this.initializeAnalytics();
      await this.initializeCache();
      await this.initializeOptimizer();
      await this.initializeLocalLLM();
      await this.initializeRouter();
      await this.initializeAIService();

      // Perform health checks
      await this.performHealthChecks();

      // Load configuration from localStorage if available
      this.loadUserConfig();

      // Warm up the system
      await this.warmUpSystem();

      this.initialized = true;
      this.status.overall_health = this.calculateOverallHealth();

      console.log('✅ Token optimization system initialized successfully');
      this.logInitializationSummary();

      return this.status;

    } catch (error) {
      console.error('❌ Failed to initialize optimization system:', error);
      this.status.overall_health = false;
      throw error;
    }
  }

  private async initializeAnalytics(): Promise<void> {
    try {
      console.log('📊 Initializing token analytics...');
      
      // Test analytics logging
      await tokenAnalytics.logTokenUsage({
        operation: 'system_init',
        agent_id: 'initialization',
        agent_type: 'chat-assistant',
        prompt_tokens: 50,
        completion_tokens: 20,
        total_tokens: 70,
        model_type: 'local-llama',
        category: 'routine',
        priority: 'low',
        cached: false,
        optimization_applied: ['system_init'],
        response_time_ms: 100,
        retry_count: 0,
        user_id: 'system',
        request_size_chars: 200,
        response_size_chars: 100
      });

      this.status.analytics = true;
      console.log('✅ Token analytics initialized');
    } catch (error) {
      console.error('❌ Analytics initialization failed:', error);
      this.status.analytics = false;
    }
  }

  private async initializeCache(): Promise<void> {
    try {
      console.log('💾 Initializing response cache...');

      // Test cache functionality
      await responseCache.set('test_prompt', 'test_response', {
        operation: 'system_test',
        user_id: 'system',
        model_used: 'test',
        quality_score: 1.0,
        token_count: 10,
        processing_cost: 0
      });

      const cached = await responseCache.get('test_prompt', 'system_test', 'system');
      
      if (cached) {
        console.log('✅ Cache test successful');
      } else {
        console.warn('⚠️ Cache test failed - continuing anyway');
      }

      this.status.cache = true;
      console.log('✅ Response cache initialized');
    } catch (error) {
      console.error('❌ Cache initialization failed:', error);
      this.status.cache = false;
    }
  }

  private async initializeOptimizer(): Promise<void> {
    try {
      console.log('⚡ Initializing prompt optimizer...');

      // Test optimization
      const testResult = await promptOptimizer.optimizePrompt(
        'Please analyze this test prompt and provide a comprehensive response with detailed explanations',
        'system_test'
      );

      if (testResult.compression_ratio > 0) {
        console.log(`✅ Prompt optimization test successful (${(testResult.compression_ratio * 100).toFixed(1)}% compression)`);
      }

      this.status.optimizer = true;
      console.log('✅ Prompt optimizer initialized');
    } catch (error) {
      console.error('❌ Optimizer initialization failed:', error);
      this.status.optimizer = false;
    }
  }

  private async initializeLocalLLM(): Promise<void> {
    try {
      console.log('🧠 Initializing local LLM service...');

      if (!this.config.enable_local_llm) {
        console.log('ℹ️ Local LLM disabled in config');
        this.status.local_llm = true; // Mark as "successful" even if disabled
        return;
      }

      // Check Ollama health
      const isHealthy = await localLLM.checkHealth();
      
      if (isHealthy) {
        console.log('✅ Local LLM service is healthy');
        
        // Test a quick response
        try {
          const testResponse = await localLLM.generateQuickResponse(
            'Hello, this is a test message for system initialization.'
          );
          console.log('✅ Local LLM test response successful');
        } catch (testError) {
          console.warn('⚠️ Local LLM test failed but service is healthy:', testError);
        }
      } else {
        console.warn('⚠️ Local LLM service unavailable - will fallback to cloud models');
      }

      this.status.local_llm = isHealthy;
      console.log('✅ Local LLM service initialized');
    } catch (error) {
      console.error('❌ Local LLM initialization failed:', error);
      this.status.local_llm = false;
    }
  }

  private async initializeRouter(): Promise<void> {
    try {
      console.log('🚦 Initializing AI router...');

      // Test routing decision
      const testDecision = await aiRouter.makeRoutingDecision(
        'Test routing decision for system initialization',
        {
          operation: 'system_test',
          user_id: 'system',
          priority: 'low',
          category: 'routine'
        }
      );

      console.log(`✅ Router test decision: ${testDecision.strategy} (${testDecision.reasoning})`);

      this.status.router = true;
      console.log('✅ AI router initialized');
    } catch (error) {
      console.error('❌ Router initialization failed:', error);
      this.status.router = false;
    }
  }

  private async initializeAIService(): Promise<void> {
    try {
      console.log('🤖 Initializing AI service wrapper...');

      // Configure AI service
      aiService.setOptimizationEnabled(this.config.enable_optimization);
      aiService.setFallbackEnabled(this.config.fallback_enabled);

      const status = aiService.getOptimizationStatus();
      console.log('✅ AI service configured:', status);

      this.status.ai_service = true;
      console.log('✅ AI service wrapper initialized');
    } catch (error) {
      console.error('❌ AI service initialization failed:', error);
      this.status.ai_service = false;
    }
  }

  private async performHealthChecks(): Promise<void> {
    console.log('🩺 Performing system health checks...');

    const checks = [
      { name: 'Analytics', status: this.status.analytics },
      { name: 'Cache', status: this.status.cache },
      { name: 'Optimizer', status: this.status.optimizer },
      { name: 'Local LLM', status: this.status.local_llm },
      { name: 'Router', status: this.status.router },
      { name: 'AI Service', status: this.status.ai_service }
    ];

    checks.forEach(check => {
      const icon = check.status ? '✅' : '❌';
      console.log(`${icon} ${check.name}: ${check.status ? 'Healthy' : 'Unhealthy'}`);
    });

    const healthyCount = checks.filter(c => c.status).length;
    console.log(`🩺 Health check complete: ${healthyCount}/${checks.length} services healthy`);
  }

  private calculateOverallHealth(): boolean {
    // Core services that must be working
    const coreServices = [this.status.analytics, this.status.ai_service, this.status.router];
    const coreHealthy = coreServices.every(status => status);

    // Optional services (don't break the system if they fail)
    const optionalServices = [this.status.cache, this.status.optimizer, this.status.local_llm];
    const optionalHealthy = optionalServices.filter(status => status).length;

    return coreHealthy && optionalHealthy >= 2; // At least 2/3 optional services should work
  }

  private loadUserConfig(): void {
    try {
      const savedConfig = localStorage.getItem('rashenal_optimization_config');
      if (savedConfig) {
        const userConfig = JSON.parse(savedConfig);
        this.config = { ...this.config, ...userConfig };
        console.log('✅ User configuration loaded');
      }
    } catch (error) {
      console.warn('⚠️ Failed to load user configuration:', error);
    }
  }

  private async warmUpSystem(): Promise<void> {
    console.log('🔥 Warming up optimization system...');

    try {
      // Warm up cache with common queries
      const commonQueries = [
        'How can I improve my productivity?',
        'What tasks should I focus on today?',
        'How are my habits progressing?',
        'Can you help me set better goals?'
      ];

      if (this.status.cache) {
        await responseCache.preloadCommonQueries('chat_response', commonQueries);
      }

      // Warm up optimizer with test prompts
      if (this.status.optimizer) {
        await promptOptimizer.batchOptimize([
          { prompt: 'Analyze my productivity data and provide insights', operation: 'analysis' },
          { prompt: 'Extract action items from this meeting notes', operation: 'extraction' }
        ]);
      }

      console.log('✅ System warm-up complete');
    } catch (error) {
      console.warn('⚠️ System warm-up failed:', error);
    }
  }

  private logInitializationSummary(): void {
    const healthyServices = Object.values(this.status).filter(Boolean).length;
    const totalServices = Object.keys(this.status).length - 1; // Exclude overall_health

    console.log(`
🎯 TOKEN OPTIMIZATION SYSTEM READY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Services: ${healthyServices}/${totalServices} healthy
💰 Daily Cost Target: $${this.config.daily_cost_limit}
🚀 Optimization: ${this.config.enable_optimization ? 'Enabled' : 'Disabled'}
💾 Cache: ${this.config.enable_caching ? 'Enabled' : 'Disabled'}
🧠 Local LLM: ${this.config.enable_local_llm ? 'Enabled' : 'Disabled'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);
  }

  // Public methods for runtime management

  getStatus(): InitializationStatus {
    return { ...this.status };
  }

  getConfig(): OptimizationConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Apply config changes
    if (newConfig.enable_optimization !== undefined) {
      aiService.setOptimizationEnabled(newConfig.enable_optimization);
    }
    
    if (newConfig.fallback_enabled !== undefined) {
      aiService.setFallbackEnabled(newConfig.fallback_enabled);
    }

    // Save to localStorage
    try {
      localStorage.setItem('rashenal_optimization_config', JSON.stringify(this.config));
      console.log('✅ Configuration updated and saved');
    } catch (error) {
      console.error('❌ Failed to save configuration:', error);
    }
  }

  async reinitialize(): Promise<InitializationStatus> {
    console.log('🔄 Reinitializing optimization system...');
    this.initialized = false;
    
    // Clear caches
    responseCache.clear();
    promptOptimizer.clearCache();
    
    return await this.initialize();
  }

  async getSystemMetrics(): Promise<{
    status: InitializationStatus;
    analytics: any;
    cache_stats: any;
    routing_stats: any;
    model_status: any;
    optimization_stats: any;
  }> {
    return {
      status: this.status,
      analytics: tokenAnalytics.generateAnalytics('day'),
      cache_stats: responseCache.getStats(),
      routing_stats: aiRouter.getRoutingStats(),
      model_status: localLLM.getStatus(),
      optimization_stats: promptOptimizer.getOptimizationStats()
    };
  }

  // Emergency methods
  async emergencyDisableOptimization(): Promise<void> {
    console.warn('🚨 Emergency: Disabling optimization system');
    
    aiService.setOptimizationEnabled(false);
    this.config.enable_optimization = false;
    
    // Save emergency config
    try {
      localStorage.setItem('rashenal_optimization_config', JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save emergency config:', error);
    }
  }

  async emergencyReset(): Promise<void> {
    console.warn('🚨 Emergency: Resetting optimization system');
    
    // Clear all caches
    responseCache.clear();
    promptOptimizer.clearCache();
    
    // Reset to defaults
    this.config = {
      enable_local_llm: false, // Disable local LLM in emergency
      enable_caching: true,
      enable_optimization: false, // Disable optimization in emergency
      daily_cost_limit: 3.26,
      cache_size_limit: 1000, // Reduce cache size
      similarity_threshold: 0.9, // Increase threshold for safety
      fallback_enabled: true
    };

    aiService.setOptimizationEnabled(false);
    aiService.setFallbackEnabled(true);

    console.log('🚨 Emergency reset complete - system running in safe mode');
  }
}

// Export singleton instance
export const optimizationInitializer = OptimizationInitializer.getInstance();