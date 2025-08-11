// Schema Health Check Hook
// Provides real-time schema validation and health monitoring for the application

import { useState, useEffect, useCallback } from 'react';
import { SchemaValidator } from '../lib/schema-validator';

interface SchemaIssue {
  table: string;
  column?: string;
  issue: string;
  severity: 'error' | 'warning' | 'info';
  suggestion?: string;
}

interface ValidationResult {
  isValid: boolean;
  issues: SchemaIssue[];
  tables: Record<string, any[]>;
  timestamp: string;
}

interface SchemaHealthState {
  isValid: boolean;
  isLoading: boolean;
  error: string | null;
  issues: SchemaIssue[];
  lastChecked: string | null;
  totalIssues: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  tablesChecked: number;
}

interface UseSchemaHealthOptions {
  enabled?: boolean;
  autoRefreshInterval?: number; // in milliseconds
  checkOnMount?: boolean;
  development only?: boolean;
}

interface UseSchemaHealthReturn extends SchemaHealthState {
  checkHealth: () => Promise<void>;
  refresh: () => Promise<void>;
  clearError: () => void;
  getSeverityColor: (severity: string) => string;
  getHealthStatus: () => 'healthy' | 'warnings' | 'errors' | 'unknown';
}

export function useSchemaHealth(options: UseSchemaHealthOptions = {}): UseSchemaHealthReturn {
  const {
    enabled = true,
    autoRefreshInterval = 0, // 0 means no auto-refresh
    checkOnMount = true,
    developmentOnly = true
  } = options;

  const [state, setState] = useState<SchemaHealthState>({
    isValid: true,
    isLoading: false,
    error: null,
    issues: [],
    lastChecked: null,
    totalIssues: 0,
    errorCount: 0,
    warningCount: 0,
    infoCount: 0,
    tablesChecked: 0
  });

  // Check if we should run in current environment
  const isDevelopment = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost';
  const shouldRun = enabled && (!developmentOnly || isDevelopment);

  const checkHealth = useCallback(async (): Promise<void> => {
    if (!shouldRun) {
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const validator = new SchemaValidator();
      const result: ValidationResult = await validator.validateSchema();

      const errorCount = result.issues.filter(issue => issue.severity === 'error').length;
      const warningCount = result.issues.filter(issue => issue.severity === 'warning').length;
      const infoCount = result.issues.filter(issue => issue.severity === 'info').length;

      setState({
        isValid: result.isValid,
        isLoading: false,
        error: null,
        issues: result.issues,
        lastChecked: result.timestamp,
        totalIssues: result.issues.length,
        errorCount,
        warningCount,
        infoCount,
        tablesChecked: Object.keys(result.tables).length
      });

      // Log health check results in development
      if (isDevelopment) {
        console.log('🏥 Schema Health Check Results:', {
          isValid: result.isValid,
          totalIssues: result.issues.length,
          errorCount,
          warningCount,
          infoCount,
          tablesChecked: Object.keys(result.tables).length
        });

        if (!result.isValid) {
          console.warn('⚠️ Schema Issues Found:', result.issues);
        }
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Schema health check failed';
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        isValid: false
      }));

      if (isDevelopment) {
        console.error('❌ Schema Health Check Error:', error);
      }
    }
  }, [shouldRun, isDevelopment]);

  const refresh = useCallback(async (): Promise<void> => {
    await checkHealth();
  }, [checkHealth]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const getSeverityColor = useCallback((severity: string): string => {
    switch (severity) {
      case 'error':
        return 'text-red-600 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'info':
        return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
    }
  }, []);

  const getHealthStatus = useCallback((): 'healthy' | 'warnings' | 'errors' | 'unknown' => {
    if (state.error) return 'unknown';
    if (state.errorCount > 0) return 'errors';
    if (state.warningCount > 0) return 'warnings';
    return 'healthy';
  }, [state.error, state.errorCount, state.warningCount]);

  // Check health on mount
  useEffect(() => {
    if (checkOnMount && shouldRun) {
      checkHealth();
    }
  }, [checkOnMount, shouldRun, checkHealth]);

  // Set up auto-refresh interval
  useEffect(() => {
    if (autoRefreshInterval > 0 && shouldRun) {
      const interval = setInterval(() => {
        checkHealth();
      }, autoRefreshInterval);

      return () => clearInterval(interval);
    }
  }, [autoRefreshInterval, shouldRun, checkHealth]);

  // Listen for focus events to refresh when tab becomes active
  useEffect(() => {
    if (!shouldRun) return;

    const handleFocus = () => {
      // Refresh if data is older than 5 minutes
      if (state.lastChecked) {
        const lastCheckedTime = new Date(state.lastChecked).getTime();
        const now = new Date().getTime();
        const fiveMinutes = 5 * 60 * 1000;

        if (now - lastCheckedTime > fiveMinutes) {
          checkHealth();
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [shouldRun, state.lastChecked, checkHealth]);

  return {
    ...state,
    checkHealth,
    refresh,
    clearError,
    getSeverityColor,
    getHealthStatus
  };
}

// Utility hook for component-specific schema health checks
export function useTableHealth(tableName: string) {
  const { issues, isValid, checkHealth } = useSchemaHealth();
  
  const tableIssues = issues.filter(issue => issue.table === tableName);
  const hasTableIssues = tableIssues.length > 0;
  const tableErrorCount = tableIssues.filter(issue => issue.severity === 'error').length;
  const tableWarningCount = tableIssues.filter(issue => issue.severity === 'warning').length;

  return {
    issues: tableIssues,
    hasIssues: hasTableIssues,
    errorCount: tableErrorCount,
    warningCount: tableWarningCount,
    isHealthy: !hasTableIssues,
    checkHealth
  };
}

// Hook for schema health monitoring with notifications
export function useSchemaHealthMonitor() {
  const health = useSchemaHealth({
    autoRefreshInterval: 5 * 60 * 1000, // Check every 5 minutes
    checkOnMount: true
  });

  const [hasNotified, setHasNotified] = useState(false);

  // Show browser notification for critical errors (development only)
  useEffect(() => {
    if (health.errorCount > 0 && !hasNotified && process.env.NODE_ENV === 'development') {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Rashenal: Schema Issues Detected', {
          body: `Found ${health.errorCount} critical schema errors. Check Debug Dashboard.`,
          icon: '/favicon.ico',
          tag: 'schema-health'
        });
        setHasNotified(true);
      }
    }

    // Reset notification flag when errors are resolved
    if (health.errorCount === 0 && hasNotified) {
      setHasNotified(false);
    }
  }, [health.errorCount, hasNotified]);

  return health;
}

export default useSchemaHealth;