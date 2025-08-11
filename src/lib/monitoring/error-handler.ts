// Comprehensive error handling and monitoring system for Rashenal platform
import { supabase } from '../supabase';

export interface ErrorReport {
  id: string;
  userId?: string;
  sessionId: string;
  errorType: 'javascript' | 'network' | 'api' | 'auth' | 'business_logic' | 'performance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  stack?: string;
  route: string;
  userAgent: string;
  timestamp: string;
  context?: {
    component?: string;
    action?: string;
    props?: any;
    state?: any;
    apiEndpoint?: string;
    requestPayload?: any;
    responseStatus?: number;
    responseData?: any;
  };
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  tags: string[];
  metadata: Record<string, any>;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: any;
  errorId?: string;
}

export interface ErrorHandler {
  handleError(error: Error, context?: any): void;
  reportError(errorReport: Partial<ErrorReport>): Promise<void>;
  getErrorStats(timeRange?: { start: Date; end: Date }): Promise<ErrorStats>;
}

export interface ErrorStats {
  totalErrors: number;
  errorsByType: Record<string, number>;
  errorsBySeverity: Record<string, number>;
  errorsByRoute: Record<string, number>;
  topErrors: Array<{ message: string; count: number; lastOccurred: string }>;
  resolved: number;
  unresolved: number;
}

export class RashenalErrorHandler implements ErrorHandler {
  private static instance: RashenalErrorHandler;
  private sessionId: string;
  private userId?: string;
  private errorQueue: ErrorReport[] = [];
  private isOnline: boolean = navigator.onLine;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.setupGlobalErrorHandlers();
    this.setupNetworkMonitoring();
    this.startPeriodicFlush();
  }

  public static getInstance(): RashenalErrorHandler {
    if (!RashenalErrorHandler.instance) {
      RashenalErrorHandler.instance = new RashenalErrorHandler();
    }
    return RashenalErrorHandler.instance;
  }

  public setUserId(userId: string): void {
    this.userId = userId;
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupGlobalErrorHandlers(): void {
    // Handle uncaught JavaScript errors
    window.addEventListener('error', (event) => {
      this.handleError(event.error || new Error(event.message), {
        component: 'global',
        action: 'uncaught_exception',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(new Error(event.reason), {
        component: 'global',
        action: 'unhandled_promise_rejection',
        reason: event.reason
      });
    });

    // Handle React component errors (if using React Error Boundaries)
    this.setupReactErrorHandler();
  }

  private setupReactErrorHandler(): void {
    // This would typically be used in a React Error Boundary component
    // We'll provide a utility for components to use
  }

  private setupNetworkMonitoring(): void {
    // Monitor online/offline status
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flushErrorQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.handleError(new Error('Network connection lost'), {
        component: 'network',
        action: 'connection_lost'
      });
    });

    // Intercept fetch requests to monitor API errors
    this.interceptFetch();
  }

  private interceptFetch(): void {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args): Promise<Response> => {
      const startTime = performance.now();
      const url = args[0]?.toString() || 'unknown';
      
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        const duration = endTime - startTime;

        // Log slow API calls
        if (duration > 5000) { // 5 seconds threshold
          this.handleError(new Error(`Slow API response: ${url}`), {
            component: 'api',
            action: 'slow_response',
            apiEndpoint: url,
            duration,
            responseStatus: response.status
          });
        }

        // Handle HTTP errors
        if (!response.ok) {
          const errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          this.handleError(new Error(errorMessage), {
            component: 'api',
            action: 'http_error',
            apiEndpoint: url,
            requestPayload: args[1],
            responseStatus: response.status,
            responseData: await response.clone().text().catch(() => null)
          });
        }

        return response;
      } catch (error) {
        const endTime = performance.now();
        const duration = endTime - startTime;

        this.handleError(error as Error, {
          component: 'api',
          action: 'network_error',
          apiEndpoint: url,
          requestPayload: args[1],
          duration
        });

        throw error;
      }
    };
  }

  public handleError(error: Error, context?: any): void {
    const errorReport: ErrorReport = {
      id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: this.userId,
      sessionId: this.sessionId,
      errorType: this.classifyError(error, context),
      severity: this.determineSeverity(error, context),
      message: error.message || 'Unknown error',
      stack: error.stack,
      route: window.location.pathname,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      context: this.sanitizeContext(context),
      resolved: false,
      tags: this.generateTags(error, context),
      metadata: {
        url: window.location.href,
        referrer: document.referrer,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        performance: {
          memory: (performance as any).memory ? {
            used: Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024),
            total: Math.round((performance as any).memory.totalJSHeapSize / 1024 / 1024)
          } : undefined,
          timing: performance.now()
        }
      }
    };

    // Add to queue for batched reporting
    this.errorQueue.push(errorReport);

    // Console log for development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error captured:', errorReport);
    }

    // Immediate flush for critical errors
    if (errorReport.severity === 'critical') {
      this.flushErrorQueue();
    }
  }

  private classifyError(error: Error, context?: any): ErrorReport['errorType'] {
    if (context?.component === 'api' || context?.apiEndpoint) {
      return 'api';
    }

    if (context?.component === 'network' || error.message.includes('fetch') || error.message.includes('network')) {
      return 'network';
    }

    if (error.message.includes('auth') || context?.component === 'auth') {
      return 'auth';
    }

    if (context?.action === 'slow_response' || context?.duration > 1000) {
      return 'performance';
    }

    if (context?.component && context?.action) {
      return 'business_logic';
    }

    return 'javascript';
  }

  private determineSeverity(error: Error, context?: any): ErrorReport['severity'] {
    // Critical errors that break core functionality
    if (error.message.includes('ChunkLoadError') || 
        error.message.includes('Loading chunk') ||
        context?.component === 'auth' ||
        context?.responseStatus === 500) {
      return 'critical';
    }

    // High severity for API errors and performance issues
    if (context?.component === 'api' || 
        context?.responseStatus >= 400 ||
        (context?.duration && context.duration > 10000)) {
      return 'high';
    }

    // Medium severity for business logic and UI errors
    if (context?.component && context?.action) {
      return 'medium';
    }

    return 'low';
  }

  private sanitizeContext(context?: any): any {
    if (!context) return undefined;

    // Remove sensitive information
    const sanitized = { ...context };
    
    if (sanitized.requestPayload) {
      sanitized.requestPayload = this.sanitizeSensitiveData(sanitized.requestPayload);
    }

    if (sanitized.responseData) {
      sanitized.responseData = this.sanitizeSensitiveData(sanitized.responseData);
    }

    if (sanitized.state) {
      sanitized.state = this.sanitizeSensitiveData(sanitized.state);
    }

    if (sanitized.props) {
      sanitized.props = this.sanitizeSensitiveData(sanitized.props);
    }

    return sanitized;
  }

  private sanitizeSensitiveData(data: any): any {
    if (!data || typeof data !== 'object') return data;

    const sensitiveKeys = ['password', 'token', 'auth', 'secret', 'key', 'email', 'phone'];
    const sanitized: any = Array.isArray(data) ? [] : {};

    for (const key in data) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof data[key] === 'object') {
        sanitized[key] = this.sanitizeSensitiveData(data[key]);
      } else {
        sanitized[key] = data[key];
      }
    }

    return sanitized;
  }

  private generateTags(error: Error, context?: any): string[] {
    const tags: string[] = [];

    // Add browser info
    tags.push(`browser:${this.getBrowserInfo()}`);
    
    // Add error type
    if (error.name) tags.push(`error_name:${error.name}`);
    
    // Add component if available
    if (context?.component) tags.push(`component:${context.component}`);
    
    // Add action if available
    if (context?.action) tags.push(`action:${context.action}`);
    
    // Add route
    tags.push(`route:${window.location.pathname}`);
    
    // Add device type
    tags.push(`device:${this.getDeviceType()}`);

    return tags;
  }

  private getBrowserInfo(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'chrome';
    if (ua.includes('Firefox')) return 'firefox';
    if (ua.includes('Safari')) return 'safari';
    if (ua.includes('Edge')) return 'edge';
    return 'unknown';
  }

  private getDeviceType(): string {
    if (/Mobile|Android|iPhone|iPad/.test(navigator.userAgent)) {
      return 'mobile';
    }
    if (/Tablet|iPad/.test(navigator.userAgent)) {
      return 'tablet';
    }
    return 'desktop';
  }

  public async reportError(errorReport: Partial<ErrorReport>): Promise<void> {
    const fullReport: ErrorReport = {
      id: errorReport.id || `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: errorReport.userId || this.userId,
      sessionId: errorReport.sessionId || this.sessionId,
      errorType: errorReport.errorType || 'javascript',
      severity: errorReport.severity || 'medium',
      message: errorReport.message || 'Unknown error',
      stack: errorReport.stack,
      route: errorReport.route || window.location.pathname,
      userAgent: errorReport.userAgent || navigator.userAgent,
      timestamp: errorReport.timestamp || new Date().toISOString(),
      context: errorReport.context,
      resolved: errorReport.resolved || false,
      resolvedAt: errorReport.resolvedAt,
      resolvedBy: errorReport.resolvedBy,
      tags: errorReport.tags || [],
      metadata: errorReport.metadata || {}
    };

    try {
      await supabase
        .from('error_reports')
        .insert({
          id: fullReport.id,
          user_id: fullReport.userId,
          session_id: fullReport.sessionId,
          error_type: fullReport.errorType,
          severity: fullReport.severity,
          message: fullReport.message,
          stack: fullReport.stack,
          route: fullReport.route,
          user_agent: fullReport.userAgent,
          timestamp: fullReport.timestamp,
          context: fullReport.context,
          resolved: fullReport.resolved,
          resolved_at: fullReport.resolvedAt,
          resolved_by: fullReport.resolvedBy,
          tags: fullReport.tags,
          metadata: fullReport.metadata
        });
    } catch (error) {
      console.error('Failed to report error:', error);
      // Store locally if reporting fails
      localStorage.setItem(`error_${fullReport.id}`, JSON.stringify(fullReport));
    }
  }

  private async flushErrorQueue(): Promise<void> {
    if (!this.isOnline || this.errorQueue.length === 0) return;

    const errorsToFlush = [...this.errorQueue];
    this.errorQueue = [];

    try {
      // Batch insert errors
      await supabase
        .from('error_reports')
        .insert(
          errorsToFlush.map(error => ({
            id: error.id,
            user_id: error.userId,
            session_id: error.sessionId,
            error_type: error.errorType,
            severity: error.severity,
            message: error.message,
            stack: error.stack,
            route: error.route,
            user_agent: error.userAgent,
            timestamp: error.timestamp,
            context: error.context,
            resolved: error.resolved,
            resolved_at: error.resolvedAt,
            resolved_by: error.resolvedBy,
            tags: error.tags,
            metadata: error.metadata
          }))
        );
    } catch (error) {
      console.error('Failed to flush error queue:', error);
      // Put errors back in queue
      this.errorQueue.unshift(...errorsToFlush);
    }
  }

  private startPeriodicFlush(): void {
    setInterval(() => {
      this.flushErrorQueue();
    }, 30000); // Flush every 30 seconds
  }

  public async getErrorStats(timeRange?: { start: Date; end: Date }): Promise<ErrorStats> {
    try {
      let query = supabase
        .from('error_reports')
        .select('*');

      if (timeRange) {
        query = query
          .gte('timestamp', timeRange.start.toISOString())
          .lte('timestamp', timeRange.end.toISOString());
      }

      if (this.userId) {
        query = query.eq('user_id', this.userId);
      }

      const { data: errors, error } = await query;

      if (error) throw error;

      const stats: ErrorStats = {
        totalErrors: errors?.length || 0,
        errorsByType: {},
        errorsBySeverity: {},
        errorsByRoute: {},
        topErrors: [],
        resolved: 0,
        unresolved: 0
      };

      errors?.forEach(error => {
        // Count by type
        stats.errorsByType[error.error_type] = (stats.errorsByType[error.error_type] || 0) + 1;
        
        // Count by severity
        stats.errorsBySeverity[error.severity] = (stats.errorsBySeverity[error.severity] || 0) + 1;
        
        // Count by route
        stats.errorsByRoute[error.route] = (stats.errorsByRoute[error.route] || 0) + 1;
        
        // Count resolved/unresolved
        if (error.resolved) {
          stats.resolved++;
        } else {
          stats.unresolved++;
        }
      });

      // Calculate top errors
      const errorCounts = new Map<string, { count: number; lastOccurred: string }>();
      errors?.forEach(error => {
        const existing = errorCounts.get(error.message);
        if (existing) {
          existing.count++;
          if (new Date(error.timestamp) > new Date(existing.lastOccurred)) {
            existing.lastOccurred = error.timestamp;
          }
        } else {
          errorCounts.set(error.message, { count: 1, lastOccurred: error.timestamp });
        }
      });

      stats.topErrors = Array.from(errorCounts.entries())
        .map(([message, data]) => ({ message, ...data }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return stats;
    } catch (error) {
      console.error('Failed to get error stats:', error);
      return {
        totalErrors: 0,
        errorsByType: {},
        errorsBySeverity: {},
        errorsByRoute: {},
        topErrors: [],
        resolved: 0,
        unresolved: 0
      };
    }
  }

  // Utility methods for React components
  public createErrorBoundary() {
    return class ErrorBoundary extends Error {
      public state: ErrorBoundaryState = { hasError: false };

      public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        const errorId = `boundary-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        RashenalErrorHandler.getInstance().handleError(error, {
          component: 'error_boundary',
          action: 'component_error',
          errorId
        });

        return {
          hasError: true,
          error,
          errorId
        };
      }

      public componentDidCatch(error: Error, errorInfo: any) {
        RashenalErrorHandler.getInstance().handleError(error, {
          component: 'error_boundary',
          action: 'component_crash',
          errorInfo
        });
      }
    };
  }

  public wrapAsyncFunction<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    context?: { component: string; action: string }
  ): T {
    return (async (...args: Parameters<T>) => {
      try {
        return await fn(...args);
      } catch (error) {
        this.handleError(error as Error, {
          ...context,
          args: this.sanitizeSensitiveData(args)
        });
        throw error;
      }
    }) as T;
  }

  public destroy(): void {
    this.flushErrorQueue();
  }
}

// Global error handler instance
export const errorHandler = RashenalErrorHandler.getInstance();

// Initialize error tracking
if (typeof window !== 'undefined') {
  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    errorHandler.destroy();
  });
}