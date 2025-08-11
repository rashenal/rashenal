/**
 * Rashenal AI Testing Framework Configuration
 * Centralized configuration for all testing agents and scenarios
 */

export interface TestConfig {
  environment: 'development' | 'staging' | 'production' | 'ci';
  database: DatabaseConfig;
  ai: AIConfig;
  performance: PerformanceConfig;
  accessibility: AccessibilityConfig;
  security: SecurityConfig;
  reporting: ReportingConfig;
  agents: AgentConfig;
  personas: PersonaConfig;
  monitoring: MonitoringConfig;
}

export interface DatabaseConfig {
  url: string;
  testPrefix: string;
  cleanupAfterTests: boolean;
  isolateTestData: boolean;
  connectionTimeout: number;
  queryTimeout: number;
}

export interface AIConfig {
  apiKey: string;
  baseUrl?: string;
  timeout: number;
  retryAttempts: number;
  mockResponses: boolean;
  qualityThreshold: number;
  contextRetentionTest: boolean;
  responseValidation: boolean;
}

export interface PerformanceConfig {
  apiResponseThreshold: number;
  pageLoadThreshold: number;
  memoryThreshold: number;
  successRateThreshold: number;
  concurrentUsers: number;
  loadTestDuration: number;
  enabledInCI: boolean;
}

export interface AccessibilityConfig {
  wcagLevel: 'A' | 'AA' | 'AAA';
  scoreThreshold: number;
  failOnViolations: boolean;
  screenReaderTesting: boolean;
  keyboardNavigationTesting: boolean;
  colorContrastTesting: boolean;
  focusIndicatorTesting: boolean;
}

export interface SecurityConfig {
  scoreThreshold: number;
  sqlInjectionTesting: boolean;
  xssTesting: boolean;
  authBypassTesting: boolean;
  dataBoundaryTesting: boolean;
  encryptionTesting: boolean;
  sessionManagementTesting: boolean;
}

export interface ReportingConfig {
  outputPath: string;
  formats: ('console' | 'json' | 'html' | 'junit')[];
  includeScreenshots: boolean;
  includePerformanceMetrics: boolean;
  includeAccessibilityReport: boolean;
  includeSecurityReport: boolean;
  retainHistoryDays: number;
  generateTrends: boolean;
}

export interface AgentConfig {
  enabled: ('user' | 'admin')[];
  timeoutMs: number;
  retryAttempts: number;
  parallelExecution: boolean;
  cleanupOnFailure: boolean;
  verboseLogging: boolean;
}

export interface PersonaConfig {
  default: string[];
  comprehensive: string[];
  extensive: string[];
  accessibility: string[];
  performance: string[];
}

export interface MonitoringConfig {
  enableAlerts: boolean;
  emailNotifications: boolean;
  slackNotifications: boolean;
  webhookUrl?: string;
  alertOnCritical: boolean;
  alertOnHighErrors: boolean;
  alertOnPerformanceDegradation: boolean;
  alertOnAccessibilityFailures: boolean;
}

/**
 * Default configuration for different environments
 */
export const testConfigs: Record<string, TestConfig> = {
  development: {
    environment: 'development',
    database: {
      url: process.env.TEST_DATABASE_URL || 'postgresql://localhost:5432/rashenal_test',
      testPrefix: 'dev_test_',
      cleanupAfterTests: true,
      isolateTestData: true,
      connectionTimeout: 5000,
      queryTimeout: 10000
    },
    ai: {
      apiKey: process.env.TEST_CLAUDE_API_KEY || '',
      timeout: 30000,
      retryAttempts: 2,
      mockResponses: false,
      qualityThreshold: 80,
      contextRetentionTest: true,
      responseValidation: true
    },
    performance: {
      apiResponseThreshold: 5000,
      pageLoadThreshold: 3000,
      memoryThreshold: 100 * 1024 * 1024, // 100MB
      successRateThreshold: 90,
      concurrentUsers: 5,
      loadTestDuration: 30,
      enabledInCI: false
    },
    accessibility: {
      wcagLevel: 'AA',
      scoreThreshold: 85,
      failOnViolations: false,
      screenReaderTesting: true,
      keyboardNavigationTesting: true,
      colorContrastTesting: true,
      focusIndicatorTesting: true
    },
    security: {
      scoreThreshold: 85,
      sqlInjectionTesting: true,
      xssTesting: true,
      authBypassTesting: true,
      dataBoundaryTesting: true,
      encryptionTesting: false,
      sessionManagementTesting: true
    },
    reporting: {
      outputPath: './test-reports',
      formats: ['console', 'json'],
      includeScreenshots: false,
      includePerformanceMetrics: true,
      includeAccessibilityReport: true,
      includeSecurityReport: true,
      retainHistoryDays: 7,
      generateTrends: false
    },
    agents: {
      enabled: ['user', 'admin'],
      timeoutMs: 60000,
      retryAttempts: 1,
      parallelExecution: false,
      cleanupOnFailure: true,
      verboseLogging: true
    },
    personas: {
      default: ['alex_neurodiverse'],
      comprehensive: ['alex_neurodiverse', 'sam_entrepreneur'],
      extensive: ['alex_neurodiverse', 'sam_entrepreneur', 'morgan_methodical'],
      accessibility: ['alex_neurodiverse'],
      performance: ['sam_entrepreneur']
    },
    monitoring: {
      enableAlerts: false,
      emailNotifications: false,
      slackNotifications: false,
      alertOnCritical: true,
      alertOnHighErrors: false,
      alertOnPerformanceDegradation: false,
      alertOnAccessibilityFailures: false
    }
  },

  ci: {
    environment: 'ci',
    database: {
      url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || '',
      testPrefix: 'ci_test_',
      cleanupAfterTests: true,
      isolateTestData: true,
      connectionTimeout: 10000,
      queryTimeout: 15000
    },
    ai: {
      apiKey: process.env.TEST_CLAUDE_API_KEY || '',
      timeout: 60000,
      retryAttempts: 3,
      mockResponses: false,
      qualityThreshold: 85,
      contextRetentionTest: true,
      responseValidation: true
    },
    performance: {
      apiResponseThreshold: 5000,
      pageLoadThreshold: 3000,
      memoryThreshold: 150 * 1024 * 1024, // 150MB
      successRateThreshold: 95,
      concurrentUsers: 10,
      loadTestDuration: 60,
      enabledInCI: true
    },
    accessibility: {
      wcagLevel: 'AA',
      scoreThreshold: 90,
      failOnViolations: true,
      screenReaderTesting: true,
      keyboardNavigationTesting: true,
      colorContrastTesting: true,
      focusIndicatorTesting: true
    },
    security: {
      scoreThreshold: 90,
      sqlInjectionTesting: true,
      xssTesting: true,
      authBypassTesting: true,
      dataBoundaryTesting: true,
      encryptionTesting: true,
      sessionManagementTesting: true
    },
    reporting: {
      outputPath: './test-reports',
      formats: ['console', 'json', 'html', 'junit'],
      includeScreenshots: false,
      includePerformanceMetrics: true,
      includeAccessibilityReport: true,
      includeSecurityReport: true,
      retainHistoryDays: 30,
      generateTrends: true
    },
    agents: {
      enabled: ['user', 'admin'],
      timeoutMs: 120000,
      retryAttempts: 2,
      parallelExecution: true,
      cleanupOnFailure: true,
      verboseLogging: false
    },
    personas: {
      default: ['alex_neurodiverse', 'sam_entrepreneur'],
      comprehensive: ['alex_neurodiverse', 'sam_entrepreneur'],
      extensive: ['alex_neurodiverse', 'sam_entrepreneur', 'morgan_methodical'],
      accessibility: ['alex_neurodiverse'],
      performance: ['sam_entrepreneur']
    },
    monitoring: {
      enableAlerts: true,
      emailNotifications: false,
      slackNotifications: true,
      webhookUrl: process.env.SLACK_WEBHOOK_URL,
      alertOnCritical: true,
      alertOnHighErrors: true,
      alertOnPerformanceDegradation: true,
      alertOnAccessibilityFailures: true
    }
  },

  production: {
    environment: 'production',
    database: {
      url: process.env.TEST_DATABASE_URL || '',
      testPrefix: 'prod_test_',
      cleanupAfterTests: true,
      isolateTestData: true,
      connectionTimeout: 15000,
      queryTimeout: 20000
    },
    ai: {
      apiKey: process.env.TEST_CLAUDE_API_KEY || '',
      timeout: 30000,
      retryAttempts: 3,
      mockResponses: false,
      qualityThreshold: 90,
      contextRetentionTest: true,
      responseValidation: true
    },
    performance: {
      apiResponseThreshold: 3000,
      pageLoadThreshold: 2000,
      memoryThreshold: 200 * 1024 * 1024, // 200MB
      successRateThreshold: 98,
      concurrentUsers: 50,
      loadTestDuration: 300,
      enabledInCI: true
    },
    accessibility: {
      wcagLevel: 'AA',
      scoreThreshold: 95,
      failOnViolations: true,
      screenReaderTesting: true,
      keyboardNavigationTesting: true,
      colorContrastTesting: true,
      focusIndicatorTesting: true
    },
    security: {
      scoreThreshold: 95,
      sqlInjectionTesting: true,
      xssTesting: true,
      authBypassTesting: true,
      dataBoundaryTesting: true,
      encryptionTesting: true,
      sessionManagementTesting: true
    },
    reporting: {
      outputPath: './test-reports',
      formats: ['console', 'json', 'html'],
      includeScreenshots: true,
      includePerformanceMetrics: true,
      includeAccessibilityReport: true,
      includeSecurityReport: true,
      retainHistoryDays: 90,
      generateTrends: true
    },
    agents: {
      enabled: ['user', 'admin'],
      timeoutMs: 180000,
      retryAttempts: 3,
      parallelExecution: true,
      cleanupOnFailure: true,
      verboseLogging: false
    },
    personas: {
      default: ['alex_neurodiverse', 'sam_entrepreneur', 'morgan_methodical'],
      comprehensive: ['alex_neurodiverse', 'sam_entrepreneur', 'morgan_methodical'],
      extensive: ['alex_neurodiverse', 'sam_entrepreneur', 'morgan_methodical'],
      accessibility: ['alex_neurodiverse'],
      performance: ['sam_entrepreneur']
    },
    monitoring: {
      enableAlerts: true,
      emailNotifications: true,
      slackNotifications: true,
      webhookUrl: process.env.SLACK_WEBHOOK_URL,
      alertOnCritical: true,
      alertOnHighErrors: true,
      alertOnPerformanceDegradation: true,
      alertOnAccessibilityFailures: true
    }
  }
};

/**
 * Get configuration for current environment
 */
export function getTestConfig(environment?: string): TestConfig {
  const env = environment || process.env.TEST_ENVIRONMENT || process.env.NODE_ENV || 'development';
  const config = testConfigs[env] || testConfigs.development;
  
  // Override with environment variables if present
  return {
    ...config,
    ai: {
      ...config.ai,
      apiKey: process.env.TEST_CLAUDE_API_KEY || config.ai.apiKey,
      timeout: parseInt(process.env.AI_TEST_TIMEOUT || '') || config.ai.timeout,
      mockResponses: process.env.DEV_MOCK_AI_RESPONSES === 'true' || config.ai.mockResponses
    },
    performance: {
      ...config.performance,
      apiResponseThreshold: parseInt(process.env.PERFORMANCE_API_THRESHOLD || '') || config.performance.apiResponseThreshold,
      pageLoadThreshold: parseInt(process.env.PERFORMANCE_PAGE_LOAD_THRESHOLD || '') || config.performance.pageLoadThreshold,
      successRateThreshold: parseInt(process.env.PERFORMANCE_SUCCESS_RATE_THRESHOLD || '') || config.performance.successRateThreshold
    },
    accessibility: {
      ...config.accessibility,
      scoreThreshold: parseInt(process.env.ACCESSIBILITY_SCORE_THRESHOLD || '') || config.accessibility.scoreThreshold,
      failOnViolations: process.env.ACCESSIBILITY_FAIL_ON_VIOLATIONS === 'true' || config.accessibility.failOnViolations
    },
    security: {
      ...config.security,
      scoreThreshold: parseInt(process.env.SECURITY_SCORE_THRESHOLD || '') || config.security.scoreThreshold
    },
    reporting: {
      ...config.reporting,
      outputPath: process.env.TEST_REPORT_PATH || config.reporting.outputPath,
      formats: process.env.TEST_REPORT_FORMAT?.split(',') as any || config.reporting.formats
    }
  };
}

/**
 * Validate configuration
 */
export function validateTestConfig(config: TestConfig): string[] {
  const errors: string[] = [];
  
  if (!config.ai.apiKey && !config.ai.mockResponses) {
    errors.push('AI API key is required when not using mock responses');
  }
  
  if (!config.database.url) {
    errors.push('Database URL is required');
  }
  
  if (config.performance.apiResponseThreshold < 1000) {
    errors.push('API response threshold should be at least 1000ms');
  }
  
  if (config.accessibility.scoreThreshold < 50 || config.accessibility.scoreThreshold > 100) {
    errors.push('Accessibility score threshold must be between 50 and 100');
  }
  
  if (config.security.scoreThreshold < 50 || config.security.scoreThreshold > 100) {
    errors.push('Security score threshold must be between 50 and 100');
  }
  
  return errors;
}

export default getTestConfig;
