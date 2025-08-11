/**
 * Rashenal AI Testing Framework - Main Export
 * Comprehensive AI-powered testing system for quality assurance
 */

// Core Testing Agents
export { TestAgentBase } from './testing/TestAgentBase';
export { UserTestAgent } from './testing/UserTestAgent';
export { AdminTestAgent } from './testing/AdminTestAgent';

// Test Orchestration
export { TestOrchestrator } from './testing/TestOrchestrator';
export { TestRunner, runTests } from './testing/TestRunner';

// Configuration
export { getTestConfig, validateTestConfig, testConfigs } from './testing/testConfig';

// Types and Interfaces
export type {
  TestResult,
  TestError,
  TestUser,
  PerformanceMetrics,
  AccessibilityCheck,
  TestSuite,
  TestReport,
  TestRecommendation,
  TestConfig,
  UserJourney,
  UserAction,
  SecurityTest,
  PerformanceTest
} from './testing/TestAgentBase';

export type {
  TestRunnerConfig
} from './testing/TestRunner';

// Utility Functions
export const createTestUser = async (persona: string, userId: string) => {
  const { TestAgentBase } = await import('./testing/TestAgentBase');
  const agent = new (class extends TestAgentBase {
    async executeTestSuite() {
      return {} as any; // Placeholder implementation
    }
  })(userId);
  
  return (agent as any).createTestUser(persona);
};

export const validateTestEnvironment = () => {
  const requiredEnvVars = [
    'TEST_CLAUDE_API_KEY',
    'TEST_SUPABASE_URL',
    'TEST_SUPABASE_ANON_KEY'
  ];
  
  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  return true;
};

/**
 * Quick test execution functions for common scenarios
 */
export const quickTests = {
  /**
   * Run smoke tests for rapid validation
   */
  smoke: async (persona: string = 'alex_neurodiverse') => {
    const runner = new (await import('./testing/TestRunner')).TestRunner({
      mode: 'dev',
      agents: ['user'],
      personas: [persona],
      testLevel: 'smoke',
      outputFormat: 'console',
      verbose: false
    });
    
    return runner.run();
  },

  /**
   * Run accessibility-focused tests
   */
  accessibility: async () => {
    const runner = new (await import('./testing/TestRunner')).TestRunner({
      mode: 'manual',
      agents: ['user'],
      personas: ['alex_neurodiverse'],
      testLevel: 'comprehensive',
      outputFormat: 'html',
      verbose: true
    });
    
    return runner.run();
  },

  /**
   * Run security validation tests
   */
  security: async () => {
    const runner = new (await import('./testing/TestRunner')).TestRunner({
      mode: 'manual',
      agents: ['admin'],
      testLevel: 'extensive',
      outputFormat: 'html',
      verbose: true
    });
    
    return runner.run();
  },

  /**
   * Run comprehensive user journey tests
   */
  userJourneys: async () => {
    const runner = new (await import('./testing/TestRunner')).TestRunner({
      mode: 'manual',
      agents: ['user'],
      personas: ['alex_neurodiverse', 'sam_entrepreneur', 'morgan_methodical'],
      testLevel: 'comprehensive',
      outputFormat: 'html',
      verbose: true
    });
    
    return runner.run();
  },

  /**
   * Run full test suite with all agents and personas
   */
  comprehensive: async () => {
    const runner = new (await import('./testing/TestRunner')).TestRunner({
      mode: 'manual',
      agents: ['user', 'admin'],
      personas: ['alex_neurodiverse', 'sam_entrepreneur', 'morgan_methodical'],
      testLevel: 'comprehensive',
      outputFormat: 'all',
      verbose: true
    });
    
    return runner.run();
  }
};

/**
 * Test status and monitoring utilities
 */
export const testStatus = {
  /**
   * Get current test status and metrics
   */
  getCurrentStatus: async () => {
    const orchestrator = new (await import('./testing/TestOrchestrator')).TestOrchestrator();
    return orchestrator.getDashboardData();
  },

  /**
   * Get test analytics and trends
   */
  getAnalytics: async () => {
    const orchestrator = new (await import('./testing/TestOrchestrator')).TestOrchestrator();
    return orchestrator.getTestAnalytics();
  },

  /**
   * Get recent test history
   */
  getHistory: async (limit: number = 10) => {
    const orchestrator = new (await import('./testing/TestOrchestrator')).TestOrchestrator();
    return orchestrator.getTestHistory(limit);
  }
};

/**
 * Configuration helpers
 */
export const configHelpers = {
  /**
   * Get configuration for current environment
   */
  getConfig: (environment?: string) => {
    return getTestConfig(environment);
  },

  /**
   * Validate current configuration
   */
  validateConfig: (config?: any) => {
    const testConfig = config || getTestConfig();
    return validateTestConfig(testConfig);
  },

  /**
   * Check if test environment is properly configured
   */
  checkEnvironment: () => {
    try {
      validateTestEnvironment();
      const config = getTestConfig();
      const errors = validateTestConfig(config);
      
      if (errors.length > 0) {
        return { valid: false, errors };
      }
      
      return { valid: true, config };
    } catch (error) {
      return { valid: false, errors: [error.message] };
    }
  }
};

// Default export for convenience
export default {
  TestRunner,
  TestOrchestrator,
  UserTestAgent,
  AdminTestAgent,
  quickTests,
  testStatus,
  configHelpers,
  runTests
};

/**
 * Version information
 */
export const version = {
  framework: '1.0.0',
  compatible_with: 'Rashenal Platform 2025',
  built_for: 'Quality, Accessibility, and User Empowerment'
};

console.log(`
🤖 Rashenal AI Testing Framework v${version.framework}
Built for ${version.built_for}
Ready to ensure quality and accessibility! 🚀
`);
