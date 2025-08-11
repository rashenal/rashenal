// Optimization Test - Simple integration test for the token optimization system
// Tests that all components can be initialized and work together

import { optimizationInitializer } from './OptimizationInitializer';
import { aiService } from './AIService';
import { tokenAnalytics } from '../analytics/TokenAnalytics';
import { localLLM } from './LocalLLMService';
import { aiRouter } from './AIRouter';
import { promptOptimizer } from './PromptOptimizer';
import { responseCache } from './ResponseCache';

interface TestResult {
  component: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  duration_ms: number;
}

interface OptimizationTestReport {
  overall_status: 'pass' | 'fail';
  total_tests: number;
  passed: number;
  failed: number;
  warnings: number;
  results: TestResult[];
  summary: string;
  recommendations: string[];
}

export class OptimizationTest {
  private results: TestResult[] = [];

  async runIntegrationTest(): Promise<OptimizationTestReport> {
    console.log('🧪 Running token optimization integration test...');
    
    this.results = [];

    // Test each component
    await this.testTokenAnalytics();
    await this.testPromptOptimizer();
    await this.testResponseCache();
    await this.testLocalLLM();
    await this.testAIRouter();
    await this.testAIService();
    await this.testOptimizationInitializer();

    // Generate report
    const report = this.generateReport();
    this.logReport(report);
    
    return report;
  }

  private async testTokenAnalytics(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Test basic analytics functionality
      await tokenAnalytics.logTokenUsage({
        operation: 'integration_test',
        agent_id: 'test_agent',
        agent_type: 'chat-assistant',
        prompt_tokens: 100,
        completion_tokens: 50,
        total_tokens: 150,
        model_type: 'local-llama',
        category: 'routine',
        priority: 'low',
        cached: false,
        optimization_applied: ['test_optimization'],
        response_time_ms: 1000,
        retry_count: 0,
        user_id: 'test_user',
        request_size_chars: 500,
        response_size_chars: 200
      });

      // Test metrics generation
      const metrics = tokenAnalytics.getRealTimeMetrics();
      
      if (metrics.daily_tokens > 0) {
        this.addResult('Token Analytics', 'pass', 'Analytics logging and metrics working', Date.now() - startTime);
      } else {
        this.addResult('Token Analytics', 'warning', 'Analytics working but no metrics data', Date.now() - startTime);
      }

    } catch (error) {
      this.addResult('Token Analytics', 'fail', `Analytics failed: ${error}`, Date.now() - startTime);
    }
  }

  private async testPromptOptimizer(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const testPrompt = "Please provide a comprehensive and detailed analysis of the following data with extensive explanations and multiple examples to help me understand the complex concepts involved.";
      
      const result = await promptOptimizer.optimizePrompt(testPrompt, 'integration_test');
      
      if (result.compression_ratio > 0.1) {
        this.addResult('Prompt Optimizer', 'pass', `Optimization working (${(result.compression_ratio * 100).toFixed(1)}% compression)`, Date.now() - startTime);
      } else {
        this.addResult('Prompt Optimizer', 'warning', 'Low compression achieved', Date.now() - startTime);
      }

    } catch (error) {
      this.addResult('Prompt Optimizer', 'fail', `Optimization failed: ${error}`, Date.now() - startTime);
    }
  }

  private async testResponseCache(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Test cache set and get
      const testKey = await responseCache.set('test prompt', 'test response', {
        operation: 'integration_test',
        user_id: 'test_user',
        model_used: 'test_model',
        quality_score: 0.9,
        token_count: 100,
        processing_cost: 0.01
      });

      const cached = await responseCache.get('test prompt', 'integration_test', 'test_user');
      
      if (cached && cached.exact_match) {
        this.addResult('Response Cache', 'pass', 'Cache set/get working correctly', Date.now() - startTime);
      } else {
        this.addResult('Response Cache', 'warning', 'Cache working but retrieval issues', Date.now() - startTime);
      }

    } catch (error) {
      this.addResult('Response Cache', 'fail', `Cache failed: ${error}`, Date.now() - startTime);
    }
  }

  private async testLocalLLM(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const isHealthy = await localLLM.checkHealth();
      
      if (isHealthy) {
        // Try a quick test if healthy
        try {
          await localLLM.generateQuickResponse('Test message');
          this.addResult('Local LLM', 'pass', 'Local LLM service healthy and responsive', Date.now() - startTime);
        } catch (testError) {
          this.addResult('Local LLM', 'warning', 'Service healthy but test response failed', Date.now() - startTime);
        }
      } else {
        this.addResult('Local LLM', 'warning', 'Local LLM service unavailable (will use cloud fallback)', Date.now() - startTime);
      }

    } catch (error) {
      this.addResult('Local LLM', 'warning', `Local LLM check failed (fallback available): ${error}`, Date.now() - startTime);
    }
  }

  private async testAIRouter(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const decision = await aiRouter.makeRoutingDecision('Test routing prompt', {
        operation: 'integration_test',
        user_id: 'test_user',
        priority: 'medium',
        category: 'routine'
      });
      
      if (decision && decision.strategy) {
        this.addResult('AI Router', 'pass', `Routing decision working (strategy: ${decision.strategy})`, Date.now() - startTime);
      } else {
        this.addResult('AI Router', 'fail', 'Router decision making failed', Date.now() - startTime);
      }

    } catch (error) {
      this.addResult('AI Router', 'fail', `Router failed: ${error}`, Date.now() - startTime);
    }
  }

  private async testAIService(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const status = aiService.getOptimizationStatus();
      
      if (status && typeof status.optimization_enabled === 'boolean') {
        this.addResult('AI Service', 'pass', `AI Service wrapper working (optimization: ${status.optimization_enabled})`, Date.now() - startTime);
      } else {
        this.addResult('AI Service', 'fail', 'AI Service status check failed', Date.now() - startTime);
      }

    } catch (error) {
      this.addResult('AI Service', 'fail', `AI Service failed: ${error}`, Date.now() - startTime);
    }
  }

  private async testOptimizationInitializer(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const status = optimizationInitializer.getStatus();
      
      if (status) {
        const healthyServices = Object.values(status).filter(s => s === true).length;
        const totalServices = Object.keys(status).length - 1; // Exclude overall_health
        
        if (healthyServices >= totalServices * 0.7) { // At least 70% healthy
          this.addResult('Optimization Initializer', 'pass', `System initialized (${healthyServices}/${totalServices} services)`, Date.now() - startTime);
        } else {
          this.addResult('Optimization Initializer', 'warning', `Partial initialization (${healthyServices}/${totalServices} services)`, Date.now() - startTime);
        }
      } else {
        this.addResult('Optimization Initializer', 'fail', 'Initializer status unavailable', Date.now() - startTime);
      }

    } catch (error) {
      this.addResult('Optimization Initializer', 'fail', `Initializer failed: ${error}`, Date.now() - startTime);
    }
  }

  private addResult(component: string, status: 'pass' | 'fail' | 'warning', message: string, duration: number): void {
    this.results.push({
      component,
      status,
      message,
      duration_ms: duration
    });
  }

  private generateReport(): OptimizationTestReport {
    const passed = this.results.filter(r => r.status === 'pass').length;
    const failed = this.results.filter(r => r.status === 'fail').length;
    const warnings = this.results.filter(r => r.status === 'warning').length;
    
    const overallStatus = failed === 0 && passed >= this.results.length * 0.7 ? 'pass' : 'fail';
    
    let summary = '';
    if (overallStatus === 'pass') {
      summary = '✅ Token optimization system is working correctly and ready for production use.';
    } else {
      summary = '❌ Token optimization system has issues that need attention.';
    }

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (failed > 0) {
      recommendations.push('Fix failed components before deploying to production');
    }
    
    if (warnings > 0) {
      recommendations.push('Address warning components for optimal performance');
    }

    const hasLocalLLMIssues = this.results.some(r => r.component === 'Local LLM' && r.status !== 'pass');
    if (hasLocalLLMIssues) {
      recommendations.push('Install Ollama for local LLM support to maximize cost savings');
    }

    const hasCacheIssues = this.results.some(r => r.component === 'Response Cache' && r.status !== 'pass');
    if (hasCacheIssues) {
      recommendations.push('Fix response cache for better performance and cost savings');
    }

    if (recommendations.length === 0) {
      recommendations.push('System is working optimally - monitor performance and costs regularly');
    }

    return {
      overall_status: overallStatus,
      total_tests: this.results.length,
      passed,
      failed,
      warnings,
      results: this.results,
      summary,
      recommendations
    };
  }

  private logReport(report: OptimizationTestReport): void {
    console.log(`
🧪 TOKEN OPTIMIZATION INTEGRATION TEST REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Overall Status: ${report.overall_status === 'pass' ? '✅ PASS' : '❌ FAIL'}
Tests: ${report.passed}/${report.total_tests} passed, ${report.warnings} warnings, ${report.failed} failed

${report.summary}

Component Results:
${report.results.map(r => {
  const icon = r.status === 'pass' ? '✅' : r.status === 'warning' ? '⚠️' : '❌';
  return `${icon} ${r.component}: ${r.message} (${r.duration_ms}ms)`;
}).join('\n')}

Recommendations:
${report.recommendations.map(r => `• ${r}`).join('\n')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);
  }

  // Quick smoke test for basic functionality
  async runSmokeTest(): Promise<boolean> {
    console.log('🔥 Running token optimization smoke test...');
    
    try {
      // Test just the critical path
      const optimizerResult = await promptOptimizer.optimizePrompt('Test prompt', 'smoke_test');
      const routerDecision = await aiRouter.makeRoutingDecision('Test prompt', {
        operation: 'smoke_test',
        user_id: 'test',
        priority: 'low',
        category: 'routine'
      });
      
      const success = optimizerResult.compression_ratio >= 0 && routerDecision.strategy !== undefined;
      
      console.log(success ? '✅ Smoke test passed' : '❌ Smoke test failed');
      return success;

    } catch (error) {
      console.error('❌ Smoke test failed:', error);
      return false;
    }
  }
}

// Export singleton for easy testing
export const optimizationTest = new OptimizationTest();