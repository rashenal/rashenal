// Performance monitoring and optimization system for Rashenal platform
import { supabase } from '../supabase';

export interface PerformanceMetrics {
  id: string;
  userId?: string;
  sessionId: string;
  route: string;
  action: string;
  startTime: number;
  endTime: number;
  duration: number;
  memoryUsage?: {
    used: number;
    total: number;
    percentage: number;
  };
  networkRequests?: {
    count: number;
    totalTime: number;
    avgTime: number;
  };
  renderMetrics?: {
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    cumulativeLayoutShift: number;
  };
  userAgent: string;
  timestamp: string;
}

export interface PerformanceBudget {
  route: string;
  maxLoadTime: number; // milliseconds
  maxApiResponseTime: number;
  maxMemoryUsage: number; // MB
  maxNetworkRequests: number;
  criticalResources: string[];
}

export interface OptimizationRecommendation {
  id: string;
  type: 'code_splitting' | 'caching' | 'lazy_loading' | 'image_optimization' | 'api_optimization';
  priority: 'low' | 'medium' | 'high' | 'critical';
  route: string;
  issue: string;
  recommendation: string;
  estimatedImpact: string;
  implementationCost: 'low' | 'medium' | 'high';
  createdAt: string;
}

export class PerformanceMonitor {
  private sessionId: string;
  private metrics: PerformanceMetrics[] = [];
  private observer?: PerformanceObserver;
  private budgets: Map<string, PerformanceBudget> = new Map();

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializePerformanceBudgets();
    this.setupPerformanceObserver();
    this.setupNavigationTracking();
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializePerformanceBudgets(): void {
    // Define performance budgets for different routes
    const budgets: PerformanceBudget[] = [
      {
        route: '/',
        maxLoadTime: 2000,
        maxApiResponseTime: 500,
        maxMemoryUsage: 50,
        maxNetworkRequests: 10,
        criticalResources: ['main.js', 'main.css']
      },
      {
        route: '/dashboard',
        maxLoadTime: 3000,
        maxApiResponseTime: 800,
        maxMemoryUsage: 75,
        maxNetworkRequests: 15,
        criticalResources: ['dashboard.js', 'user-data']
      },
      {
        route: '/job-finder',
        maxLoadTime: 4000,
        maxApiResponseTime: 1000,
        maxMemoryUsage: 100,
        maxNetworkRequests: 20,
        criticalResources: ['job-finder.js', 'job-data']
      },
      {
        route: '/news',
        maxLoadTime: 3500,
        maxApiResponseTime: 1200,
        maxMemoryUsage: 80,
        maxNetworkRequests: 25,
        criticalResources: ['news.js', 'news-feed']
      }
    ];

    budgets.forEach(budget => {
      this.budgets.set(budget.route, budget);
    });
  }

  private setupPerformanceObserver(): void {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.processPerformanceEntry(entry);
        }
      });

      // Observe different types of performance entries
      try {
        this.observer.observe({ type: 'navigation', buffered: true });
        this.observer.observe({ type: 'paint', buffered: true });
        this.observer.observe({ type: 'largest-contentful-paint', buffered: true });
        this.observer.observe({ type: 'layout-shift', buffered: true });
        this.observer.observe({ type: 'measure', buffered: true });
      } catch (error) {
        console.warn('Performance observer setup failed:', error);
      }
    }
  }

  private setupNavigationTracking(): void {
    if (typeof window !== 'undefined') {
      // Track page navigation
      window.addEventListener('beforeunload', () => {
        this.flushMetrics();
      });

      // Track route changes (for SPAs)
      let currentRoute = window.location.pathname;
      const routeChangeHandler = () => {
        if (window.location.pathname !== currentRoute) {
          this.trackRouteChange(currentRoute, window.location.pathname);
          currentRoute = window.location.pathname;
        }
      };

      // Listen for popstate (back/forward navigation)
      window.addEventListener('popstate', routeChangeHandler);

      // Listen for pushstate/replacestate (programmatic navigation)
      const originalPushState = history.pushState;
      const originalReplaceState = history.replaceState;

      history.pushState = function(...args) {
        originalPushState.apply(history, args);
        routeChangeHandler();
      };

      history.replaceState = function(...args) {
        originalReplaceState.apply(history, args);
        routeChangeHandler();
      };
    }
  }

  private processPerformanceEntry(entry: PerformanceEntry): void {
    switch (entry.entryType) {
      case 'navigation':
        this.processNavigationEntry(entry as PerformanceNavigationTiming);
        break;
      case 'paint':
        this.processPaintEntry(entry as PerformancePaintTiming);
        break;
      case 'largest-contentful-paint':
        this.processLCPEntry(entry);
        break;
      case 'layout-shift':
        this.processCLSEntry(entry);
        break;
      case 'measure':
        this.processMeasureEntry(entry as PerformanceMeasure);
        break;
    }
  }

  private processNavigationEntry(entry: PerformanceNavigationTiming): void {
    const metrics: PerformanceMetrics = {
      id: `nav-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sessionId: this.sessionId,
      route: window.location.pathname,
      action: 'navigation',
      startTime: entry.navigationStart,
      endTime: entry.loadEventEnd,
      duration: entry.loadEventEnd - entry.navigationStart,
      networkRequests: {
        count: performance.getEntriesByType('resource').length,
        totalTime: entry.responseEnd - entry.requestStart,
        avgTime: (entry.responseEnd - entry.requestStart) / 1
      },
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };

    this.metrics.push(metrics);
    this.checkPerformanceBudget(metrics);
  }

  private processPaintEntry(entry: PerformancePaintTiming): void {
    // Track First Contentful Paint and other paint metrics
    console.log(`Paint metric: ${entry.name} at ${entry.startTime}ms`);
  }

  private processLCPEntry(entry: any): void {
    // Track Largest Contentful Paint
    console.log(`LCP: ${entry.startTime}ms`);
  }

  private processCLSEntry(entry: any): void {
    // Track Cumulative Layout Shift
    console.log(`CLS: ${entry.value}`);
  }

  private processMeasureEntry(entry: PerformanceMeasure): void {
    const metrics: PerformanceMetrics = {
      id: `measure-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sessionId: this.sessionId,
      route: window.location.pathname,
      action: entry.name,
      startTime: entry.startTime,
      endTime: entry.startTime + entry.duration,
      duration: entry.duration,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };

    this.metrics.push(metrics);
  }

  public startMeasure(name: string): void {
    if (typeof performance !== 'undefined') {
      performance.mark(`${name}-start`);
    }
  }

  public endMeasure(name: string): number {
    if (typeof performance !== 'undefined') {
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
      
      const measures = performance.getEntriesByName(name, 'measure');
      return measures.length > 0 ? measures[measures.length - 1].duration : 0;
    }
    return 0;
  }

  public trackApiCall(url: string, method: string, startTime: number, endTime: number): void {
    const duration = endTime - startTime;
    
    const metrics: PerformanceMetrics = {
      id: `api-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sessionId: this.sessionId,
      route: window.location.pathname,
      action: `api_${method.toLowerCase()}_${url.split('/').pop() || 'unknown'}`,
      startTime,
      endTime,
      duration,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };

    this.metrics.push(metrics);
    
    // Check if API call exceeds budget
    const budget = this.budgets.get(window.location.pathname);
    if (budget && duration > budget.maxApiResponseTime) {
      console.warn(`API call exceeded budget: ${url} took ${duration}ms (budget: ${budget.maxApiResponseTime}ms)`);
    }
  }

  public trackUserInteraction(action: string): void {
    this.startMeasure(`interaction-${action}`);
    
    // End measure after next frame
    requestAnimationFrame(() => {
      this.endMeasure(`interaction-${action}`);
    });
  }

  public trackMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      
      const memoryMetrics: PerformanceMetrics = {
        id: `memory-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        sessionId: this.sessionId,
        route: window.location.pathname,
        action: 'memory_usage',
        startTime: performance.now(),
        endTime: performance.now(),
        duration: 0,
        memoryUsage: {
          used: Math.round(memory.usedJSHeapSize / 1024 / 1024), // MB
          total: Math.round(memory.totalJSHeapSize / 1024 / 1024), // MB
          percentage: Math.round((memory.usedJSHeapSize / memory.totalJSHeapSize) * 100)
        },
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      };

      this.metrics.push(memoryMetrics);
    }
  }

  private trackRouteChange(fromRoute: string, toRoute: string): void {
    const metrics: PerformanceMetrics = {
      id: `route-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sessionId: this.sessionId,
      route: toRoute,
      action: `route_change_${fromRoute.replace(/[^a-zA-Z0-9]/g, '_')}_to_${toRoute.replace(/[^a-zA-Z0-9]/g, '_')}`,
      startTime: performance.now(),
      endTime: performance.now(),
      duration: 0,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };

    this.metrics.push(metrics);
  }

  private checkPerformanceBudget(metrics: PerformanceMetrics): void {
    const budget = this.budgets.get(metrics.route);
    if (!budget) return;

    const violations: string[] = [];

    if (metrics.duration > budget.maxLoadTime) {
      violations.push(`Load time exceeded: ${metrics.duration}ms > ${budget.maxLoadTime}ms`);
    }

    if (metrics.memoryUsage && metrics.memoryUsage.used > budget.maxMemoryUsage) {
      violations.push(`Memory usage exceeded: ${metrics.memoryUsage.used}MB > ${budget.maxMemoryUsage}MB`);
    }

    if (metrics.networkRequests && metrics.networkRequests.count > budget.maxNetworkRequests) {
      violations.push(`Too many network requests: ${metrics.networkRequests.count} > ${budget.maxNetworkRequests}`);
    }

    if (violations.length > 0) {
      console.warn(`Performance budget violations for ${metrics.route}:`, violations);
      this.generateOptimizationRecommendations(metrics.route, violations);
    }
  }

  private generateOptimizationRecommendations(route: string, violations: string[]): void {
    const recommendations: OptimizationRecommendation[] = [];

    violations.forEach(violation => {
      if (violation.includes('Load time exceeded')) {
        recommendations.push({
          id: `opt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'code_splitting',
          priority: 'high',
          route,
          issue: violation,
          recommendation: 'Implement code splitting to reduce initial bundle size',
          estimatedImpact: '30-50% reduction in load time',
          implementationCost: 'medium',
          createdAt: new Date().toISOString()
        });

        recommendations.push({
          id: `opt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'lazy_loading',
          priority: 'medium',
          route,
          issue: violation,
          recommendation: 'Implement lazy loading for non-critical components',
          estimatedImpact: '20-30% reduction in initial load time',
          implementationCost: 'low',
          createdAt: new Date().toISOString()
        });
      }

      if (violation.includes('Memory usage exceeded')) {
        recommendations.push({
          id: `opt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'caching',
          priority: 'medium',
          route,
          issue: violation,
          recommendation: 'Implement memory management and cleanup unused objects',
          estimatedImpact: '15-25% reduction in memory usage',
          implementationCost: 'medium',
          createdAt: new Date().toISOString()
        });
      }

      if (violation.includes('Too many network requests')) {
        recommendations.push({
          id: `opt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'api_optimization',
          priority: 'high',
          route,
          issue: violation,
          recommendation: 'Bundle API requests and implement request caching',
          estimatedImpact: '40-60% reduction in network requests',
          implementationCost: 'medium',
          createdAt: new Date().toISOString()
        });
      }
    });

    // Store recommendations for review
    recommendations.forEach(rec => {
      console.log('Performance recommendation:', rec);
    });
  }

  public async flushMetrics(): Promise<void> {
    if (this.metrics.length === 0) return;

    try {
      // In a real implementation, you might batch these to reduce API calls
      await supabase
        .from('performance_metrics')
        .insert(
          this.metrics.map(metric => ({
            id: metric.id,
            user_id: metric.userId,
            session_id: metric.sessionId,
            route: metric.route,
            action: metric.action,
            start_time: metric.startTime,
            end_time: metric.endTime,
            duration: metric.duration,
            memory_usage: metric.memoryUsage,
            network_requests: metric.networkRequests,
            render_metrics: metric.renderMetrics,
            user_agent: metric.userAgent,
            timestamp: metric.timestamp
          }))
        );

      this.metrics = []; // Clear metrics after successful upload
    } catch (error) {
      console.error('Failed to flush performance metrics:', error);
    }
  }

  public getSessionMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  public getAverageMetrics(route?: string): {
    avgLoadTime: number;
    avgApiTime: number;
    avgMemoryUsage: number;
    totalInteractions: number;
  } {
    const relevantMetrics = route 
      ? this.metrics.filter(m => m.route === route)
      : this.metrics;

    const loadTimeMetrics = relevantMetrics.filter(m => m.action === 'navigation');
    const apiMetrics = relevantMetrics.filter(m => m.action.startsWith('api_'));
    const memoryMetrics = relevantMetrics.filter(m => m.memoryUsage);
    const interactionMetrics = relevantMetrics.filter(m => m.action.startsWith('interaction'));

    return {
      avgLoadTime: loadTimeMetrics.length > 0 
        ? loadTimeMetrics.reduce((sum, m) => sum + m.duration, 0) / loadTimeMetrics.length
        : 0,
      avgApiTime: apiMetrics.length > 0
        ? apiMetrics.reduce((sum, m) => sum + m.duration, 0) / apiMetrics.length
        : 0,
      avgMemoryUsage: memoryMetrics.length > 0
        ? memoryMetrics.reduce((sum, m) => sum + (m.memoryUsage?.used || 0), 0) / memoryMetrics.length
        : 0,
      totalInteractions: interactionMetrics.length
    };
  }

  public startPeriodicTracking(intervalMs: number = 30000): void {
    setInterval(() => {
      this.trackMemoryUsage();
      this.flushMetrics();
    }, intervalMs);
  }

  public destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
    this.flushMetrics();
  }
}

// Performance optimization utilities
export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();

  public static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  // Debounce utility for reducing API calls
  public debounce<T extends (...args: any[]) => any>(
    func: T, 
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }

  // Throttle utility for limiting function calls
  public throttle<T extends (...args: any[]) => any>(
    func: T, 
    delay: number
  ): (...args: Parameters<T>) => void {
    let lastCall = 0;
    return (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        func.apply(this, args);
      }
    };
  }

  // Simple in-memory cache
  public cache_set(key: string, data: any, ttlMs: number = 300000): void { // 5 min default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    });
  }

  public cache_get<T = any>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  public cache_clear(): void {
    this.cache.clear();
  }

  // Lazy loading utility
  public async lazyImport<T>(importFn: () => Promise<T>): Promise<T> {
    try {
      return await importFn();
    } catch (error) {
      console.error('Lazy import failed:', error);
      throw error;
    }
  }

  // Image optimization utility
  public optimizeImage(
    src: string, 
    maxWidth: number, 
    quality: number = 0.8
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        // Calculate new dimensions
        const aspectRatio = img.height / img.width;
        canvas.width = Math.min(maxWidth, img.width);
        canvas.height = canvas.width * aspectRatio;

        // Draw and compress
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const optimized = canvas.toDataURL('image/jpeg', quality);
        
        resolve(optimized);
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = src;
    });
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Auto-start performance tracking
if (typeof window !== 'undefined') {
  performanceMonitor.startPeriodicTracking();
  
  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    performanceMonitor.destroy();
  });
}