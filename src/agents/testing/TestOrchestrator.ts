/**
 * Test Orchestrator - Coordinates all testing agents and generates comprehensive reports
 * Manages test execution, schedules, reporting, and continuous monitoring
 */

import { TestAgentBase, TestResult, TestError } from './TestAgentBase';
import { UserTestAgent } from './UserTestAgent';
import { AdminTestAgent } from './AdminTestAgent';

export interface TestSuite {
  id: string;
  name: string;
  description: string;
  agents: TestAgentConfig[];
  schedule: TestSchedule;
  enabled: boolean;
}

export interface TestAgentConfig {
  type: 'user' | 'admin';
  persona?: string;
  config: Record<string, any>;
}

export interface TestSchedule {
  frequency: 'continuous' | 'hourly' | 'daily' | 'weekly' | 'on_commit' | 'manual';
  time?: string; // For scheduled runs
  conditions?: string[]; // Conditions that trigger tests
}

export interface TestReport {
  id: string;
  timestamp: Date;
  duration: number;
  summary: TestSummary;
  results: TestResult[];
  recommendations: TestRecommendation[];
  quality_score: number;
  accessibility_score: number;
  performance_score: number;
  security_score: number;
}

export interface TestSummary {
  total_tests: number;
  passed: number;
  failed: number;
  critical_errors: number;
  high_errors: number;
  medium_errors: number;
  low_errors: number;
  success_rate: number;
}

export interface TestRecommendation {
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  action_items: string[];
  estimated_effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
}

export class TestOrchestrator {
  private testSuites: Map<string, TestSuite> = new Map();
  private runningTests: Set<string> = new Set();
  private testHistory: TestReport[] = [];
  private alertThresholds = {
    critical_errors: 0,
    success_rate: 95,
    performance_degradation: 20,
    accessibility_score: 90
  };

  constructor() {
    this.initializeDefaultTestSuites();
  }

  /**
   * Initialize default test suites for comprehensive coverage
   */
  private initializeDefaultTestSuites(): void {
    // Continuous Integration Test Suite
    this.addTestSuite({
      id: 'ci_suite',
      name: 'Continuous Integration Suite',
      description: 'Comprehensive testing for every commit',
      enabled: true,
      schedule: {
        frequency: 'on_commit',
        conditions: ['code_change', 'deployment']
      },
      agents: [
        {
          type: 'user',
          persona: 'alex_neurodiverse',
          config: { test_level: 'smoke' }
        },
        {
          type: 'user', 
          persona: 'sam_entrepreneur',
          config: { test_level: 'smoke' }
        },
        {
          type: 'admin',
          config: { test_level: 'critical_only' }
        }
      ]
    });

    // Daily Comprehensive Test Suite
    this.addTestSuite({
      id: 'daily_comprehensive',
      name: 'Daily Comprehensive Testing',
      description: 'Full feature and regression testing',
      enabled: true,
      schedule: {
        frequency: 'daily',
        time: '02:00', // 2 AM
        conditions: ['automated_schedule']
      },
      agents: [
        {
          type: 'user',
          persona: 'alex_neurodiverse',
          config: { test_level: 'comprehensive' }
        },
        {
          type: 'user',
          persona: 'sam_entrepreneur',
          config: { test_level: 'comprehensive' }
        },
        {
          type: 'user',
          persona: 'morgan_methodical',
          config: { test_level: 'comprehensive' }
        },
        {
          type: 'admin',
          config: { test_level: 'full' }
        }
      ]
    });

    // Weekly Deep Testing Suite
    this.addTestSuite({
      id: 'weekly_deep',
      name: 'Weekly Deep Testing',
      description: 'Extensive testing including load, security, and edge cases',
      enabled: true,
      schedule: {
        frequency: 'weekly',
        time: 'Sunday 01:00',
        conditions: ['weekly_schedule']
      },
      agents: [
        {
          type: 'user',
          persona: 'alex_neurodiverse',
          config: { test_level: 'extensive' }
        },
        {
          type: 'user',
          persona: 'sam_entrepreneur',
          config: { test_level: 'extensive' }
        },
        {
          type: 'user',
          persona: 'morgan_methodical',
          config: { test_level: 'extensive' }
        },
        {
          type: 'admin',
          config: { test_level: 'extensive', load_testing: true, security_testing: true }
        }
      ]
    });

    // On-Demand Manual Testing Suite
    this.addTestSuite({
      id: 'manual_suite',
      name: 'Manual Test Suite',
      description: 'On-demand testing for specific scenarios',
      enabled: true,
      schedule: {
        frequency: 'manual',
        conditions: ['manual_trigger']
      },
      agents: [
        {
          type: 'user',
          persona: 'alex_neurodiverse',
          config: { test_level: 'comprehensive' }
        },
        {
          type: 'admin',
          config: { test_level: 'comprehensive' }
        }
      ]
    });
  }

  /**
   * Add a new test suite
   */
  addTestSuite(suite: TestSuite): void {
    this.testSuites.set(suite.id, suite);
    console.log(`📋 Test suite added: ${suite.name}`);
  }

  /**
   * Execute a specific test suite
   */
  async executeTestSuite(suiteId: string, trigger: string = 'manual'): Promise<TestReport> {
    const suite = this.testSuites.get(suiteId);
    if (!suite) {
      throw new Error(`Test suite not found: ${suiteId}`);
    }

    if (!suite.enabled) {
      throw new Error(`Test suite is disabled: ${suiteId}`);
    }

    if (this.runningTests.has(suiteId)) {
      throw new Error(`Test suite is already running: ${suiteId}`);
    }

    console.log(`🚀 Starting test suite: ${suite.name} (triggered by: ${trigger})`);
    const startTime = Date.now();
    this.runningTests.add(suiteId);

    try {
      const results: TestResult[] = [];

      // Execute all agents in the test suite
      for (const agentConfig of suite.agents) {
        const agentResult = await this.executeTestAgent(agentConfig);
        results.push(agentResult);
      }

      const duration = Date.now() - startTime;
      const report = this.generateTestReport(suite, results, duration, trigger);

      // Store report in history
      this.testHistory.push(report);
      
      // Check for alerts
      await this.checkAlerts(report);

      // Generate notifications if needed
      await this.generateNotifications(report);

      console.log(`✅ Test suite completed: ${suite.name} (${duration}ms)`);
      return report;

    } catch (error) {
      console.error(`❌ Test suite failed: ${suite.name} - ${error}`);
      throw error;
    } finally {
      this.runningTests.delete(suiteId);
    }
  }

  /**
   * Execute a single test agent
   */
  private async executeTestAgent(config: TestAgentConfig): Promise<TestResult> {
    // Generate a unique user ID for this test
    const testUserId = `test_user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    let agent: TestAgentBase;

    if (config.type === 'user') {
      agent = new UserTestAgent(testUserId, config.persona || 'alex_neurodiverse');
    } else if (config.type === 'admin') {
      agent = new AdminTestAgent(testUserId);
    } else {
      throw new Error(`Unknown agent type: ${config.type}`);
    }

    try {
      console.log(`🤖 Executing ${config.type} agent${config.persona ? ` (${config.persona})` : ''}`);
      const result = await agent.executeTestSuite();
      console.log(`✅ ${config.type} agent completed successfully`);
      return result;
    } catch (error) {
      console.error(`❌ ${config.type} agent failed: ${error}`);
      // Return a failed result instead of throwing
      return {
        test_id: `failed_${Date.now()}`,
        agent_type: config.type,
        user_persona: config.persona || 'unknown',
        test_category: 'execution_failure',
        success: false,
        execution_time: 0,
        errors: [{
          type: 'functionality',
          severity: 'critical',
          component: 'agent_execution',
          message: `Agent execution failed: ${error}`,
          reproduction_steps: [`Execute ${config.type} agent`],
          expected: 'Agent should execute successfully',
          actual: `Agent failed: ${error}`
        }],
        performance_metrics: {
          page_load_time: 0,
          api_response_time: 0,
          memory_usage: 0,
          cpu_usage: 0,
          network_requests: 0,
          largest_contentful_paint: 0,
          first_input_delay: 0,
          cumulative_layout_shift: 0
        },
        accessibility_score: 0,
        recommendations: ['Fix agent execution failure'],
        timestamp: new Date()
      };
    }
  }

  /**
   * Generate comprehensive test report
   */
  private generateTestReport(
    suite: TestSuite,
    results: TestResult[],
    duration: number,
    trigger: string
  ): TestReport {
    const summary = this.calculateTestSummary(results);
    const recommendations = this.generateRecommendations(results);
    
    const qualityScore = this.calculateQualityScore(results);
    const accessibilityScore = this.calculateAccessibilityScore(results);
    const performanceScore = this.calculatePerformanceScore(results);
    const securityScore = this.calculateSecurityScore(results);

    return {
      id: `report_${Date.now()}_${suite.id}`,
      timestamp: new Date(),
      duration,
      summary,
      results,
      recommendations,
      quality_score: qualityScore,
      accessibility_score: accessibilityScore,
      performance_score: performanceScore,
      security_score: securityScore
    };
  }

  /**
   * Calculate test summary statistics
   */
  private calculateTestSummary(results: TestResult[]): TestSummary {
    const allErrors = results.flatMap(r => r.errors);
    
    const criticalErrors = allErrors.filter(e => e.severity === 'critical').length;
    const highErrors = allErrors.filter(e => e.severity === 'high').length;
    const mediumErrors = allErrors.filter(e => e.severity === 'medium').length;
    const lowErrors = allErrors.filter(e => e.severity === 'low').length;

    const passed = results.filter(r => r.success).length;
    const failed = results.length - passed;
    const successRate = results.length > 0 ? (passed / results.length) * 100 : 0;

    return {
      total_tests: results.length,
      passed,
      failed,
      critical_errors: criticalErrors,
      high_errors: highErrors,
      medium_errors: mediumErrors,
      low_errors: lowErrors,
      success_rate: Math.round(successRate * 100) / 100
    };
  }

  /**
   * Generate actionable recommendations based on test results
   */
  private generateRecommendations(results: TestResult[]): TestRecommendation[] {
    const recommendations: TestRecommendation[] = [];
    const allErrors = results.flatMap(r => r.errors);
    
    // Group errors by component and type
    const errorsByComponent = new Map<string, TestError[]>();
    const errorsByType = new Map<string, TestError[]>();

    allErrors.forEach(error => {
      const componentErrors = errorsByComponent.get(error.component) || [];
      componentErrors.push(error);
      errorsByComponent.set(error.component, componentErrors);

      const typeErrors = errorsByType.get(error.type) || [];
      typeErrors.push(error);
      errorsByType.set(error.type, typeErrors);
    });

    // Critical errors - immediate action required
    const criticalErrors = allErrors.filter(e => e.severity === 'critical');
    if (criticalErrors.length > 0) {
      recommendations.push({
        priority: 'critical',
        category: 'functionality',
        title: `Fix ${criticalErrors.length} Critical Errors Immediately`,
        description: 'Critical errors prevent core functionality and must be resolved before deployment.',
        action_items: [
          ...criticalErrors.slice(0, 5).map(e => `Fix: ${e.message}`),
          ...(criticalErrors.length > 5 ? ['Review all critical errors in detailed report'] : [])
        ],
        estimated_effort: 'high',
        impact: 'high'
      });
    }

    // Accessibility issues
    const accessibilityErrors = allErrors.filter(e => e.type === 'accessibility');
    if (accessibilityErrors.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'accessibility',
        title: 'Improve Accessibility Compliance',
        description: `${accessibilityErrors.length} accessibility issues detected that affect user inclusion.`,
        action_items: [
          'Review WCAG 2.1 AA compliance',
          'Test with screen readers',
          'Improve keyboard navigation',
          'Enhance color contrast',
          'Add missing ARIA labels'
        ],
        estimated_effort: 'medium',
        impact: 'high'
      });
    }

    // Performance issues
    const performanceErrors = allErrors.filter(e => e.type === 'performance');
    if (performanceErrors.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'performance',
        title: 'Optimize Performance',
        description: `${performanceErrors.length} performance issues detected affecting user experience.`,
        action_items: [
          'Optimize database queries',
          'Implement caching strategies',
          'Reduce bundle size',
          'Optimize API response times',
          'Implement lazy loading'
        ],
        estimated_effort: 'medium',
        impact: 'medium'
      });
    }

    // Security vulnerabilities
    const securityErrors = allErrors.filter(e => e.type === 'security');
    if (securityErrors.length > 0) {
      recommendations.push({
        priority: 'critical',
        category: 'security',
        title: 'Address Security Vulnerabilities',
        description: `${securityErrors.length} security issues detected that could compromise user data.`,
        action_items: [
          'Review authentication mechanisms',
          'Implement proper authorization checks',
          'Validate all user inputs',
          'Audit API endpoints',
          'Update security dependencies'
        ],
        estimated_effort: 'high',
        impact: 'high'
      });
    }

    // AI quality issues
    const aiErrors = allErrors.filter(e => e.type === 'ai_quality');
    if (aiErrors.length > 0) {
      recommendations.push({
        priority: 'medium',
        category: 'ai_quality',
        title: 'Improve AI Response Quality',
        description: `${aiErrors.length} AI quality issues detected in coaching interactions.`,
        action_items: [
          'Review AI prompts and context',
          'Improve response validation',
          'Add more training examples',
          'Implement response quality scoring',
          'Test edge cases in AI interactions'
        ],
        estimated_effort: 'medium',
        impact: 'medium'
      });
    }

    // Component-specific recommendations
    for (const [component, errors] of errorsByComponent) {
      if (errors.length >= 3) { // Multiple errors in same component
        recommendations.push({
          priority: 'medium',
          category: 'component_reliability',
          title: `Stabilize ${component} Component`,
          description: `${errors.length} errors detected in ${component} component indicating reliability issues.`,
          action_items: [
            `Comprehensive review of ${component} component`,
            'Add unit tests for error scenarios',
            'Implement better error handling',
            'Add logging and monitoring',
            'Consider refactoring if complexity is high'
          ],
          estimated_effort: 'medium',
          impact: 'medium'
        });
      }
    }

    // Sort recommendations by priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return recommendations.slice(0, 10); // Top 10 recommendations
  }

  /**
   * Calculate overall quality score
   */
  private calculateQualityScore(results: TestResult[]): number {
    if (results.length === 0) return 0;

    const allErrors = results.flatMap(r => r.errors);
    const criticalCount = allErrors.filter(e => e.severity === 'critical').length;
    const highCount = allErrors.filter(e => e.severity === 'high').length;
    const mediumCount = allErrors.filter(e => e.severity === 'medium').length;

    let score = 100;
    score -= criticalCount * 30; // Critical: -30 points each
    score -= highCount * 15;     // High: -15 points each
    score -= mediumCount * 5;    // Medium: -5 points each

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate accessibility score
   */
  private calculateAccessibilityScore(results: TestResult[]): number {
    if (results.length === 0) return 0;

    const accessibilityScores = results.map(r => r.accessibility_score);
    return accessibilityScores.reduce((sum, score) => sum + score, 0) / accessibilityScores.length;
  }

  /**
   * Calculate performance score
   */
  private calculatePerformanceScore(results: TestResult[]): number {
    if (results.length === 0) return 0;

    let score = 100;
    const performanceErrors = results.flatMap(r => r.errors).filter(e => e.type === 'performance');
    
    performanceErrors.forEach(error => {
      if (error.severity === 'critical') score -= 25;
      else if (error.severity === 'high') score -= 15;
      else if (error.severity === 'medium') score -= 10;
      else score -= 5;
    });

    // Factor in performance metrics
    const avgResponseTime = results.reduce((sum, r) => sum + r.performance_metrics.api_response_time, 0) / results.length;
    if (avgResponseTime > 3000) score -= 20; // -20 for slow API responses
    if (avgResponseTime > 5000) score -= 30; // Additional -30 for very slow responses

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate security score
   */
  private calculateSecurityScore(results: TestResult[]): number {
    if (results.length === 0) return 0;

    let score = 100;
    const securityErrors = results.flatMap(r => r.errors).filter(e => e.type === 'security');
    
    securityErrors.forEach(error => {
      if (error.severity === 'critical') score -= 50; // Critical security issues are major
      else if (error.severity === 'high') score -= 25;
      else if (error.severity === 'medium') score -= 10;
      else score -= 5;
    });

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Check for alerts based on test results
   */
  private async checkAlerts(report: TestReport): Promise<void> {
    const alerts: string[] = [];

    // Critical errors alert
    if (report.summary.critical_errors > this.alertThresholds.critical_errors) {
      alerts.push(`🚨 CRITICAL: ${report.summary.critical_errors} critical errors detected`);
    }

    // Success rate alert
    if (report.summary.success_rate < this.alertThresholds.success_rate) {
      alerts.push(`⚠️ LOW SUCCESS RATE: ${report.summary.success_rate}% (threshold: ${this.alertThresholds.success_rate}%)`);
    }

    // Performance degradation alert
    if (report.performance_score < (100 - this.alertThresholds.performance_degradation)) {
      alerts.push(`🐌 PERFORMANCE DEGRADATION: Score ${report.performance_score}/100`);
    }

    // Accessibility alert
    if (report.accessibility_score < this.alertThresholds.accessibility_score) {
      alerts.push(`♿ ACCESSIBILITY ISSUES: Score ${report.accessibility_score}/100`);
    }

    // Security alert
    if (report.security_score < 90) {
      alerts.push(`🔒 SECURITY CONCERNS: Score ${report.security_score}/100`);
    }

    if (alerts.length > 0) {
      console.warn('🚨 TEST ALERTS:', alerts.join(' | '));
      // In a real implementation, this would send notifications via email, Slack, etc.
    }
  }

  /**
   * Generate notifications for stakeholders
   */
  private async generateNotifications(report: TestReport): Promise<void> {
    // Generate different notifications based on results
    if (report.summary.critical_errors > 0) {
      console.log('📧 Sending critical error notification to development team');
    }

    if (report.accessibility_score < 80) {
      console.log('📧 Sending accessibility notification to UX team');
    }

    if (report.security_score < 90) {
      console.log('📧 Sending security notification to security team');
    }

    if (report.summary.success_rate >= 98 && report.quality_score >= 95) {
      console.log('🎉 Sending success notification - all systems green!');
    }
  }

  /**
   * Execute tests based on trigger conditions
   */
  async executeTriggeredTests(trigger: string, metadata?: Record<string, any>): Promise<TestReport[]> {
    const reports: TestReport[] = [];
    
    for (const [suiteId, suite] of this.testSuites) {
      if (!suite.enabled) continue;

      const shouldRun = this.shouldRunSuite(suite, trigger, metadata);
      if (shouldRun) {
        try {
          const report = await this.executeTestSuite(suiteId, trigger);
          reports.push(report);
        } catch (error) {
          console.error(`Failed to execute triggered test suite ${suiteId}:`, error);
        }
      }
    }

    return reports;
  }

  /**
   * Determine if a test suite should run based on trigger conditions
   */
  private shouldRunSuite(suite: TestSuite, trigger: string, metadata?: Record<string, any>): boolean {
    const schedule = suite.schedule;

    // Check frequency-based triggers
    if (schedule.frequency === 'continuous' && trigger === 'continuous') return true;
    if (schedule.frequency === 'on_commit' && trigger === 'commit') return true;
    if (schedule.frequency === 'daily' && trigger === 'daily_schedule') return true;
    if (schedule.frequency === 'weekly' && trigger === 'weekly_schedule') return true;
    if (schedule.frequency === 'manual' && trigger === 'manual') return true;

    // Check condition-based triggers
    if (schedule.conditions?.includes(trigger)) return true;

    return false;
  }

  /**
   * Get test history and analytics
   */
  getTestHistory(limit: number = 50): TestReport[] {
    return this.testHistory
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get test trends and analytics
   */
  getTestAnalytics(): {
    trends: {
      success_rate: number[];
      quality_score: number[];
      accessibility_score: number[];
      performance_score: number[];
      security_score: number[];
    };
    averages: {
      success_rate: number;
      quality_score: number;
      accessibility_score: number;
      performance_score: number;
      security_score: number;
    };
  } {
    const recentReports = this.getTestHistory(30); // Last 30 reports

    if (recentReports.length === 0) {
      return {
        trends: {
          success_rate: [],
          quality_score: [],
          accessibility_score: [],
          performance_score: [],
          security_score: []
        },
        averages: {
          success_rate: 0,
          quality_score: 0,
          accessibility_score: 0,
          performance_score: 0,
          security_score: 0
        }
      };
    }

    const trends = {
      success_rate: recentReports.map(r => r.summary.success_rate),
      quality_score: recentReports.map(r => r.quality_score),
      accessibility_score: recentReports.map(r => r.accessibility_score),
      performance_score: recentReports.map(r => r.performance_score),
      security_score: recentReports.map(r => r.security_score)
    };

    const averages = {
      success_rate: trends.success_rate.reduce((a, b) => a + b, 0) / trends.success_rate.length,
      quality_score: trends.quality_score.reduce((a, b) => a + b, 0) / trends.quality_score.length,
      accessibility_score: trends.accessibility_score.reduce((a, b) => a + b, 0) / trends.accessibility_score.length,
      performance_score: trends.performance_score.reduce((a, b) => a + b, 0) / trends.performance_score.length,
      security_score: trends.security_score.reduce((a, b) => a + b, 0) / trends.security_score.length
    };

    return { trends, averages };
  }

  /**
   * Generate comprehensive dashboard data
   */
  getDashboardData(): {
    current_status: 'green' | 'yellow' | 'red';
    active_tests: number;
    recent_results: TestSummary;
    alerts: string[];
    trends: any;
    recommendations: TestRecommendation[];
  } {
    const recentReport = this.testHistory[0];
    const analytics = this.getTestAnalytics();
    
    let status: 'green' | 'yellow' | 'red' = 'green';
    const alerts: string[] = [];

    if (recentReport) {
      if (recentReport.summary.critical_errors > 0 || recentReport.security_score < 80) {
        status = 'red';
        alerts.push('Critical issues detected');
      } else if (recentReport.summary.success_rate < 90 || recentReport.quality_score < 80) {
        status = 'yellow';
        alerts.push('Quality concerns detected');
      }
    }

    return {
      current_status: status,
      active_tests: this.runningTests.size,
      recent_results: recentReport?.summary || {
        total_tests: 0,
        passed: 0,
        failed: 0,
        critical_errors: 0,
        high_errors: 0,
        medium_errors: 0,
        low_errors: 0,
        success_rate: 0
      },
      alerts,
      trends: analytics,
      recommendations: recentReport?.recommendations || []
    };
  }

  /**
   * Manual test execution for specific scenarios
   */
  async runManualTest(
    agentType: 'user' | 'admin',
    persona?: string,
    testLevel: 'smoke' | 'comprehensive' | 'extensive' = 'comprehensive'
  ): Promise<TestReport> {
    console.log(`🎯 Running manual test: ${agentType} agent${persona ? ` (${persona})` : ''}, level: ${testLevel}`);
    
    const config: TestAgentConfig = {
      type: agentType,
      persona,
      config: { test_level: testLevel }
    };

    const result = await this.executeTestAgent(config);
    const report = this.generateTestReport(
      {
        id: 'manual_test',
        name: 'Manual Test Execution',
        description: `Manual ${agentType} test`,
        enabled: true,
        schedule: { frequency: 'manual' },
        agents: [config]
      },
      [result],
      result.execution_time,
      'manual'
    );

    this.testHistory.push(report);
    await this.checkAlerts(report);

    return report;
  }
}

export default TestOrchestrator;
