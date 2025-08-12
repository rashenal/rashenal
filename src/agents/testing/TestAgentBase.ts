/**
 * Base Test Agent - Foundation for all autonomous testing agents
 * Provides common functionality for user simulation, error detection, and reporting
 */

import { supabase } from '../../lib/supabase';
import type { Database } from '../../types/database';

export interface TestUser {
  id: string;
  email: string;
  profile: {
    name: string;
    bio: string;
    preferences: Record<string, any>;
    accessibility_needs: string[];
    cognitive_style: 'focused' | 'flexible' | 'systematic' | 'exploratory';
    technology_comfort: 'low' | 'medium' | 'high';
  };
  test_data: {
    habits: any[];
    tasks: any[];
    goals: any[];
    job_profiles: any[];
  };
}

export interface TestResult {
  test_id: string;
  agent_type: string;
  user_persona: string;
  test_category: string;
  success: boolean;
  execution_time: number;
  errors: TestError[];
  performance_metrics: PerformanceMetrics;
  accessibility_score: number;
  recommendations: string[];
  timestamp: Date;
}

export interface TestError {
  type: 'functionality' | 'accessibility' | 'performance' | 'ai_quality' | 'security' | 'usability';
  severity: 'critical' | 'high' | 'medium' | 'low';
  component: string;
  message: string;
  stack?: string;
  reproduction_steps: string[];
  expected: string;
  actual: string;
}

export interface PerformanceMetrics {
  page_load_time: number;
  api_response_time: number;
  memory_usage: number;
  cpu_usage: number;
  network_requests: number;
  largest_contentful_paint: number;
  first_input_delay: number;
  cumulative_layout_shift: number;
}

export interface AccessibilityCheck {
  component: string;
  wcag_level: 'A' | 'AA' | 'AAA';
  passed: boolean;
  issues: Array<{
    rule: string;
    severity: 'critical' | 'serious' | 'moderate' | 'minor';
    description: string;
    help_url: string;
  }>;
}

export abstract class TestAgentBase {
  protected userId: string;
  protected testSession: string;
  protected startTime: Date;
  protected errors: TestError[] = [];
  protected performanceMetrics: PerformanceMetrics = {
    page_load_time: 0,
    api_response_time: 0,
    memory_usage: 0,
    cpu_usage: 0,
    network_requests: 0,
    largest_contentful_paint: 0,
    first_input_delay: 0,
    cumulative_layout_shift: 0
  };

  constructor(userId: string) {
    this.userId = userId;
    this.testSession = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.startTime = new Date();
  }

  /**
   * Create a test user with realistic data based on persona
   */
  protected async createTestUser(persona: string): Promise<TestUser> {
    const personas = {
      'alex_neurodiverse': {
        name: 'Alex Chen',
        bio: 'Software developer with ADHD seeking better work-life balance',
        preferences: {
          coaching_style: 'encouraging',
          theme: 'dark',
          notifications: 'minimal'
        },
        accessibility_needs: ['clear_navigation', 'consistent_patterns', 'focus_indicators'],
        cognitive_style: 'systematic' as const,
        technology_comfort: 'high' as const
      },
      'sam_entrepreneur': {
        name: 'Sam Rodriguez',
        bio: 'Fast-paced entrepreneur optimizing for maximum productivity',
        preferences: {
          coaching_style: 'direct',
          theme: 'light',
          notifications: 'all'
        },
        accessibility_needs: ['quick_actions', 'minimal_cognitive_load'],
        cognitive_style: 'exploratory' as const,
        technology_comfort: 'high' as const
      },
      'morgan_methodical': {
        name: 'Morgan Taylor',
        bio: 'Project manager who values structure and detailed planning',
        preferences: {
          coaching_style: 'analytical',
          theme: 'auto',
          notifications: 'important'
        },
        accessibility_needs: ['detailed_feedback', 'progress_tracking'],
        cognitive_style: 'focused' as const,
        technology_comfort: 'medium' as const
      }
    };

    const profile = personas[persona as keyof typeof personas] || personas.alex_neurodiverse;
    
    // Generate test email
    const testEmail = `test_${persona}_${this.testSession}@rashenal-testing.local`;

    return {
      id: this.userId,
      email: testEmail,
      profile,
      test_data: {
        habits: await this.generateTestHabits(profile.cognitive_style),
        tasks: await this.generateTestTasks(profile.cognitive_style),
        goals: await this.generateTestGoals(profile.cognitive_style),
        job_profiles: await this.generateTestJobProfiles(profile.technology_comfort)
      }
    };
  }

  /**
   * Generate realistic test habits based on cognitive style
   */
  private async generateTestHabits(cognitive_style: string): Promise<any[]> {
    const baseHabits = [
      { name: 'Morning meditation', category: 'mindfulness', target_frequency: 'daily', target_value: 10 },
      { name: 'Exercise', category: 'fitness', target_frequency: 'daily', target_value: 30 },
      { name: 'Read technical articles', category: 'learning', target_frequency: 'daily', target_value: 2 },
      { name: 'Practice coding', category: 'productivity', target_frequency: 'daily', target_value: 60 },
      { name: 'Drink water', category: 'health', target_frequency: 'daily', target_value: 8 }
    ];

    // Adjust based on cognitive style
    if (cognitive_style === 'systematic') {
      return baseHabits.map(h => ({ ...h, target_frequency: 'daily' }));
    } else if (cognitive_style === 'flexible') {
      return baseHabits.map(h => ({ ...h, target_frequency: Math.random() > 0.5 ? 'daily' : 'weekly' }));
    }

    return baseHabits;
  }

  /**
   * Generate realistic test tasks
   */
  private async generateTestTasks(cognitive_style: string): Promise<any[]> {
    const baseTasks = [
      { title: 'Review quarterly metrics', priority: 'high', energy_level: 'M', status: 'todo' },
      { title: 'Update project documentation', priority: 'medium', energy_level: 'L', status: 'todo' },
      { title: 'Schedule team meeting', priority: 'medium', energy_level: 'S', status: 'in_progress' },
      { title: 'Research new tools', priority: 'low', energy_level: 'XL', status: 'backlog' },
      { title: 'Code review for PR #123', priority: 'urgent', energy_level: 'M', status: 'blocked' }
    ];

    return baseTasks.map(task => ({
      ...task,
      description: `Generated test task for ${cognitive_style} testing`,
      created_at: new Date().toISOString(),
      user_id: this.userId
    }));
  }

  /**
   * Generate realistic test goals
   */
  private async generateTestGoals(cognitive_style: string): Promise<any[]> {
    return [
      { title: 'Learn TypeScript', progress: 45, category: 'learning', target_date: '2025-12-31' },
      { title: 'Run 5K under 25 minutes', progress: 60, category: 'fitness', target_date: '2025-10-15' },
      { title: 'Build personal project', progress: 20, category: 'productivity', target_date: '2025-11-30' }
    ];
  }

  /**
   * Generate realistic job profiles
   */
  private async generateTestJobProfiles(tech_comfort: string): Promise<any[]> {
    return [
      {
        title: 'Senior Frontend Developer',
        skills: ['React', 'TypeScript', 'CSS', 'JavaScript'],
        experience_level: 'senior',
        preferred_salary: 85000,
        location_preference: 'remote'
      }
    ];
  }

  /**
   * Record an error during testing
   */
  protected recordError(error: Omit<TestError, 'timestamp'>): void {
    this.errors.push({
      ...error,
      timestamp: new Date()
    } as TestError);
  }

  /**
   * Measure performance of an operation
   */
  protected async measurePerformance<T>(
    operation: () => Promise<T>,
    metric: keyof PerformanceMetrics
  ): Promise<T> {
    const start = performance.now();
    try {
      const result = await operation();
      const duration = performance.now() - start;
      this.performanceMetrics[metric] = duration;
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.performanceMetrics[metric] = duration;
      this.recordError({
        type: 'performance',
        severity: 'high',
        component: 'performance_measurement',
        message: `Operation failed during performance measurement: ${error}`,
        reproduction_steps: ['Execute measured operation'],
        expected: 'Operation should complete successfully',
        actual: `Operation failed with error: ${error}`
      });
      throw error;
    }
  }

  /**
   * Check accessibility compliance
   */
  protected async checkAccessibility(component: string, element?: HTMLElement): Promise<AccessibilityCheck> {
    // This would integrate with axe-core or similar accessibility testing library
    const mockCheck: AccessibilityCheck = {
      component,
      wcag_level: 'AA',
      passed: true,
      issues: []
    };

    // Simulate accessibility checks
    if (Math.random() < 0.1) { // 10% chance of finding issues for testing
      mockCheck.passed = false;
      mockCheck.issues.push({
        rule: 'color-contrast',
        severity: 'serious',
        description: 'Insufficient color contrast ratio',
        help_url: 'https://dequeuniversity.com/rules/axe/4.4/color-contrast'
      });
    }

    return mockCheck;
  }

  /**
   * Test AI interaction quality
   */
  protected async testAIInteraction(
    prompt: string,
    expectedElements: string[],
    forbiddenElements: string[] = []
  ): Promise<boolean> {
    try {
      // This would call the actual AI coaching endpoint
      const response = await this.callAICoaching(prompt);
      
      let qualityScore = 0;
      const issues: string[] = [];

      // Check for expected elements
      for (const element of expectedElements) {
        if (response.toLowerCase().includes(element.toLowerCase())) {
          qualityScore += 1;
        } else {
          issues.push(`Missing expected element: ${element}`);
        }
      }

      // Check for forbidden elements
      for (const element of forbiddenElements) {
        if (response.toLowerCase().includes(element.toLowerCase())) {
          qualityScore -= 2;
          issues.push(`Contains forbidden element: ${element}`);
        }
      }

      const passed = qualityScore >= expectedElements.length * 0.8; // 80% threshold

      if (!passed) {
        this.recordError({
          type: 'ai_quality',
          severity: 'medium',
          component: 'ai_coaching',
          message: `AI response quality below threshold: ${issues.join(', ')}`,
          reproduction_steps: [`Send prompt: "${prompt}"`],
          expected: `Response should contain: ${expectedElements.join(', ')}`,
          actual: `Response: "${response.substring(0, 100)}..."`
        });
      }

      return passed;
    } catch (error) {
      this.recordError({
        type: 'ai_quality',
        severity: 'critical',
        component: 'ai_coaching',
        message: `AI interaction failed: ${error}`,
        reproduction_steps: [`Send prompt: "${prompt}"`],
        expected: 'AI should respond appropriately',
        actual: `Error: ${error}`
      });
      return false;
    }
  }

  /**
   * Call AI coaching endpoint (mock implementation)
   */
  private async callAICoaching(prompt: string): Promise<string> {
    // Mock AI response for testing
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000)); // 1-3 second delay
    
    // Generate contextually appropriate response
    if (prompt.toLowerCase().includes('motivation')) {
      return 'I understand you\'re looking for motivation. Based on your recent progress, you\'ve been doing great with your habits. Here\'s what I suggest: focus on small wins today, and remember that consistency beats perfection. What specific area would you like to work on?';
    }
    
    if (prompt.toLowerCase().includes('tasks')) {
      return 'Looking at your task list, I notice you have several high-priority items. Let\'s prioritize the urgent ones first and break down the larger tasks into smaller, manageable steps. Which task feels most overwhelming right now?';
    }

    return 'Thank you for sharing that with me. I\'m here to help you on your personal growth journey. Based on what you\'ve told me, I have some suggestions that might be helpful. What would you like to focus on today?';
  }

  /**
   * Generate comprehensive test report
   */
  protected generateReport(): TestResult {
    const executionTime = Date.now() - this.startTime.getTime();
    const accessibilityScore = this.calculateAccessibilityScore();

    return {
      test_id: this.testSession,
      agent_type: this.constructor.name,
      user_persona: 'test_user',
      test_category: 'comprehensive',
      success: this.errors.filter(e => e.severity === 'critical').length === 0,
      execution_time: executionTime,
      errors: this.errors,
      performance_metrics: this.performanceMetrics,
      accessibility_score: accessibilityScore,
      recommendations: this.generateRecommendations(),
      timestamp: new Date()
    };
  }

  /**
   * Calculate overall accessibility score
   */
  private calculateAccessibilityScore(): number {
    const accessibilityErrors = this.errors.filter(e => e.type === 'accessibility');
    const criticalCount = accessibilityErrors.filter(e => e.severity === 'critical').length;
    const highCount = accessibilityErrors.filter(e => e.severity === 'high').length;
    
    let score = 100;
    score -= criticalCount * 25; // Critical issues: -25 points each
    score -= highCount * 10;     // High issues: -10 points each
    
    return Math.max(0, score);
  }

  /**
   * Generate actionable recommendations based on test results
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    const criticalErrors = this.errors.filter(e => e.severity === 'critical');
    const performanceIssues = this.errors.filter(e => e.type === 'performance');
    const accessibilityIssues = this.errors.filter(e => e.type === 'accessibility');

    if (criticalErrors.length > 0) {
      recommendations.push(`Address ${criticalErrors.length} critical errors immediately`);
    }

    if (this.performanceMetrics.page_load_time > 3000) {
      recommendations.push('Optimize page load time - currently exceeds 3 second threshold');
    }

    if (this.performanceMetrics.api_response_time > 5000) {
      recommendations.push('Optimize API response times - currently exceeds 5 second threshold');
    }

    if (accessibilityIssues.length > 0) {
      recommendations.push(`Fix ${accessibilityIssues.length} accessibility issues for better inclusion`);
    }

    if (recommendations.length === 0) {
      recommendations.push('All tests passed! Consider adding more comprehensive test scenarios.');
    }

    return recommendations;
  }

  /**
   * Abstract method that each test agent must implement
   */
  abstract executeTestSuite(): Promise<TestResult>;

  /**
   * Run cleanup after testing
   */
  protected async cleanup(): Promise<void> {
    // Clean up test data
    try {
      // Remove test habits, tasks, goals, etc.
      await Promise.all([
        supabase.from('habit_completions').delete().eq('user_id', this.userId),
        supabase.from('habits').delete().eq('user_id', this.userId),
        supabase.from('tasks').delete().eq('user_id', this.userId),
        supabase.from('goals').delete().eq('user_id', this.userId),
        supabase.from('job_profiles').delete().eq('user_id', this.userId)
      ]);
    } catch (error) {
      console.warn('Test cleanup failed:', error);
    }
  }
}

export default TestAgentBase;
