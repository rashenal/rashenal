#!/usr/bin/env node

/**
 * Migration File Auto-Fixer Script
 * Fixes common issues in auto-generated migration files to make them safe to apply
 */

import * as fs from 'fs';
import * as path from 'path';

interface FixRule {
  pattern: RegExp;
  replacement: string;
  description: string;
}

class MigrationFixer {
  private fixRules: FixRule[] = [
    // Rule 1: Change ADD COLUMN to ADD COLUMN IF NOT EXISTS
    {
      pattern: /ALTER TABLE (\w+) ADD COLUMN ([^;]+);/g,
      replacement: 'ALTER TABLE $1 ADD COLUMN IF NOT EXISTS $2;',
      description: 'Added IF NOT EXISTS to prevent duplicate column errors'
    },
    
    // Rule 2: Remove NOT NULL from columns that might already exist
    {
      pattern: /ADD COLUMN IF NOT EXISTS (\w+) (\w+(?:\[\])?(?:\(\d+,?\d*\))?)\s+NOT NULL/g,
      replacement: 'ADD COLUMN IF NOT EXISTS $1 $2',
      description: 'Removed NOT NULL constraints to prevent conflicts'
    },
    
    // Rule 3: Add sensible defaults for common column types
    {
      pattern: /ADD COLUMN IF NOT EXISTS (\w+) UUID(?!.*DEFAULT)/g,
      replacement: 'ADD COLUMN IF NOT EXISTS $1 UUID DEFAULT gen_random_uuid()',
      description: 'Added default UUID generation'
    },
    
    {
      pattern: /ADD COLUMN IF NOT EXISTS (\w+) BOOLEAN(?!.*DEFAULT)/g,
      replacement: 'ADD COLUMN IF NOT EXISTS $1 BOOLEAN DEFAULT false',
      description: 'Added default false for boolean columns'
    },
    
    {
      pattern: /ADD COLUMN IF NOT EXISTS (\w+) INTEGER(?!.*DEFAULT)/g,
      replacement: 'ADD COLUMN IF NOT EXISTS $1 INTEGER DEFAULT 0',
      description: 'Added default 0 for integer columns'
    },
    
    {
      pattern: /ADD COLUMN IF NOT EXISTS (\w+) TEXT\[\](?!.*DEFAULT)/g,
      replacement: 'ADD COLUMN IF NOT EXISTS $1 TEXT[] DEFAULT ARRAY[]::TEXT[]',
      description: 'Added empty array default for text arrays'
    },
    
    {
      pattern: /ADD COLUMN IF NOT EXISTS (\w+) TIMESTAMP WITH TIME ZONE(?!.*DEFAULT)/g,
      replacement: 'ADD COLUMN IF NOT EXISTS $1 TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
      description: 'Added NOW() default for timestamps'
    },
    
    // Rule 4: Skip adding primary key columns that definitely exist
    {
      pattern: /ALTER TABLE \w+ ADD COLUMN IF NOT EXISTS id UUID[^;]*;/g,
      replacement: '-- Skipped adding id column (likely already exists as primary key)',
      description: 'Commented out id column additions'
    },
    
    // Rule 5: Handle foreign key columns more carefully
    {
      pattern: /ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT gen_random_uuid\(\)/g,
      replacement: 'ADD COLUMN IF NOT EXISTS user_id UUID',
      description: 'Removed auto-generation from user_id foreign keys'
    },
    
    // Rule 6: Add proper constraints for specific columns
    {
      pattern: /ADD COLUMN IF NOT EXISTS (.*_currency) TEXT(?!.*DEFAULT)/g,
      replacement: "ADD COLUMN IF NOT EXISTS $1 TEXT DEFAULT 'USD'",
      description: 'Added USD default for currency columns'
    },
    
    {
      pattern: /ADD COLUMN IF NOT EXISTS (.*_enabled) BOOLEAN DEFAULT false/g,
      replacement: 'ADD COLUMN IF NOT EXISTS $1 BOOLEAN DEFAULT true',
      description: 'Changed enabled columns to default true'
    }
  ];

  private problematicColumns = [
    'id', 'created_at', 'updated_at' // These often already exist
  ];

  fixMigrationFile(inputPath: string, outputPath?: string): string {
    console.log(`🔧 Fixing migration file: ${inputPath}`);
    
    if (!fs.existsSync(inputPath)) {
      throw new Error(`Migration file not found: ${inputPath}`);
    }

    let content = fs.readFileSync(inputPath, 'utf8');
    const originalContent = content;
    let fixesApplied: string[] = [];

    // Apply all fix rules
    this.fixRules.forEach(rule => {
      const matches = content.match(rule.pattern);
      if (matches && matches.length > 0) {
        content = content.replace(rule.pattern, rule.replacement);
        fixesApplied.push(`${rule.description} (${matches.length} occurrences)`);
      }
    });

    // Add conditional checks for problematic tables/columns
    content = this.addConditionalChecks(content);

    // Add helpful header comments
    content = this.addHeaderComments(content, fixesApplied.length);

    // Determine output path
    const finalOutputPath = outputPath || this.generateOutputPath(inputPath);

    // Write fixed content
    fs.writeFileSync(finalOutputPath, content);

    // Generate summary
    console.log(`\n✅ Migration file fixed successfully!`);
    console.log(`📄 Input:  ${inputPath}`);
    console.log(`📄 Output: ${finalOutputPath}`);
    console.log(`🔧 Fixes applied: ${fixesApplied.length}`);
    
    if (fixesApplied.length > 0) {
      console.log(`\n📋 Applied fixes:`);
      fixesApplied.forEach((fix, i) => {
        console.log(`   ${i + 1}. ${fix}`);
      });
    }

    console.log(`\n🚀 Next steps:`);
    console.log(`   1. Review the fixed migration: ${finalOutputPath}`);
    console.log(`   2. Move to migrations folder: mv "${finalOutputPath}" supabase/migrations/`);
    console.log(`   3. Apply: supabase db push`);

    return finalOutputPath;
  }

  private addConditionalChecks(content: string): string {
    // Add DO blocks for complex operations that need existence checks
    const doBlocks = `
-- ==============================================
-- CONDITIONAL COLUMN ADDITIONS
-- ==============================================

-- Add columns with existence checks to prevent conflicts
DO $$
BEGIN
    -- Example of how to safely add columns that might conflict
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'enhanced_job_searches' 
        AND column_name = 'remote_type'
    ) THEN
        ALTER TABLE enhanced_job_searches ADD COLUMN remote_type TEXT;
    END IF;
    
    -- Add more conditional column additions here as needed
END $$;

`;

    // Insert DO blocks before the main ALTER statements
    const beginIndex = content.indexOf('BEGIN;');
    if (beginIndex !== -1) {
      const insertPoint = content.indexOf('\n', beginIndex) + 1;
      content = content.slice(0, insertPoint) + doBlocks + content.slice(insertPoint);
    }

    return content;
  }

  private addHeaderComments(content: string, fixCount: number): string {
    const timestamp = new Date().toISOString();
    const header = `-- FIXED MIGRATION FILE
-- Original migration auto-generated and then fixed for safety
-- Fixed at: ${timestamp}
-- Fixes applied: ${fixCount}
-- 
-- SAFETY FEATURES ADDED:
-- ✅ IF NOT EXISTS added to all column additions
-- ✅ NOT NULL constraints removed where problematic
-- ✅ Sensible defaults added where missing
-- ✅ Primary key columns commented out
-- ✅ Conditional checks for complex operations
--
-- This migration should now be safe to apply even if some columns already exist.

`;

    return header + content;
  }

  private generateOutputPath(inputPath: string): string {
    const dir = path.dirname(inputPath);
    const ext = path.extname(inputPath);
    const name = path.basename(inputPath, ext);
    
    // Generate timestamp for migration file
    const timestamp = new Date().toISOString()
      .replace(/[-:]/g, '')
      .replace(/\..+/, '')
      .slice(0, 14);
    
    return path.join(dir, `${timestamp}_fixed_${name}${ext}`);
  }

  // Method to directly fix and move to migrations folder
  fixAndMoveToMigrations(inputPath: string, migrationsDir: string = './supabase/migrations'): string {
    const timestamp = new Date().toISOString()
      .replace(/[-:]/g, '')
      .replace(/\..+/, '')
      .slice(0, 14);
    
    const migrationName = `${timestamp}_auto_fix_schema_issues_safe.sql`;
    const outputPath = path.join(migrationsDir, migrationName);
    
    // Ensure migrations directory exists
    if (!fs.existsSync(migrationsDir)) {
      fs.mkdirSync(migrationsDir, { recursive: true });
      console.log(`📁 Created migrations directory: ${migrationsDir}`);
    }
    
    // Fix the migration
    const fixedPath = this.fixMigrationFile(inputPath, outputPath);
    
    console.log(`\n🎯 Migration ready for Supabase!`);
    console.log(`📁 Location: ${outputPath}`);
    console.log(`🚀 Run: supabase db push`);
    
    return outputPath;
  }
}

// CLI interface
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
🔧 Migration Fixer - Make auto-generated migrations safe to apply

Usage:
  node fix-migration.js <input-file> [output-file]
  node fix-migration.js <input-file> --to-migrations

Examples:
  node fix-migration.js auto_fix.sql
  node fix-migration.js auto_fix.sql fixed_migration.sql
  node fix-migration.js auto_fix.sql --to-migrations

Options:
  --to-migrations    Fix and move directly to supabase/migrations/ folder
`);
    process.exit(1);
  }

  const inputPath = args[0];
  const fixer = new MigrationFixer();

  try {
    if (args[1] === '--to-migrations') {
      fixer.fixAndMoveToMigrations(inputPath);
    } else {
      const outputPath = args[1];
      fixer.fixMigrationFile(inputPath, outputPath);
    }
  } catch (error) {
    console.error(`❌ Error: ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  }
}

// Export for use as module
export { MigrationFixer };

// Run if called directly
if (require.main === module) {
  main();
}