export interface HealthCheckResult {
  status: 'pass' | 'fail' | 'warn';
  message: string;
  details?: any;
  timestamp: string;
  duration?: number;
}

export interface SystemHealthResult {
  overall: 'healthy' | 'degraded' | 'down';
  checks: {
    [key: string]: HealthCheckResult;
  };
  summary: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
  };
}

/**
 * Basic system health check
 */
export async function checkStatus(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    // Basic system checks
    const memoryUsage = performance.memory ? {
      used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
      total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
      limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024),
    } : null;

    const result: HealthCheckResult = {
      status: 'pass',
      message: 'System is operational',
      details: {
        environment: import.meta.env.MODE,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        language: navigator.language,
        online: navigator.onLine,
        memory: memoryUsage,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      },
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime
    };

    return result;
  } catch (error) {
    return {
      status: 'fail',
      message: 'System health check failed',
      details: { error: error instanceof Error ? error.message : 'Unknown error' },
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime
    };
  }
}

/**
 * Check localStorage functionality
 */
export async function checkLocalStorage(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  const testKey = 'health-check-test';
  const testValue = 'test-data-' + Date.now();
  
  try {
    // Test write
    localStorage.setItem(testKey, testValue);
    
    // Test read
    const retrieved = localStorage.getItem(testKey);
    
    // Test delete
    localStorage.removeItem(testKey);
    
    if (retrieved === testValue) {
      return {
        status: 'pass',
        message: 'localStorage is working correctly',
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime
      };
    } else {
      return {
        status: 'fail',
        message: 'localStorage read/write mismatch',
        details: { expected: testValue, got: retrieved },
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime
      };
    }
  } catch (error) {
    return {
      status: 'fail',
      message: 'localStorage is not available or failed',
      details: { error: error instanceof Error ? error.message : 'Unknown error' },
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime
    };
  }
}

/**
 * Run all basic health checks
 */
export async function runBasicHealthChecks(): Promise<SystemHealthResult> {
  const checks: { [key: string]: HealthCheckResult } = {};
  
  // Run all checks
  checks.system = await checkStatus();
  checks.localStorage = await checkLocalStorage();
  
  // Calculate summary
  const results = Object.values(checks);
  const summary = {
    total: results.length,
    passed: results.filter(r => r.status === 'pass').length,
    failed: results.filter(r => r.status === 'fail').length,
    warnings: results.filter(r => r.status === 'warn').length
  };
  
  // Determine overall status
  let overall: 'healthy' | 'degraded' | 'down';
  if (summary.failed === 0 && summary.warnings === 0) {
    overall = 'healthy';
  } else if (summary.failed === 0 && summary.warnings > 0) {
    overall = 'degraded';
  } else {
    overall = 'down';
  }
  
  return {
    overall,
    checks,
    summary
  };
}