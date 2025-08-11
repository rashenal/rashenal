#!/usr/bin/env tsx

/**
 * Build Verification Script
 * Runs comprehensive checks to catch errors before they reach users
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import * as path from 'path';

interface CheckResult {
  name: string;
  success: boolean;
  duration: number;
  output?: string;
  error?: string;
}

class BuildVerifier {
  private results: CheckResult[] = [];

  async runCheck(name: string, command: string): Promise<CheckResult> {
    const startTime = Date.now();
    console.log(`🔍 ${name}...`);

    try {
      const output = execSync(command, { 
        encoding: 'utf8',
        cwd: process.cwd(),
        timeout: 120000 // 2 minute timeout
      });
      
      const duration = Date.now() - startTime;
      const result: CheckResult = {
        name,
        success: true,
        duration,
        output: output.toString()
      };
      
      console.log(`✅ ${name} passed (${duration}ms)`);
      this.results.push(result);
      return result;
      
    } catch (error: any) {
      const duration = Date.now() - startTime;
      const result: CheckResult = {
        name,
        success: false,
        duration,
        error: error.message,
        output: error.stdout?.toString()
      };
      
      console.log(`❌ ${name} failed (${duration}ms)`);
      console.log(`Error: ${error.message}`);
      if (error.stdout) {
        console.log(`Output: ${error.stdout}`);
      }
      
      this.results.push(result);
      return result;
    }
  }

  async verifyFiles(): Promise<CheckResult> {
    console.log('🔍 Verifying critical files...');
    const startTime = Date.now();

    const criticalFiles = [
      'src/App.tsx',
      'src/main.tsx', 
      'src/index.html',
      'package.json',
      'tsconfig.json',
      'vite.config.ts'
    ];

    const missingFiles = criticalFiles.filter(file => !existsSync(file));
    
    const duration = Date.now() - startTime;
    
    if (missingFiles.length > 0) {
      const result: CheckResult = {
        name: 'File Verification',
        success: false,
        duration,
        error: `Missing critical files: ${missingFiles.join(', ')}`
      };
      console.log(`❌ File verification failed - missing: ${missingFiles.join(', ')}`);
      this.results.push(result);
      return result;
    }

    const result: CheckResult = {
      name: 'File Verification',
      success: true,
      duration
    };
    console.log(`✅ File verification passed (${duration}ms)`);
    this.results.push(result);
    return result;
  }

  async runAllChecks(): Promise<boolean> {
    console.log('🚀 Starting Build Verification...\n');

    // 1. File verification
    await this.verifyFiles();

    // 2. TypeScript compilation check
    await this.runCheck('TypeScript Check', 'npx tsc --noEmit');

    // 3. ESLint check
    await this.runCheck('ESLint Check', 'npx eslint . --max-warnings 0');

    // 4. Build test
    await this.runCheck('Build Test', 'npm run build');

    // 5. Unit tests (if they exist)
    if (existsSync('src/__tests__')) {
      await this.runCheck('Unit Tests', 'npm run test:unit');
    }

    // 6. AI smoke tests (if configured)
    try {
      await this.runCheck('AI Smoke Tests', 'npm run test:ai:smoke');
    } catch (error) {
      console.log('⚠️  AI tests not available, skipping');
    }

    // 7. Schema validation
    try {
      await this.runCheck('Schema Validation', 'npm run schema:check');
    } catch (error) {
      console.log('⚠️  Schema validation not available, skipping');
    }

    this.printSummary();
    
    const allPassed = this.results.every(r => r.success);
    return allPassed;
  }

  private printSummary(): void {
    console.log('\n📊 Build Verification Summary:');
    console.log('═══════════════════════════════');

    const passed = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;
    const totalTime = this.results.reduce((sum, r) => sum + r.duration, 0);

    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏱️  Total time: ${totalTime}ms`);
    console.log('');

    if (failed > 0) {
      console.log('❌ Failed checks:');
      this.results.filter(r => !r.success).forEach(result => {
        console.log(`  • ${result.name}: ${result.error}`);
      });
    } else {
      console.log('🎉 All checks passed! Build is ready.');
    }
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const verifier = new BuildVerifier();
  verifier.runAllChecks().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('❌ Build verification failed:', error);
    process.exit(1);
  });
}

export { BuildVerifier };