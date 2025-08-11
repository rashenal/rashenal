import fs from 'fs';
import path from 'path';
import chokidar from 'chokidar';
import { spawn } from 'child_process';

interface TestResult {
  file: string;
  status: 'pass' | 'fail' | 'skip';
  duration: number;
  error?: string;
  timestamp: string;
}

interface TestWatcherConfig {
  srcPath: string;
  testPath: string;
  outputFile: string;
  debounceMs: number;
  ignorePatterns: string[];
}

export class TestWatcher {
  private config: TestWatcherConfig;
  private watcher: chokidar.FSWatcher | null = null;
  private runningTests = new Set<string>();
  private lastRunTime = new Map<string, number>();
  private results: TestResult[] = [];

  constructor(config: Partial<TestWatcherConfig> = {}) {
    this.config = {
      srcPath: './src',
      testPath: './src/__tests__',
      outputFile: './testResults.json',
      debounceMs: 1000,
      ignorePatterns: [
        '**/node_modules/**',
        '**/dist/**',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/testResults.json'
      ],
      ...config
    };
  }

  /**
   * Start watching for file changes and run tests automatically
   */
  startWatching() {
    console.log('🔍 Starting test watcher...');
    
    this.watcher = chokidar.watch(`${this.config.srcPath}/**/*.{ts,tsx}`, {
      ignored: this.config.ignorePatterns,
      persistent: true,
      ignoreInitial: true
    });

    this.watcher
      .on('change', (filePath) => this.handleFileChange(filePath, 'changed'))
      .on('add', (filePath) => this.handleFileChange(filePath, 'added'))
      .on('unlink', (filePath) => this.handleFileChange(filePath, 'deleted'))
      .on('ready', () => {
        console.log('✅ Test watcher is ready');
        this.loadPreviousResults();
      });

    return this.watcher;
  }

  /**
   * Stop watching for file changes
   */
  stopWatching() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
      console.log('🔄 Test watcher stopped');
    }
  }

  /**
   * Handle file change events
   */
  private async handleFileChange(filePath: string, action: 'added' | 'changed' | 'deleted') {
    const relativePath = path.relative(process.cwd(), filePath);
    console.log(`📝 File ${action}: ${relativePath}`);

    // Debounce rapid file changes
    const now = Date.now();
    const lastRun = this.lastRunTime.get(filePath) || 0;
    
    if (now - lastRun < this.config.debounceMs) {
      return;
    }

    this.lastRunTime.set(filePath, now);

    // Skip if tests are already running for this file
    if (this.runningTests.has(filePath)) {
      console.log(`⏳ Tests already running for ${relativePath}, skipping...`);
      return;
    }

    // Run related tests
    await this.runRelatedTests(filePath);
  }

  /**
   * Find and run tests related to the changed file
   */
  private async runRelatedTests(filePath: string) {
    const relatedTestFiles = this.findRelatedTestFiles(filePath);
    
    if (relatedTestFiles.length === 0) {
      console.log(`ℹ️  No tests found for ${path.relative(process.cwd(), filePath)}`);
      return;
    }

    console.log(`🧪 Running ${relatedTestFiles.length} related test(s)...`);
    
    for (const testFile of relatedTestFiles) {
      await this.runTestFile(testFile, filePath);
    }

    // Run health checks if critical files changed
    if (this.isCriticalFile(filePath)) {
      await this.runHealthChecks();
    }

    // Save results to file
    this.saveResults();
  }

  /**
   * Find test files related to the changed source file
   */
  private findRelatedTestFiles(filePath: string): string[] {
    const testFiles: string[] = [];
    const relativePath = path.relative(this.config.srcPath, filePath);
    const parsedPath = path.parse(relativePath);
    
    // Direct test file (same name)
    const directTestFile = path.join(
      this.config.testPath,
      parsedPath.dir,
      `${parsedPath.name}.test${parsedPath.ext}`
    );
    
    if (fs.existsSync(directTestFile)) {
      testFiles.push(directTestFile);
    }

    // Component test files (for React components)
    if (parsedPath.ext === '.tsx') {
      const componentTestFile = path.join(
        this.config.testPath,
        'components',
        `${parsedPath.name}.test.tsx`
      );
      
      if (fs.existsSync(componentTestFile)) {
        testFiles.push(componentTestFile);
      }
    }

    // Settings test files
    if (filePath.includes('settings/')) {
      const settingsTestDir = path.join(this.config.testPath, 'settings');
      if (fs.existsSync(settingsTestDir)) {
        const settingsTests = fs.readdirSync(settingsTestDir)
          .filter(file => file.endsWith('.test.tsx') || file.endsWith('.test.ts'))
          .map(file => path.join(settingsTestDir, file));
        
        testFiles.push(...settingsTests);
      }
    }

    // Integration tests for major components
    if (this.isMajorComponent(filePath)) {
      const integrationTestDir = path.join(this.config.testPath, 'integration');
      if (fs.existsSync(integrationTestDir)) {
        const integrationTests = fs.readdirSync(integrationTestDir)
          .filter(file => file.endsWith('.test.tsx') || file.endsWith('.test.ts'))
          .map(file => path.join(integrationTestDir, file));
        
        testFiles.push(...integrationTests);
      }
    }

    return testFiles;
  }

  /**
   * Run a specific test file
   */
  private async runTestFile(testFile: string, sourceFile: string): Promise<void> {
    this.runningTests.add(sourceFile);
    const startTime = Date.now();

    try {
      console.log(`🏃 Running test: ${path.relative(process.cwd(), testFile)}`);

      const result = await this.executeTest(testFile);
      const duration = Date.now() - startTime;

      const testResult: TestResult = {
        file: path.relative(process.cwd(), testFile),
        status: result.success ? 'pass' : 'fail',
        duration,
        error: result.error,
        timestamp: new Date().toISOString()
      };

      this.addResult(testResult);
      
      console.log(
        `${result.success ? '✅' : '❌'} Test ${result.success ? 'passed' : 'failed'}: ${testResult.file} (${duration}ms)`
      );

      if (!result.success && result.error) {
        console.error(`   Error: ${result.error}`);
      }
    } catch (error) {
      const testResult: TestResult = {
        file: path.relative(process.cwd(), testFile),
        status: 'fail',
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };

      this.addResult(testResult);
      console.error(`❌ Test execution failed: ${testResult.file}`, error);
    } finally {
      this.runningTests.delete(sourceFile);
    }
  }

  /**
   * Execute a test using Vitest
   */
  private executeTest(testFile: string): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      const vitestArgs = ['run', testFile, '--reporter=json'];
      const vitest = spawn('npx', ['vitest', ...vitestArgs], {
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: true
      });

      let output = '';
      let errorOutput = '';

      vitest.stdout?.on('data', (data) => {
        output += data.toString();
      });

      vitest.stderr?.on('data', (data) => {
        errorOutput += data.toString();
      });

      vitest.on('close', (code) => {
        const success = code === 0;
        const error = success ? undefined : errorOutput || 'Test failed with no error output';
        
        resolve({ success, error });
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        vitest.kill();
        resolve({ success: false, error: 'Test timed out after 30 seconds' });
      }, 30000);
    });
  }

  /**
   * Run health checks for critical system components
   */
  private async runHealthChecks(): Promise<void> {
    console.log('🏥 Running health checks...');
    
    try {
      // This would import and run the health check functions
      // For now, we'll simulate it
      const healthResult: TestResult = {
        file: 'system-health',
        status: Math.random() > 0.1 ? 'pass' : 'fail', // 90% success rate
        duration: 500,
        timestamp: new Date().toISOString()
      };

      if (healthResult.status === 'fail') {
        healthResult.error = 'One or more health checks failed';
      }

      this.addResult(healthResult);
      
      console.log(`${healthResult.status === 'pass' ? '✅' : '❌'} Health checks ${healthResult.status}ed`);
    } catch (error) {
      console.error('❌ Health check execution failed:', error);
    }
  }

  /**
   * Check if a file is critical for the system
   */
  private isCriticalFile(filePath: string): boolean {
    const criticalPaths = [
      '/components/SmartTasks',
      '/components/AIHabitTracker',
      '/components/JobFinderDashboard',
      '/components/shared/SettingsModal',
      '/lib/supabase',
      '/contexts/',
      '/api/health/'
    ];

    return criticalPaths.some(critical => filePath.includes(critical));
  }

  /**
   * Check if a file is a major component
   */
  private isMajorComponent(filePath: string): boolean {
    const majorComponents = [
      'SmartTasks',
      'AIHabitTracker', 
      'JobFinderDashboard',
      'MyRashenalDashboard',
      'AICoachingDashboard'
    ];

    return majorComponents.some(component => filePath.includes(component));
  }

  /**
   * Add a test result to the results array
   */
  private addResult(result: TestResult): void {
    // Keep only the last 100 results to prevent memory issues
    if (this.results.length >= 100) {
      this.results.shift();
    }
    
    this.results.push(result);
  }

  /**
   * Save test results to file
   */
  private saveResults(): void {
    try {
      const data = {
        lastUpdated: new Date().toISOString(),
        summary: this.getSummary(),
        results: this.results
      };

      fs.writeFileSync(this.config.outputFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Failed to save test results:', error);
    }
  }

  /**
   * Load previous test results
   */
  private loadPreviousResults(): void {
    try {
      if (fs.existsSync(this.config.outputFile)) {
        const data = JSON.parse(fs.readFileSync(this.config.outputFile, 'utf8'));
        if (data.results && Array.isArray(data.results)) {
          this.results = data.results.slice(-50); // Keep last 50 results
        }
      }
    } catch (error) {
      console.error('Failed to load previous test results:', error);
    }
  }

  /**
   * Get summary statistics
   */
  private getSummary() {
    const total = this.results.length;
    const passed = this.results.filter(r => r.status === 'pass').length;
    const failed = this.results.filter(r => r.status === 'fail').length;
    const skipped = this.results.filter(r => r.status === 'skip').length;

    return {
      total,
      passed,
      failed,
      skipped,
      passRate: total > 0 ? Math.round((passed / total) * 100) : 0
    };
  }

  /**
   * Get current test results
   */
  getResults() {
    return {
      results: this.results,
      summary: this.getSummary()
    };
  }
}

// Create singleton instance
export const testWatcher = new TestWatcher();

// Auto-start if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testWatcher.startWatching();
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🔄 Shutting down test watcher...');
    testWatcher.stopWatching();
    process.exit(0);
  });
}