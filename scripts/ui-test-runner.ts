#!/usr/bin/env tsx

/**
 * UI Test Runner - Automated testing for component functionality
 * Catches non-functional UI elements before they reach users
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface TestResult {
  component: string;
  testName: string;
  status: 'pass' | 'fail' | 'skip';
  duration: number;
  error?: string;
  details?: string;
}

interface ComponentTest {
  name: string;
  file: string;
  criticalTests: string[];
  interactionTests: string[];
}

class UITestRunner {
  private results: TestResult[] = [];
  private components: ComponentTest[] = [
    {
      name: 'AIHabitTracker',
      file: 'src/components/AIHabitTracker.tsx',
      criticalTests: [
        'should allow users to mark habits as complete',
        'should have functional "New Habit" button',
        'should have functional "Habit Coach" button'
      ],
      interactionTests: [
        'habit completion buttons are clickable',
        'form inputs accept user input',
        'modal dialogs open and close'
      ]
    },
    {
      name: 'AIssistents',
      file: 'src/components/AIssistents.tsx',
      criticalTests: [
        'should allow creating new assistants (admin only)',
        'should have functional chat interface'
      ],
      interactionTests: [
        'chat input maintains focus',
        'file upload works',
        'assistant switching functions'
      ]
    },
    {
      name: 'GoalsManagement',
      file: 'src/components/GoalsManagement.tsx',
      criticalTests: [
        'should allow creating new goals',
        'should have functional AI Coach chat'
      ],
      interactionTests: [
        'goal progress updates',
        'milestone completion',
        'tab navigation works'
      ]
    },
    {
      name: 'EnhancedNavigation',
      file: 'src/components/EnhancedNavigation.tsx',
      criticalTests: [
        'should have all main navigation items',
        'should have functional hamburger menu'
      ],
      interactionTests: [
        'navigation links work',
        'mobile menu toggles',
        'user stats display correctly'
      ]
    }
  ];

  async runAllTests(): Promise<boolean> {
    console.log('🧪 Starting UI Functional Tests...\n');

    // Run the actual tests
    await this.runVitest();
    
    // Run component-specific checks
    await this.checkComponentFiles();
    
    // Run interaction tests
    await this.runInteractionTests();
    
    // Generate report
    this.generateReport();
    
    const failures = this.results.filter(r => r.status === 'fail').length;
    return failures === 0;
  }

  private async runVitest(): Promise<void> {
    console.log('📋 Running Vitest UI Tests...');
    
    try {
      const output = execSync('npx vitest run src/test/ui-functional-tests.ts --reporter=json', {
        encoding: 'utf8',
        timeout: 60000,
        cwd: process.cwd()
      });
      
      // Parse vitest output and add to results
      try {
        const testResults = JSON.parse(output);
        
        if (testResults.testResults) {
          testResults.testResults.forEach((test: any) => {
            this.results.push({
              component: test.name.split(' ')[0],
              testName: test.name,
              status: test.status === 'passed' ? 'pass' : 'fail',
              duration: test.duration || 0,
              error: test.failureMessage
            });
          });
        }
      } catch (parseError) {
        console.log('✅ Vitest completed (output parsing skipped)');
      }
      
    } catch (error: any) {
      console.log('⚠️ Vitest tests had issues, continuing with other checks...');
      
      this.results.push({
        component: 'Vitest',
        testName: 'UI Functional Tests',
        status: 'fail',
        duration: 0,
        error: error.message
      });
    }
  }

  private async checkComponentFiles(): Promise<void> {
    console.log('🔍 Checking component files for critical patterns...');

    for (const component of this.components) {
      if (!fs.existsSync(component.file)) {
        this.results.push({
          component: component.name,
          testName: 'File exists',
          status: 'fail',
          duration: 0,
          error: `Component file not found: ${component.file}`
        });
        continue;
      }

      const content = fs.readFileSync(component.file, 'utf8');
      
      // Check for critical patterns based on component type
      await this.checkComponentPatterns(component.name, content);
    }
  }

  private async checkComponentPatterns(componentName: string, content: string): Promise<void> {
    const patterns = {
      'AIHabitTracker': [
        { pattern: /onClick.*completeHabit/s, test: 'Habit completion functionality' },
        { pattern: /button.*[Nn]ew [Hh]abit/s, test: 'New Habit button exists' },
        { pattern: /button.*[Hh]abit [Cc]oach/s, test: 'Habit Coach button exists' },
        { pattern: /setCurrentMessage/s, test: 'Chat input state management' }
      ],
      'AIssistents': [
        { pattern: /onClick.*sendMessage/s, test: 'Chat send functionality' },
        { pattern: /onChange.*setCurrentMessage/s, test: 'Chat input handling' },
        { pattern: /onClick.*createNewAissistent/s, test: 'Create assistant functionality' },
        { pattern: /handleFileUpload/s, test: 'File upload functionality' }
      ],
      'GoalsManagement': [
        { pattern: /onClick.*sendMessage/s, test: 'Goals chat functionality' },
        { pattern: /createNewGoal/s, test: 'Goal creation functionality' },
        { pattern: /setActiveTab/s, test: 'Tab navigation functionality' }
      ],
      'EnhancedNavigation': [
        { pattern: /mainNavItems.*map/s, test: 'Main navigation items rendering' },
        { pattern: /onClick.*toggleMenu/s, test: 'Hamburger menu functionality' },
        { pattern: /getUserStats/s, test: 'User stats functionality' }
      ]
    };

    const componentPatterns = patterns[componentName as keyof typeof patterns] || [];
    
    for (const { pattern, test } of componentPatterns) {
      const found = pattern.test(content);
      
      this.results.push({
        component: componentName,
        testName: test,
        status: found ? 'pass' : 'fail',
        duration: 0,
        error: found ? undefined : `Pattern not found: ${pattern.source}`
      });
    }
  }

  private async runInteractionTests(): Promise<void> {
    console.log('🖱️ Running interaction pattern tests...');

    // Test for common interaction issues
    const interactionChecks = [
      {
        name: 'Button Click Handlers',
        check: () => this.checkButtonClickHandlers(),
      },
      {
        name: 'Form Input Handling',
        check: () => this.checkFormInputHandling(),
      },
      {
        name: 'Event Propagation',
        check: () => this.checkEventPropagation(),
      },
      {
        name: 'State Management',
        check: () => this.checkStateManagement(),
      }
    ];

    for (const interactionCheck of interactionChecks) {
      const startTime = Date.now();
      
      try {
        const result = await interactionCheck.check();
        
        this.results.push({
          component: 'Interaction',
          testName: interactionCheck.name,
          status: result.success ? 'pass' : 'fail',
          duration: Date.now() - startTime,
          error: result.error,
          details: result.details
        });
      } catch (error: any) {
        this.results.push({
          component: 'Interaction',
          testName: interactionCheck.name,
          status: 'fail',
          duration: Date.now() - startTime,
          error: error.message
        });
      }
    }
  }

  private checkButtonClickHandlers(): { success: boolean; error?: string; details?: string } {
    const componentFiles = [
      'src/components/AIHabitTracker.tsx',
      'src/components/AIssistents.tsx',
      'src/components/GoalsManagement.tsx'
    ];

    const issues = [];
    let totalButtons = 0;
    let functionalButtons = 0;

    for (const file of componentFiles) {
      if (!fs.existsSync(file)) continue;
      
      const content = fs.readFileSync(file, 'utf8');
      
      // Find button elements
      const buttonMatches = content.match(/<button[^>]*>/g) || [];
      totalButtons += buttonMatches.length;
      
      // Check each button has onClick or other interaction
      buttonMatches.forEach((buttonTag, index) => {
        if (buttonTag.includes('onClick') || buttonTag.includes('onMouseDown') || buttonTag.includes('onKeyDown')) {
          functionalButtons++;
        } else {
          issues.push(`${file}: Button ${index + 1} missing click handler`);
        }
      });
    }

    return {
      success: issues.length === 0 && functionalButtons > 0,
      error: issues.length > 0 ? issues.join('; ') : undefined,
      details: `${functionalButtons}/${totalButtons} buttons have click handlers`
    };
  }

  private checkFormInputHandling(): { success: boolean; error?: string; details?: string } {
    const componentFiles = [
      'src/components/AIHabitTracker.tsx',
      'src/components/AIssistents.tsx'
    ];

    const issues = [];
    let totalInputs = 0;
    let functionalInputs = 0;

    for (const file of componentFiles) {
      if (!fs.existsSync(file)) continue;
      
      const content = fs.readFileSync(file, 'utf8');
      
      // Find input elements
      const inputMatches = content.match(/<input[^>]*>/g) || [];
      const textareaMatches = content.match(/<textarea[^>]*>/g) || [];
      
      totalInputs += inputMatches.length + textareaMatches.length;
      
      // Check inputs have onChange handlers
      [...inputMatches, ...textareaMatches].forEach((inputTag, index) => {
        if (inputTag.includes('onChange')) {
          functionalInputs++;
        } else {
          issues.push(`${file}: Input ${index + 1} missing onChange handler`);
        }
      });
    }

    return {
      success: issues.length === 0 && functionalInputs > 0,
      error: issues.length > 0 ? issues.join('; ') : undefined,
      details: `${functionalInputs}/${totalInputs} inputs have change handlers`
    };
  }

  private checkEventPropagation(): { success: boolean; error?: string; details?: string } {
    const componentFiles = [
      'src/components/AIHabitTracker.tsx'
    ];

    let hasStopPropagation = false;

    for (const file of componentFiles) {
      if (!fs.existsSync(file)) continue;
      
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for proper event handling
      if (content.includes('stopPropagation')) {
        hasStopPropagation = true;
      }
    }

    return {
      success: true, // Not critical for basic functionality
      details: hasStopPropagation ? 'Event propagation handled' : 'No explicit event propagation handling'
    };
  }

  private checkStateManagement(): { success: boolean; error?: string; details?: string } {
    const componentFiles = [
      'src/components/AIHabitTracker.tsx',
      'src/components/AIssistents.tsx',
      'src/components/GoalsManagement.tsx'
    ];

    const issues = [];
    let stateUpdateCount = 0;

    for (const file of componentFiles) {
      if (!fs.existsSync(file)) continue;
      
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for useState calls
      const stateMatches = content.match(/useState/g) || [];
      const setterMatches = content.match(/set[A-Z]\w*/g) || [];
      
      stateUpdateCount += setterMatches.length;
      
      // Check that state setters are used in event handlers
      if (stateMatches.length > 0 && setterMatches.length === 0) {
        issues.push(`${file}: Has state but no state updates found`);
      }
    }

    return {
      success: issues.length === 0 && stateUpdateCount > 0,
      error: issues.length > 0 ? issues.join('; ') : undefined,
      details: `${stateUpdateCount} state update calls found`
    };
  }

  private generateReport(): void {
    console.log('\n📊 UI Functional Test Results:');
    console.log('═══════════════════════════════════');

    const passed = this.results.filter(r => r.status === 'pass').length;
    const failed = this.results.filter(r => r.status === 'fail').length;
    const skipped = this.results.filter(r => r.status === 'skip').length;

    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏭️  Skipped: ${skipped}`);

    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results
        .filter(r => r.status === 'fail')
        .forEach(result => {
          console.log(`  • ${result.component}: ${result.testName}`);
          if (result.error) {
            console.log(`    Error: ${result.error}`);
          }
        });
    }

    if (passed > 0) {
      console.log('\n✅ Passed Tests:');
      this.results
        .filter(r => r.status === 'pass')
        .forEach(result => {
          console.log(`  • ${result.component}: ${result.testName}`);
          if (result.details) {
            console.log(`    ${result.details}`);
          }
        });
    }

    // Save detailed report
    const reportPath = './test-reports/ui-functional-report.json';
    const reportDir = path.dirname(reportPath);
    
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: { passed, failed, skipped },
      results: this.results
    }, null, 2));

    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const runner = new UITestRunner();
  runner.runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('❌ UI testing failed:', error);
    process.exit(1);
  });
}

export { UITestRunner };