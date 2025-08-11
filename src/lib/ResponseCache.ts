// Response Cache - Intelligent caching system for AI responses
// Implements semantic similarity matching and automatic cache invalidation

interface CacheEntry {
  key: string;
  prompt_hash: string;
  semantic_hash: string;
  response: string;
  metadata: {
    operation: string;
    user_id: string;
    model_used: string;
    quality_score: number;
    token_count: number;
    cost_saved: number;
  };
  timestamps: {
    created_at: number;
    last_accessed: number;
    expires_at: number;
  };
  access_count: number;
  similarity_threshold: number;
}

interface CacheStats {
  total_entries: number;
  cache_hits: number;
  cache_misses: number;
  hit_rate_percentage: number;
  total_tokens_saved: number;
  total_cost_saved: number;
  memory_usage_mb: number;
  avg_response_time_ms: number;
}

interface SimilarityMatch {
  entry: CacheEntry;
  similarity_score: number;
  exact_match: boolean;
  semantic_match: boolean;
}

interface CacheConfiguration {
  max_entries: number;
  default_ttl_hours: number;
  similarity_threshold: number;
  enable_semantic_matching: boolean;
  enable_compression: boolean;
  cleanup_interval_minutes: number;
}

export class ResponseCache {
  private cache: Map<string, CacheEntry> = new Map();
  private accessLog: Array<{ key: string; timestamp: number; hit: boolean }> = [];
  private stats: CacheStats;
  private config: CacheConfiguration;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<CacheConfiguration> = {}) {
    this.config = {
      max_entries: 10000,
      default_ttl_hours: 24,
      similarity_threshold: 0.85,
      enable_semantic_matching: true,
      enable_compression: true,
      cleanup_interval_minutes: 30,
      ...config
    };

    this.stats = {
      total_entries: 0,
      cache_hits: 0,
      cache_misses: 0,
      hit_rate_percentage: 0,
      total_tokens_saved: 0,
      total_cost_saved: 0,
      memory_usage_mb: 0,
      avg_response_time_ms: 5
    };

    this.initializeCleanupScheduler();
  }

  // Primary cache operations

  async get(
    prompt: string,
    operation: string,
    user_id: string,
    options: {
      similarity_threshold?: number;
      include_semantic?: boolean;
      max_age_hours?: number;
    } = {}
  ): Promise<SimilarityMatch | null> {
    const startTime = Date.now();
    
    const promptHash = this.generatePromptHash(prompt);
    const semanticHash = this.generateSemanticHash(prompt, operation);
    
    // Try exact match first
    const exactKey = `${operation}:${user_id}:${promptHash}`;
    const exactMatch = this.cache.get(exactKey);
    
    if (exactMatch && !this.isExpired(exactMatch)) {
      this.updateAccessStats(exactMatch, true);
      this.logAccess(exactKey, true);
      
      return {
        entry: exactMatch,
        similarity_score: 1.0,
        exact_match: true,
        semantic_match: false
      };
    }

    // Try semantic matching if enabled
    if (this.config.enable_semantic_matching && options.include_semantic !== false) {
      const semanticMatch = await this.findSemanticMatch(
        prompt,
        operation,
        user_id,
        options.similarity_threshold || this.config.similarity_threshold,
        options.max_age_hours
      );

      if (semanticMatch) {
        this.updateAccessStats(semanticMatch.entry, true);
        this.logAccess(semanticMatch.entry.key, true);
        return semanticMatch;
      }
    }

    // No match found
    this.stats.cache_misses++;
    this.logAccess('', false);
    
    return null;
  }

  async set(
    prompt: string,
    response: string,
    metadata: {
      operation: string;
      user_id: string;
      model_used: string;
      quality_score: number;
      token_count: number;
      processing_cost: number;
    },
    options: {
      ttl_hours?: number;
      similarity_threshold?: number;
      compress?: boolean;
    } = {}
  ): Promise<string> {
    // Check cache size limits
    if (this.cache.size >= this.config.max_entries) {
      await this.evictLeastUsed();
    }

    const promptHash = this.generatePromptHash(prompt);
    const semanticHash = this.generateSemanticHash(prompt, metadata.operation);
    const key = `${metadata.operation}:${metadata.user_id}:${promptHash}`;
    
    const now = Date.now();
    const ttlMs = (options.ttl_hours || this.config.default_ttl_hours) * 60 * 60 * 1000;
    
    // Compress response if enabled
    const storedResponse = (this.config.enable_compression && options.compress !== false)
      ? await this.compressResponse(response)
      : response;

    const entry: CacheEntry = {
      key,
      prompt_hash: promptHash,
      semantic_hash: semanticHash,
      response: storedResponse,
      metadata: {
        ...metadata,
        cost_saved: 0 // Will be calculated on cache hits
      },
      timestamps: {
        created_at: now,
        last_accessed: now,
        expires_at: now + ttlMs
      },
      access_count: 1,
      similarity_threshold: options.similarity_threshold || this.config.similarity_threshold
    };

    this.cache.set(key, entry);
    this.stats.total_entries = this.cache.size;
    
    return key;
  }

  // Semantic similarity matching
  private async findSemanticMatch(
    prompt: string,
    operation: string,
    user_id: string,
    threshold: number,
    maxAgeHours?: number
  ): Promise<SimilarityMatch | null> {
    const semanticHash = this.generateSemanticHash(prompt, operation);
    const promptTokens = this.tokenizePrompt(prompt);
    
    let bestMatch: SimilarityMatch | null = null;
    let highestScore = 0;

    // Search through cache entries for semantic matches
    for (const entry of this.cache.values()) {
      // Skip expired entries
      if (this.isExpired(entry)) continue;
      
      // Skip entries from different operations or users (privacy)
      if (entry.metadata.operation !== operation) continue;
      if (entry.metadata.user_id !== user_id) continue;
      
      // Skip entries that are too old
      if (maxAgeHours) {
        const ageHours = (Date.now() - entry.timestamps.created_at) / (1000 * 60 * 60);
        if (ageHours > maxAgeHours) continue;
      }

      // Calculate semantic similarity
      const similarity = this.calculateSemanticSimilarity(
        promptTokens,
        entry.semantic_hash,
        prompt
      );

      if (similarity >= threshold && similarity > highestScore) {
        highestScore = similarity;
        bestMatch = {
          entry,
          similarity_score: similarity,
          exact_match: false,
          semantic_match: true
        };
      }
    }

    return bestMatch;
  }

  private calculateSemanticSimilarity(
    promptTokens: string[],
    cachedSemanticHash: string,
    originalPrompt: string
  ): number {
    // Extract the cached prompt from semantic hash for comparison
    // In a real implementation, you'd store original prompt or use vector embeddings
    
    // Simple token-based similarity for now
    const cachedTokens = cachedSemanticHash.split('_').filter(token => token.length > 2);
    
    if (promptTokens.length === 0 || cachedTokens.length === 0) {
      return 0;
    }

    // Calculate Jaccard similarity
    const intersection = promptTokens.filter(token => 
      cachedTokens.some(cached => cached.includes(token) || token.includes(cached))
    ).length;
    
    const union = new Set([...promptTokens, ...cachedTokens]).size;
    const jaccardSimilarity = intersection / union;

    // Calculate character-level similarity for fine-tuning
    const charSimilarity = this.calculateLevenshteinSimilarity(
      originalPrompt.toLowerCase(),
      cachedTokens.join(' ').toLowerCase()
    );

    // Weighted combination
    return (jaccardSimilarity * 0.7) + (charSimilarity * 0.3);
  }

  private calculateLevenshteinSimilarity(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    const maxLen = Math.max(str1.length, str2.length);
    return maxLen === 0 ? 1 : (maxLen - matrix[str2.length][str1.length]) / maxLen;
  }

  // Hash generation methods
  private generatePromptHash(prompt: string): string {
    // Create exact hash for perfect matches
    const normalized = prompt.trim().toLowerCase().replace(/\s+/g, ' ');
    return this.hashString(normalized);
  }

  private generateSemanticHash(prompt: string, operation: string): string {
    // Create semantic hash for similarity matching
    const tokens = this.tokenizePrompt(prompt);
    const importantTokens = tokens
      .filter(token => token.length > 3) // Filter out small words
      .filter(token => !this.isStopWord(token))
      .slice(0, 10) // Keep most important tokens
      .sort(); // Sort for consistent hashing
    
    return `${operation}_${importantTokens.join('_')}`;
  }

  private tokenizePrompt(prompt: string): string[] {
    return prompt
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 0);
  }

  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
      'before', 'after', 'above', 'below', 'between', 'among', 'is', 'are',
      'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does',
      'did', 'will', 'would', 'should', 'could', 'can', 'may', 'might', 'must',
      'shall', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it',
      'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his',
      'her', 'its', 'our', 'their'
    ]);
    
    return stopWords.has(word);
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // Cache management and cleanup
  private initializeCleanupScheduler(): void {
    this.cleanupInterval = setInterval(() => {
      this.performCleanup();
    }, this.config.cleanup_interval_minutes * 60 * 1000);
  }

  private async performCleanup(): Promise<void> {
    const now = Date.now();
    let removedCount = 0;

    // Remove expired entries
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    // If still over capacity, remove least recently used
    if (this.cache.size > this.config.max_entries * 0.9) {
      const sortedEntries = Array.from(this.cache.entries())
        .sort(([,a], [,b]) => a.timestamps.last_accessed - b.timestamps.last_accessed);
      
      const toRemove = Math.floor(this.config.max_entries * 0.1);
      for (let i = 0; i < toRemove && i < sortedEntries.length; i++) {
        this.cache.delete(sortedEntries[i][0]);
        removedCount++;
      }
    }

    this.stats.total_entries = this.cache.size;
    
    if (removedCount > 0) {
      console.log(`Cache cleanup: removed ${removedCount} entries, ${this.cache.size} remaining`);
    }
  }

  private async evictLeastUsed(): Promise<void> {
    if (this.cache.size === 0) return;

    // Find least recently used entry
    let lruKey = '';
    let oldestAccess = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamps.last_accessed < oldestAccess) {
        oldestAccess = entry.timestamps.last_accessed;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
    }
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() > entry.timestamps.expires_at;
  }

  private updateAccessStats(entry: CacheEntry, hit: boolean): void {
    entry.timestamps.last_accessed = Date.now();
    entry.access_count++;

    if (hit) {
      this.stats.cache_hits++;
      this.stats.total_tokens_saved += entry.metadata.token_count;
      this.stats.total_cost_saved += entry.metadata.cost_saved || 0.01; // Estimate if not set
    }

    this.updateHitRate();
  }

  private updateHitRate(): void {
    const totalRequests = this.stats.cache_hits + this.stats.cache_misses;
    this.stats.hit_rate_percentage = totalRequests > 0 
      ? (this.stats.cache_hits / totalRequests) * 100 
      : 0;
  }

  private logAccess(key: string, hit: boolean): void {
    this.accessLog.push({
      key,
      timestamp: Date.now(),
      hit
    });

    // Keep only recent access logs (last 1000 entries)
    if (this.accessLog.length > 1000) {
      this.accessLog = this.accessLog.slice(-1000);
    }
  }

  // Response compression/decompression
  private async compressResponse(response: string): Promise<string> {
    // Simple compression - in production, use gzip or similar
    const compressed = response
      .replace(/\s{2,}/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim();
    
    return `[COMPRESSED]${compressed}`;
  }

  private async decompressResponse(compressed: string): Promise<string> {
    if (compressed.startsWith('[COMPRESSED]')) {
      return compressed.substring('[COMPRESSED]'.length);
    }
    return compressed;
  }

  // Public API methods
  
  async invalidate(pattern: string, operation?: string, user_id?: string): Promise<number> {
    let removedCount = 0;
    const regex = new RegExp(pattern, 'i');

    for (const [key, entry] of this.cache.entries()) {
      const shouldRemove = regex.test(key) &&
        (!operation || entry.metadata.operation === operation) &&
        (!user_id || entry.metadata.user_id === user_id);

      if (shouldRemove) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    this.stats.total_entries = this.cache.size;
    return removedCount;
  }

  async warmUp(
    prompts: Array<{
      prompt: string;
      response: string;
      operation: string;
      user_id: string;
      model_used: string;
    }>
  ): Promise<void> {
    console.log(`Warming up cache with ${prompts.length} entries...`);
    
    for (const item of prompts) {
      await this.set(item.prompt, item.response, {
        operation: item.operation,
        user_id: item.user_id,
        model_used: item.model_used,
        quality_score: 0.85,
        token_count: Math.ceil(item.response.length / 4),
        processing_cost: 0.01
      });
    }
  }

  getStats(): CacheStats {
    // Calculate current memory usage estimate
    let memoryUsage = 0;
    for (const entry of this.cache.values()) {
      memoryUsage += JSON.stringify(entry).length;
    }
    
    this.stats.memory_usage_mb = memoryUsage / (1024 * 1024);
    this.stats.total_entries = this.cache.size;
    
    return { ...this.stats };
  }

  getRecentActivity(limit: number = 100): Array<{
    timestamp: string;
    hit: boolean;
    operation?: string;
    similarity_score?: number;
  }> {
    return this.accessLog
      .slice(-limit)
      .map(log => ({
        timestamp: new Date(log.timestamp).toISOString(),
        hit: log.hit,
        operation: log.key ? log.key.split(':')[0] : undefined
      }));
  }

  async preloadCommonQueries(operation: string, commonQueries: string[]): Promise<void> {
    console.log(`Preloading ${commonQueries.length} common queries for ${operation}...`);
    
    // This would typically fetch responses from a batch API call
    // For now, we'll create placeholder entries
    for (const query of commonQueries) {
      const mockResponse = `Cached response for: ${query.substring(0, 50)}...`;
      
      await this.set(query, mockResponse, {
        operation,
        user_id: 'system',
        model_used: 'preload',
        quality_score: 0.8,
        token_count: Math.ceil(mockResponse.length / 4),
        processing_cost: 0
      }, {
        ttl_hours: 48 // Longer TTL for preloaded content
      });
    }
  }

  exportCache(): { entries: number; data: string } {
    const data = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      ...entry,
      response: entry.response.substring(0, 200) + '...' // Truncate for export
    }));

    return {
      entries: data.length,
      data: JSON.stringify(data, null, 2)
    };
  }

  clear(): void {
    this.cache.clear();
    this.accessLog = [];
    this.stats = {
      total_entries: 0,
      cache_hits: 0,
      cache_misses: 0,
      hit_rate_percentage: 0,
      total_tokens_saved: 0,
      total_cost_saved: 0,
      memory_usage_mb: 0,
      avg_response_time_ms: 5
    };
  }

  // Advanced cache analysis
  async analyzeUsagePatterns(): Promise<{
    most_accessed_operations: Array<{ operation: string; count: number }>;
    peak_usage_hours: number[];
    cache_efficiency_score: number;
    recommendations: string[];
  }> {
    const operationStats = new Map<string, number>();
    const hourlyStats = new Array(24).fill(0);
    
    // Analyze access patterns
    for (const entry of this.cache.values()) {
      const op = entry.metadata.operation;
      operationStats.set(op, (operationStats.get(op) || 0) + entry.access_count);
      
      const hour = new Date(entry.timestamps.last_accessed).getHours();
      hourlyStats[hour] += entry.access_count;
    }

    const mostAccessed = Array.from(operationStats.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([operation, count]) => ({ operation, count }));

    const peakHours = hourlyStats
      .map((count, hour) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(({ hour }) => hour);

    // Calculate efficiency score
    const hitRate = this.stats.hit_rate_percentage;
    const avgAccessCount = Array.from(this.cache.values())
      .reduce((sum, entry) => sum + entry.access_count, 0) / this.cache.size;
    
    const efficiencyScore = (hitRate / 100) * 0.7 + Math.min(avgAccessCount / 5, 1) * 0.3;

    // Generate recommendations
    const recommendations = [];
    if (hitRate < 30) {
      recommendations.push('Low hit rate - consider adjusting similarity threshold or TTL');
    }
    if (this.cache.size < this.config.max_entries * 0.5) {
      recommendations.push('Cache underutilized - consider increasing preloading');
    }
    if (avgAccessCount < 2) {
      recommendations.push('Many single-use entries - consider shorter TTL');
    }

    return {
      most_accessed_operations: mostAccessed,
      peak_usage_hours: peakHours,
      cache_efficiency_score: Math.round(efficiencyScore * 100) / 100,
      recommendations
    };
  }

  // Cleanup on process exit
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

// Export singleton instance
export const responseCache = new ResponseCache({
  max_entries: 5000,
  default_ttl_hours: 12,
  similarity_threshold: 0.8,
  enable_semantic_matching: true,
  enable_compression: true,
  cleanup_interval_minutes: 15
});