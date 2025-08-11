// Local LLM Service - Ollama integration for cost optimization
// Handles local model inference to reduce Claude API costs by 90%

interface OllamaModel {
  name: string;
  model: string;
  size: number;
  digest: string;
  details: {
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
  expires_at: string;
}

interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration: number;
  load_duration: number;
  prompt_eval_count: number;
  prompt_eval_duration: number;
  eval_count: number;
  eval_duration: number;
}

interface LocalModelConfig {
  name: string;
  model_id: string;
  use_cases: string[];
  max_tokens: number;
  temperature: number;
  context_window: number;
  performance_tier: 'fast' | 'balanced' | 'accurate';
  memory_usage_mb: number;
}

export class LocalLLMService {
  private ollamaUrl: string;
  private availableModels: Map<string, LocalModelConfig> = new Map();
  private modelCache: Map<string, any> = new Map();
  private isHealthy: boolean = false;
  private lastHealthCheck: number = 0;
  private healthCheckInterval: number = 5 * 60 * 1000; // 5 minutes

  constructor(ollamaUrl: string = 'http://localhost:11434') {
    this.ollamaUrl = ollamaUrl;
    this.initializeModels();
    this.checkHealth();
  }

  private initializeModels(): void {
    // Configure available local models based on use case optimization
    const models: LocalModelConfig[] = [
      {
        name: 'llama-3.2-3b',
        model_id: 'llama3.2:3b',
        use_cases: ['classification', 'extraction', 'simple_questions', 'data_parsing'],
        max_tokens: 2048,
        temperature: 0.1,
        context_window: 4096,
        performance_tier: 'fast',
        memory_usage_mb: 2048
      },
      {
        name: 'mistral-7b',
        model_id: 'mistral:7b',
        use_cases: ['summarization', 'analysis', 'content_generation', 'reasoning'],
        max_tokens: 4096,
        temperature: 0.3,
        context_window: 8192,
        performance_tier: 'balanced',
        memory_usage_mb: 4096
      },
      {
        name: 'phi-3-mini',
        model_id: 'phi3:mini',
        use_cases: ['quick_responses', 'simple_chat', 'basic_analysis', 'routine_tasks'],
        max_tokens: 1024,
        temperature: 0.2,
        context_window: 2048,
        performance_tier: 'fast',
        memory_usage_mb: 1024
      },
      {
        name: 'codellama-7b',
        model_id: 'codellama:7b',
        use_cases: ['code_analysis', 'code_generation', 'technical_questions'],
        max_tokens: 4096,
        temperature: 0.1,
        context_window: 8192,
        performance_tier: 'accurate',
        memory_usage_mb: 4096
      }
    ];

    models.forEach(model => {
      this.availableModels.set(model.name, model);
    });
  }

  async checkHealth(): Promise<boolean> {
    const now = Date.now();
    if (now - this.lastHealthCheck < this.healthCheckInterval && this.isHealthy) {
      return this.isHealthy;
    }

    try {
      const response = await fetch(`${this.ollamaUrl}/api/tags`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });

      if (response.ok) {
        const data = await response.json();
        this.isHealthy = true;
        this.lastHealthCheck = now;
        
        // Update available models based on what's actually installed
        await this.syncInstalledModels(data.models || []);
        
        console.log(`✅ Ollama health check passed - ${data.models?.length || 0} models available`);
        return true;
      } else {
        this.isHealthy = false;
        console.warn('⚠️ Ollama server responded with error:', response.status);
        return false;
      }
    } catch (error) {
      this.isHealthy = false;
      console.warn('⚠️ Ollama health check failed:', error);
      return false;
    }
  }

  private async syncInstalledModels(installedModels: OllamaModel[]): Promise<void> {
    const installedNames = new Set(installedModels.map(m => m.name));
    
    // Check which configured models are actually available
    for (const [name, config] of this.availableModels) {
      if (!installedNames.has(config.model_id)) {
        console.warn(`⚠️ Model ${config.model_id} not installed in Ollama`);
        // Optionally auto-install missing models
        await this.installModel(config.model_id);
      }
    }
  }

  private async installModel(modelId: string): Promise<boolean> {
    try {
      console.log(`🚀 Installing model ${modelId}...`);
      
      const response = await fetch(`${this.ollamaUrl}/api/pull`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: modelId,
          stream: false
        })
      });

      if (response.ok) {
        console.log(`✅ Model ${modelId} installed successfully`);
        return true;
      } else {
        console.error(`❌ Failed to install model ${modelId}:`, response.status);
        return false;
      }
    } catch (error) {
      console.error(`❌ Error installing model ${modelId}:`, error);
      return false;
    }
  }

  // Get best model for a specific use case
  getBestModelForUseCase(useCase: string, prioritize: 'speed' | 'quality' = 'speed'): LocalModelConfig | null {
    const suitableModels = Array.from(this.availableModels.values())
      .filter(model => model.use_cases.includes(useCase));

    if (suitableModels.length === 0) {
      return null;
    }

    // Sort by priority (speed vs quality)
    suitableModels.sort((a, b) => {
      if (prioritize === 'speed') {
        // Prefer fast models, then by memory usage (lower is better)
        const aTier = a.performance_tier === 'fast' ? 0 : a.performance_tier === 'balanced' ? 1 : 2;
        const bTier = b.performance_tier === 'fast' ? 0 : b.performance_tier === 'balanced' ? 1 : 2;
        
        if (aTier !== bTier) return aTier - bTier;
        return a.memory_usage_mb - b.memory_usage_mb;
      } else {
        // Prefer accurate models, then balanced
        const aTier = a.performance_tier === 'accurate' ? 0 : a.performance_tier === 'balanced' ? 1 : 2;
        const bTier = b.performance_tier === 'accurate' ? 0 : b.performance_tier === 'balanced' ? 1 : 2;
        
        return aTier - bTier;
      }
    });

    return suitableModels[0];
  }

  // Core inference method
  async generateResponse(
    prompt: string,
    useCase: string,
    options: {
      maxTokens?: number;
      temperature?: number;
      model?: string;
      priority?: 'speed' | 'quality';
      systemPrompt?: string;
    } = {}
  ): Promise<{
    response: string;
    model: string;
    tokens_used: number;
    response_time_ms: number;
    confidence_score: number;
    cached: boolean;
  }> {
    if (!this.isHealthy) {
      throw new Error('Ollama service is not healthy');
    }

    const startTime = Date.now();

    // Check cache first
    const cacheKey = this.generateCacheKey(prompt, useCase, options);
    if (this.modelCache.has(cacheKey)) {
      const cached = this.modelCache.get(cacheKey);
      return {
        ...cached,
        response_time_ms: Date.now() - startTime,
        cached: true
      };
    }

    // Select appropriate model
    const selectedModel = options.model 
      ? this.availableModels.get(options.model)
      : this.getBestModelForUseCase(useCase, options.priority || 'speed');

    if (!selectedModel) {
      throw new Error(`No suitable local model found for use case: ${useCase}`);
    }

    // Prepare the prompt
    const fullPrompt = options.systemPrompt 
      ? `${options.systemPrompt}\n\nUser: ${prompt}\n\nAssistant:`
      : prompt;

    try {
      const response = await fetch(`${this.ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel.model_id,
          prompt: fullPrompt,
          stream: false,
          options: {
            temperature: options.temperature || selectedModel.temperature,
            num_predict: options.maxTokens || selectedModel.max_tokens,
            top_k: 40,
            top_p: 0.9,
            repeat_penalty: 1.1
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }

      const data: OllamaResponse = await response.json();
      
      const result = {
        response: data.response.trim(),
        model: selectedModel.name,
        tokens_used: (data.prompt_eval_count || 0) + (data.eval_count || 0),
        response_time_ms: Date.now() - startTime,
        confidence_score: this.calculateConfidenceScore(data),
        cached: false
      };

      // Cache the result (with TTL)
      this.modelCache.set(cacheKey, {
        ...result,
        timestamp: Date.now()
      });

      return result;

    } catch (error) {
      console.error(`Error generating response with ${selectedModel.name}:`, error);
      throw error;
    }
  }

  // Specialized methods for common use cases
  async classifyText(
    text: string,
    categories: string[],
    systemContext?: string
  ): Promise<{ category: string; confidence: number; reasoning: string }> {
    const prompt = `
Classify the following text into one of these categories: ${categories.join(', ')}

Text: "${text}"

Respond with a JSON object containing:
- category: the most appropriate category
- confidence: confidence score from 0-1
- reasoning: brief explanation of why this category was chosen

JSON:`;

    const result = await this.generateResponse(prompt, 'classification', {
      model: 'llama-3.2-3b',
      temperature: 0.1,
      systemPrompt: systemContext,
      priority: 'speed'
    });

    try {
      const parsed = JSON.parse(result.response);
      return {
        category: parsed.category || 'unknown',
        confidence: parsed.confidence || 0.5,
        reasoning: parsed.reasoning || 'No reasoning provided'
      };
    } catch {
      // Fallback if JSON parsing fails
      return {
        category: categories[0],
        confidence: 0.3,
        reasoning: 'Failed to parse structured response'
      };
    }
  }

  async extractStructuredData(
    text: string,
    schema: Record<string, string>,
    systemContext?: string
  ): Promise<Record<string, any>> {
    const schemaDescription = Object.entries(schema)
      .map(([key, description]) => `- ${key}: ${description}`)
      .join('\n');

    const prompt = `
Extract structured data from the following text according to this schema:

${schemaDescription}

Text: "${text}"

Respond with valid JSON containing only the requested fields:`;

    const result = await this.generateResponse(prompt, 'extraction', {
      model: 'llama-3.2-3b',
      temperature: 0.1,
      systemPrompt: systemContext,
      priority: 'speed'
    });

    try {
      return JSON.parse(result.response);
    } catch {
      // Return empty object with schema keys if parsing fails
      return Object.keys(schema).reduce((obj, key) => {
        obj[key] = null;
        return obj;
      }, {} as Record<string, any>);
    }
  }

  async summarizeContent(
    content: string,
    maxLength: number = 200,
    focus?: string
  ): Promise<{ summary: string; key_points: string[]; confidence: number }> {
    const focusInstruction = focus ? `Focus on: ${focus}` : '';
    
    const prompt = `
Summarize the following content in approximately ${maxLength} characters.
${focusInstruction}

Content: "${content}"

Provide response as JSON:
{
  "summary": "concise summary",
  "key_points": ["point 1", "point 2", "point 3"],
  "confidence": 0.85
}`;

    const result = await this.generateResponse(prompt, 'summarization', {
      model: 'mistral-7b',
      temperature: 0.3,
      priority: 'balanced'
    });

    try {
      const parsed = JSON.parse(result.response);
      return {
        summary: parsed.summary || content.substring(0, maxLength),
        key_points: parsed.key_points || [],
        confidence: parsed.confidence || result.confidence_score
      };
    } catch {
      return {
        summary: content.substring(0, maxLength) + '...',
        key_points: [],
        confidence: 0.3
      };
    }
  }

  async generateQuickResponse(
    query: string,
    context?: string
  ): Promise<string> {
    const systemPrompt = context 
      ? `Context: ${context}\n\nProvide a helpful, concise response to the user's query.`
      : 'Provide a helpful, concise response to the user\'s query.';

    const result = await this.generateResponse(query, 'quick_responses', {
      model: 'phi-3-mini',
      temperature: 0.2,
      maxTokens: 512,
      systemPrompt,
      priority: 'speed'
    });

    return result.response;
  }

  // Cache management
  private generateCacheKey(prompt: string, useCase: string, options: any): string {
    const normalizedPrompt = prompt.trim().toLowerCase();
    const optionsStr = JSON.stringify(options);
    return `${useCase}:${this.hashString(normalizedPrompt + optionsStr)}`;
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  private calculateConfidenceScore(data: OllamaResponse): number {
    // Simple heuristic based on response characteristics
    const responseLength = data.response.length;
    const avgTokenTime = data.eval_duration / data.eval_count;
    
    // Longer responses tend to be more confident
    const lengthFactor = Math.min(responseLength / 500, 1);
    
    // Faster token generation might indicate higher confidence
    const speedFactor = avgTokenTime < 50000000 ? 0.8 : 0.6; // 50ms per token
    
    return Math.min(0.5 + (lengthFactor * 0.3) + (speedFactor * 0.2), 0.95);
  }

  // Cleanup old cache entries (call periodically)
  cleanupCache(): void {
    const maxAge = 30 * 60 * 1000; // 30 minutes
    const now = Date.now();
    
    for (const [key, value] of this.modelCache.entries()) {
      if (now - value.timestamp > maxAge) {
        this.modelCache.delete(key);
      }
    }
  }

  // Get service status for monitoring
  getStatus(): {
    healthy: boolean;
    models_available: number;
    cache_size: number;
    last_health_check: string;
    memory_usage_estimate: string;
  } {
    const totalMemory = Array.from(this.availableModels.values())
      .reduce((sum, model) => sum + model.memory_usage_mb, 0);

    return {
      healthy: this.isHealthy,
      models_available: this.availableModels.size,
      cache_size: this.modelCache.size,
      last_health_check: new Date(this.lastHealthCheck).toISOString(),
      memory_usage_estimate: `~${totalMemory}MB`
    };
  }

  // Get model recommendations for specific operations
  getModelRecommendations(): {
    operation: string;
    recommended_model: string;
    alternative_models: string[];
    expected_speed: string;
    memory_usage: string;
  }[] {
    const operations = [
      'email_parsing',
      'task_extraction',
      'habit_analysis', 
      'cv_analysis',
      'chat_responses',
      'job_classification'
    ];

    return operations.map(operation => {
      const primary = this.getBestModelForUseCase(operation, 'speed');
      const alternatives = Array.from(this.availableModels.values())
        .filter(model => model.use_cases.includes(operation) && model.name !== primary?.name)
        .map(model => model.name);

      return {
        operation,
        recommended_model: primary?.name || 'none',
        alternative_models: alternatives,
        expected_speed: primary?.performance_tier || 'unknown',
        memory_usage: `${primary?.memory_usage_mb || 0}MB`
      };
    });
  }
}

// Export singleton instance
export const localLLM = new LocalLLMService();

// Auto-cleanup cache every 30 minutes
setInterval(() => {
  localLLM.cleanupCache();
}, 30 * 60 * 1000);