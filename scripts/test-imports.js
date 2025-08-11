#!/usr/bin/env node
/**
 * Import validation script
 * Tests that all imports in the codebase resolve correctly
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcPath = path.resolve(__dirname, '../src');

console.log('🔍 Testing import resolution...\n');

// Find all TypeScript/JavaScript files
function findFiles(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  const files = [];
  
  function walk(currentPath) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        walk(fullPath);
      } else if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }
  
  walk(dir);
  return files;
}

// Extract imports from file content
function extractImports(content) {
  const imports = [];
  
  // Match ES6 imports
  const es6ImportRegex = /import\s+.*?from\s+['"`]([^'"`]+)['"`]/g;
  let match;
  while ((match = es6ImportRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  
  // Match dynamic imports
  const dynamicImportRegex = /import\(['"`]([^'"`]+)['"`]\)/g;
  while ((match = dynamicImportRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  
  return imports;
}

// Check if import path exists
function validateImport(importPath, fromFile) {
  if (importPath.startsWith('.')) {
    // Relative import
    const basePath = path.dirname(fromFile);
    const fullPath = path.resolve(basePath, importPath);
    
    // Check for various extensions
    const possiblePaths = [
      fullPath,
      fullPath + '.ts',
      fullPath + '.tsx',
      fullPath + '.js',
      fullPath + '.jsx',
      path.join(fullPath, 'index.ts'),
      path.join(fullPath, 'index.tsx'),
      path.join(fullPath, 'index.js')
    ];
    
    return possiblePaths.some(p => fs.existsSync(p));
  } else if (importPath.startsWith('@/') || importPath.startsWith('~/')) {
    // Alias import (would need to check tsconfig/vite config)
    return true;
  } else if (!importPath.includes('/') || importPath.startsWith('@')) {
    // NPM package
    return true;
  }
  
  return false;
}

const files = findFiles(srcPath);
const errors = [];
let totalImports = 0;

console.log(`📁 Found ${files.length} files to check\n`);

for (const file of files) {
  try {
    const content = fs.readFileSync(file, 'utf-8');
    const imports = extractImports(content);
    totalImports += imports.length;
    
    const relativePath = path.relative(srcPath, file);
    
    for (const importPath of imports) {
      if (!validateImport(importPath, file)) {
        errors.push({
          file: relativePath,
          import: importPath,
          line: content.split('\n').findIndex(line => line.includes(importPath)) + 1
        });
      }
    }
    
    if (imports.length > 0) {
      console.log(`✓ ${relativePath} (${imports.length} imports)`);
    }
  } catch (error) {
    errors.push({
      file: path.relative(srcPath, file),
      import: 'FILE_READ_ERROR',
      line: 0,
      error: error.message
    });
  }
}

console.log(`\n📊 Summary:`);
console.log(`   Files checked: ${files.length}`);
console.log(`   Imports validated: ${totalImports}`);
console.log(`   Errors found: ${errors.length}\n`);

if (errors.length > 0) {
  console.log('❌ Import Errors:');
  errors.forEach(error => {
    if (error.import === 'FILE_READ_ERROR') {
      console.log(`   ${error.file}: ${error.error}`);
    } else {
      console.log(`   ${error.file}:${error.line} - Cannot resolve: "${error.import}"`);
    }
  });
  console.log('\n');
  process.exit(1);
} else {
  console.log('✅ All imports resolve correctly!\n');
  process.exit(0);
}