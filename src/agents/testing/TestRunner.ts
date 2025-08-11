/**
 * Test Runner - Command line interface for executing Rashenal tests
 * Provides easy access to run different test scenarios and generate reports
 */

import { TestOrchestrator } from './testing/TestOrchestrator';
import { UserTestAgent } from './testing/UserTestAgent';
import { AdminTestAgent } from './testing/AdminTestAgent';

export interface TestRunnerConfig {
  mode: 'ci' | 'dev' | 'production' | 'manual';
  agents: ('user' | 'admin')[];
  personas?: string[];
  testLevel: 'smoke' | 'comprehensive' | 'extensive';
  outputFormat: 'console' | 'json' | 'html' | 'all';
  reportPath?: string;
  verbose?: boolean;
  failFast?: boolean;
}

export class TestRunner {
  private orchestrator: TestOrchestrator;
  private config: TestRunnerConfig;

  constructor(config: TestRunnerConfig) {
    this.orchestrator = new TestOrchestrator();
    this.config = config;
  }

  /**
   * Main test execution entry point
   */
  async run(): Promise<void> {
    console.log('🚀 Rashenal Test Runner Starting...');
    console.log(`Mode: ${this.config.mode}`);
    console.log(`Test Level: ${this.config.testLevel}`);
    console.log(`Agents: ${this.config.agents.join(', ')}`);
    
    const startTime = Date.now();
    let exitCode = 0;

    try {
      if (this.config.mode === 'ci') {
        await this.runCITests();
      } else if (this.config.mode === 'dev') {
        await this.runDevTests();
      } else if (this.config.mode === 'production') {
        await this.runProductionTests();
      } else {
        await this.runManualTests();
      }

      console.log(`✅ All tests completed successfully in ${Date.now() - startTime}ms`);
    } catch (error) {
      console.error(`❌ Test execution failed: ${error}`);
      exitCode = 1;
    }

    // Generate final report
    await this.generateFinalReport();

    if (typeof process !== 'undefined') {
      process.exit(exitCode);
    }
  }

  /**
   * Run CI/CD pipeline tests
   */
  private async runCITests(): Promise<void> {
    console.log('🔄 Running CI/CD Tests...');
    
    const reports = await this.orchestrator.executeTriggeredTests('commit', {
      commit_hash: process.env.GITHUB_SHA || 'local',
      branch: process.env.GITHUB_REF || 'main'
    });

    this.validateCIResults(reports);
  }

  /**
   * Run development tests
   */
  private async runDevTests(): Promise<void> {
    console.log('🛠️ Running Development Tests...');
    
    // Quick smoke tests for development
    const personas = this.config.personas || ['alex_neurodiverse'];
    
    for (const persona of personas) {
      if (this.config.agents.includes('user')) {
        await this.orchestrator.runManualTest('user', persona, 'smoke');
      }
    }

    if (this.config.agents.includes('admin')) {
      await this.orchestrator.runManualTest('admin', undefined, 'smoke');
    }
  }

  /**
   * Run production readiness tests
   */
  private async runProductionTests(): Promise<void> {
    console.log('🏭 Running Production Tests...');
    
    const report = await this.orchestrator.executeTestSuite('daily_comprehensive', 'production');
    
    // Validate production readiness
    if (report.summary.critical_errors > 0) {
      throw new Error(`Production deployment blocked: ${report.summary.critical_errors} critical errors`);
    }

    if (report.summary.success_rate < 95) {
      throw new Error(`Production deployment blocked: Success rate ${report.summary.success_rate}% below 95% threshold`);
    }

    if (report.security_score < 90) {
      throw new Error(`Production deployment blocked: Security score ${report.security_score} below 90 threshold`);
    }

    if (report.accessibility_score < 90) {
      throw new Error(`Production deployment blocked: Accessibility score ${report.accessibility_score} below 90 threshold`);
    }
  }

  /**
   * Run manual tests
   */
  private async runManualTests(): Promise<void> {
    console.log('🎯 Running Manual Tests...');
    
    const personas = this.config.personas || ['alex_neurodiverse', 'sam_entrepreneur'];
    
    for (const persona of personas) {
      if (this.config.agents.includes('user')) {
        console.log(`Testing user persona: ${persona}`);
        await this.orchestrator.runManualTest('user', persona, this.config.testLevel);
      }
    }

    if (this.config.agents.includes('admin')) {
      console.log('Testing admin scenarios');
      await this.orchestrator.runManualTest('admin', undefined, this.config.testLevel);
    }
  }

  /**
   * Validate CI test results
   */
  private validateCIResults(reports: any[]): void {
    for (const report of reports) {
      if (report.summary.critical_errors > 0) {
        throw new Error(`CI failed: ${report.summary.critical_errors} critical errors detected`);
      }

      if (this.config.failFast && report.summary.failed > 0) {
        throw new Error(`CI failed: Test failures detected and fail-fast enabled`);
      }
    }
  }

  /**
   * Generate comprehensive final report
   */
  private async generateFinalReport(): Promise<void> {
    console.log('📊 Generating Test Report...');
    
    const dashboardData = this.orchestrator.getDashboardData();
    const analytics = this.orchestrator.getTestAnalytics();
    const history = this.orchestrator.getTestHistory(10);

    if (this.config.outputFormat === 'console' || this.config.outputFormat === 'all') {
      this.printConsoleReport(dashboardData, analytics);
    }

    if (this.config.outputFormat === 'json' || this.config.outputFormat === 'all') {
      await this.generateJSONReport(dashboardData, analytics, history);
    }

    if (this.config.outputFormat === 'html' || this.config.outputFormat === 'all') {
      await this.generateHTMLReport(dashboardData, analytics, history);
    }
  }

  /**
   * Print console report
   */
  private printConsoleReport(dashboardData: any, analytics: any): void {
    console.log('\n' + '='.repeat(80));
    console.log('📊 RASHENAL TEST RESULTS SUMMARY');
    console.log('='.repeat(80));
    
    // Status indicator
    const statusEmoji = {
      green: '🟢',
      yellow: '🟡', 
      red: '🔴'
    };
    
    console.log(`\n🎯 Overall Status: ${statusEmoji[dashboardData.current_status]} ${dashboardData.current_status.toUpperCase()}`);
    
    if (dashboardData.recent_results) {
      const results = dashboardData.recent_results;
      console.log(`\n📈 Test Results:`);
      console.log(`   Total Tests: ${results.total_tests}`);
      console.log(`   Passed: ${results.passed} ✅`);
      console.log(`   Failed: ${results.failed} ❌`);
      console.log(`   Success Rate: ${results.success_rate}%`);
      console.log(`\n🚨 Error Breakdown:`);
      console.log(`   Critical: ${results.critical_errors}`);
      console.log(`   High: ${results.high_errors}`);
      console.log(`   Medium: ${results.medium_errors}`);
      console.log(`   Low: ${results.low_errors}`);
    }

    if (analytics.averages) {
      console.log(`\n📊 Quality Scores (Average):`);
      console.log(`   Quality: ${Math.round(analytics.averages.quality_score)}/100`);
      console.log(`   Accessibility: ${Math.round(analytics.averages.accessibility_score)}/100`);
      console.log(`   Performance: ${Math.round(analytics.averages.performance_score)}/100`);
      console.log(`   Security: ${Math.round(analytics.averages.security_score)}/100`);
    }

    if (dashboardData.alerts && dashboardData.alerts.length > 0) {
      console.log(`\n⚠️ Alerts:`);
      dashboardData.alerts.forEach((alert: string) => console.log(`   ${alert}`));
    }

    if (dashboardData.recommendations && dashboardData.recommendations.length > 0) {
      console.log(`\n💡 Top Recommendations:`);
      dashboardData.recommendations.slice(0, 5).forEach((rec: any, i: number) => {
        console.log(`   ${i + 1}. [${rec.priority.toUpperCase()}] ${rec.title}`);
      });
    }

    console.log('\n' + '='.repeat(80));
  }

  /**
   * Generate JSON report
   */
  private async generateJSONReport(dashboardData: any, analytics: any, history: any[]): Promise<void> {
    const report = {
      timestamp: new Date().toISOString(),
      config: this.config,
      summary: dashboardData,
      analytics,
      recent_history: history.slice(0, 5),
      generated_by: 'Rashenal Test Runner'
    };

    const reportPath = this.config.reportPath || './test-results.json';
    
    try {
      // In a real implementation, this would write to file system
      console.log(`📄 JSON report would be saved to: ${reportPath}`);
      if (this.config.verbose) {
        console.log(JSON.stringify(report, null, 2));
      }
    } catch (error) {
      console.warn(`Failed to write JSON report: ${error}`);
    }
  }

  /**
   * Generate HTML report
   */
  private async generateHTMLReport(dashboardData: any, analytics: any, history: any[]): Promise<void> {
    const htmlReport = this.generateHTMLTemplate(dashboardData, analytics, history);
    const reportPath = this.config.reportPath?.replace('.json', '.html') || './test-results.html';
    
    try {
      console.log(`📄 HTML report would be saved to: ${reportPath}`);
      if (this.config.verbose) {
        console.log('HTML report generated successfully');
      }
    } catch (error) {
      console.warn(`Failed to write HTML report: ${error}`);
    }
  }

  /**
   * Generate HTML template for report
   */
  private generateHTMLTemplate(dashboardData: any, analytics: any, history: any[]): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rashenal Test Results</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; margin: 0; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 30px; }
        .card { background: white; border-radius: 10px; padding: 25px; margin-bottom: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .status-green { color: #22c55e; }
        .status-yellow { color: #f59e0b; }
        .status-red { color: #ef4444; }
        .metric { display: inline-block; margin: 10px 20px 10px 0; }
        .metric-value { font-size: 24px; font-weight: bold; }
        .metric-label { font-size: 14px; color: #666; }
        .progress-bar { background: #e5e7eb; height: 8px; border-radius: 4px; overflow: hidden; margin: 5px 0; }
        .progress-fill { height: 100%; transition: width 0.3s ease; }
        .recommendations { list-style: none; padding: 0; }
        .recommendation { padding: 15px; margin: 10px 0; border-left: 4px solid #3b82f6; background: #f8fafc; border-radius: 0 5px 5px 0; }
        .priority-critical { border-left-color: #ef4444; }
        .priority-high { border-left-color: #f59e0b; }
        .priority-medium { border-left-color: #3b82f6; }
        .priority-low { border-left-color: #6b7280; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Rashenal Test Results</h1>
            <p>Generated: ${new Date().toLocaleString()}</p>
            <p>Status: <span class="status-${dashboardData.current_status}">${dashboardData.current_status.toUpperCase()}</span></p>
        </div>

        <div class="card">
            <h2>📊 Test Summary</h2>
            <div class="metric">
                <div class="metric-value">${dashboardData.recent_results?.total_tests || 0}</div>
                <div class="metric-label">Total Tests</div>
            </div>
            <div class="metric">
                <div class="metric-value status-green">${dashboardData.recent_results?.passed || 0}</div>
                <div class="metric-label">Passed</div>
            </div>
            <div class="metric">
                <div class="metric-value status-red">${dashboardData.recent_results?.failed || 0}</div>
                <div class="metric-label">Failed</div>
            </div>
            <div class="metric">
                <div class="metric-value">${dashboardData.recent_results?.success_rate || 0}%</div>
                <div class="metric-label">Success Rate</div>
            </div>
        </div>

        <div class="card">
            <h2>📈 Quality Scores</h2>
            ${this.generateScoreHTML('Quality', analytics.averages?.quality_score || 0)}
            ${this.generateScoreHTML('Accessibility', analytics.averages?.accessibility_score || 0)}
            ${this.generateScoreHTML('Performance', analytics.averages?.performance_score || 0)}
            ${this.generateScoreHTML('Security', analytics.averages?.security_score || 0)}
        </div>

        ${dashboardData.recommendations?.length > 0 ? `
        <div class="card">
            <h2>💡 Recommendations</h2>
            <ul class="recommendations">
                ${dashboardData.recommendations.slice(0, 10).map((rec: any) => `
                    <li class="recommendation priority-${rec.priority}">
                        <strong>[${rec.priority.toUpperCase()}] ${rec.title}</strong>
                        <p>${rec.description}</p>
                    </li>
                `).join('')}
            </ul>
        </div>
        ` : ''}

        <div class="card">
            <h2>🕐 Recent Test History</h2>
            ${history.length > 0 ? `
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f8fafc;">
                            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb;">Timestamp</th>
                            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb;">Success Rate</th>
                            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb;">Errors</th>
                            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb;">Quality Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${history.slice(0, 10).map(h => `
                            <tr>
                                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${new Date(h.timestamp).toLocaleString()}</td>
                                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${h.summary.success_rate}%</td>
                                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${h.summary.critical_errors + h.summary.high_errors}</td>
                                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${Math.round(h.quality_score)}/100</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            ` : '<p>No test history available</p>'}
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Generate score HTML with progress bar
   */
  private generateScoreHTML(label: string, score: number): string {
    const roundedScore = Math.round(score);
    const colorClass = roundedScore >= 90 ? 'status-green' : roundedScore >= 70 ? 'status-yellow' : 'status-red';
    const backgroundColor = roundedScore >= 90 ? '#22c55e' : roundedScore >= 70 ? '#f59e0b' : '#ef4444';
    
    return `
        <div style="margin-bottom: 15px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <span>${label}</span>
                <span class="${colorClass}" style="font-weight: bold;">${roundedScore}/100</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${roundedScore}%; background-color: ${backgroundColor};"></div>
            </div>
        </div>
    `;
  }
}

/**
 * CLI entry point for test runner
 */
export async function runTests(config: Partial<TestRunnerConfig> = {}): Promise<void> {
  const defaultConfig: TestRunnerConfig = {
    mode: 'manual',
    agents: ['user', 'admin'],
    personas: ['alex_neurodiverse'],
    testLevel: 'comprehensive',
    outputFormat: 'console',
    verbose: false,
    failFast: false
  };

  const finalConfig = { ...defaultConfig, ...config };
  const runner = new TestRunner(finalConfig);
  
  await runner.run();
}

// Export for command line usage
if (typeof process !== 'undefined' && process.argv[1]?.includes('TestRunner')) {
  const args = process.argv.slice(2);
  const config: Partial<TestRunnerConfig> = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace('--', '');
    const value = args[i + 1];
    
    switch (key) {
      case 'mode':
        config.mode = value as any;
        break;
      case 'agents':
        config.agents = value.split(',') as any;
        break;
      case 'personas':
        config.personas = value.split(',');
        break;
      case 'testLevel':
        config.testLevel = value as any;
        break;
      case 'outputFormat':
        config.outputFormat = value as any;
        break;
      case 'verbose':
        config.verbose = value === 'true';
        break;
      case 'failFast':
        config.failFast = value === 'true';
        break;
    }
  }

  runTests(config).catch(console.error);
}

export default TestRunner;
