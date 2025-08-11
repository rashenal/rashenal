#!/usr/bin/env node
/**
 * Pre-commit checks script
 * Runs essential checks before committing code
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Running pre-commit checks...\n');

const checks = [
  {
    name: 'TypeScript Compilation',
    command: 'npx tsc --noEmit',
    description: 'Checking TypeScript types'
  },
  {
    name: 'Import Resolution',
    command: 'node scripts/test-imports.js',
    description: 'Validating all imports resolve correctly'
  },
  {
    name: 'Component Tests',
    command: 'npx vitest run --reporter=basic src/components/task-board/__tests__',
    description: 'Running task board component tests'
  },
  {
    name: 'Data Tests',
    command: 'npx vitest run --reporter=basic src/data/__tests__',
    description: 'Running data structure tests'
  }
];

let allPassed = true;

for (const check of checks) {
  console.log(`🏃 ${check.name}`);
  console.log(`   ${check.description}...`);
  
  try {
    execSync(check.command, { 
      cwd: path.resolve(__dirname, '..'),
      stdio: 'pipe' 
    });
    console.log(`   ✅ ${check.name} passed\n`);
  } catch (error) {
    console.log(`   ❌ ${check.name} failed:`);
    console.log(`   ${error.stdout?.toString() || error.message}`);
    console.log('');
    allPassed = false;
  }
}

if (allPassed) {
  console.log('🎉 All pre-commit checks passed!');
  process.exit(0);
} else {
  console.log('💥 Some checks failed. Please fix the issues above.');
  process.exit(1);
}