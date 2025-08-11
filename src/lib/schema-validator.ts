// Schema Validation & Auto-Fix Utilities for Rashenal
import { supabase } from './supabase';

interface SchemaIssue {
  table: string;
  column?: string;
  issue: string;
  severity: 'error' | 'warning' | 'info';
  suggestion?: string;
}

interface TableColumn {
  table_name: string;
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
}

interface ValidationResult {
  isValid: boolean;
  issues: SchemaIssue[];
  tables: Record<string, TableColumn[]>;
  timestamp: string;
}

export class SchemaValidator {
  private expectedSchema: Record<string, Record<string, any>> = {
    // Enhanced job search tables
    enhanced_job_searches: {
      id: { type: 'uuid', required: true },
      user_id: { type: 'uuid', required: true },
      profile_id: { type: 'uuid', required: false },
      search_name: { type: 'text', required: true },
      job_title: { type: 'text', required: false },
      location: { type: 'text', required: false },
      remote_type: { type: 'text', required: false },
      employment_type: { type: 'text[]', required: false },
      experience_level: { type: 'text', required: false },
      salary_min: { type: 'integer', required: false },
      salary_max: { type: 'integer', required: false },
      salary_currency: { type: 'text', required: false },
      company_size: { type: 'text[]', required: false },
      industry_sectors: { type: 'text[]', required: false },
      required_skills: { type: 'text[]', required: false },
      preferred_skills: { type: 'text[]', required: false }, // Often missing
      work_authorization: { type: 'text', required: false },
      visa_sponsorship: { type: 'boolean', required: false },
      selected_job_boards: { type: 'text[]', required: false },
      search_frequency: { type: 'text', required: false },
      scheduled_time: { type: 'time', required: false },
      timezone: { type: 'text', required: false },
      max_results_per_board: { type: 'integer', required: false },
      ai_matching_enabled: { type: 'boolean', required: false },
      minimum_match_score: { type: 'numeric', required: false }, // Often missing
      is_active: { type: 'boolean', required: false },
      last_executed_at: { type: 'timestamptz', required: false },
      next_execution_at: { type: 'timestamptz', required: false },
      created_at: { type: 'timestamptz', required: true },
      updated_at: { type: 'timestamptz', required: true }
    },
    job_board_sources: {
      id: { type: 'uuid', required: true },
      name: { type: 'text', required: true },
      display_name: { type: 'text', required: true },
      website_url: { type: 'text', required: true },
      api_available: { type: 'boolean', required: false },
      is_active: { type: 'boolean', required: false },
      rate_limit_per_hour: { type: 'integer', required: false },
      supports_remote_filter: { type: 'boolean', required: false },
      supports_salary_filter: { type: 'boolean', required: false },
      supports_experience_filter: { type: 'boolean', required: false },
      created_at: { type: 'timestamptz', required: true },
      updated_at: { type: 'timestamptz', required: true }
    },
    job_search_results: {
      id: { type: 'uuid', required: true },
      search_id: { type: 'uuid', required: true },
      job_board_source_id: { type: 'uuid', required: true },
      job_title: { type: 'text', required: true },
      company_name: { type: 'text', required: true },
      job_description: { type: 'text', required: false },
      location: { type: 'text', required: false },
      remote_type: { type: 'text', required: false },
      employment_type: { type: 'text', required: false },
      experience_level: { type: 'text', required: false },
      salary_min: { type: 'integer', required: false },
      salary_max: { type: 'integer', required: false },
      salary_currency: { type: 'text', required: false },
      original_job_id: { type: 'text', required: false },
      job_url: { type: 'text', required: true },
      posted_date: { type: 'timestamptz', required: false },
      application_deadline: { type: 'timestamptz', required: false },
      ai_match_score: { type: 'numeric', required: false },
      ai_analysis: { type: 'jsonb', required: false },
      skill_matches: { type: 'text[]', required: false },
      missing_skills: { type: 'text[]', required: false },
      is_bookmarked: { type: 'boolean', required: false },
      is_dismissed: { type: 'boolean', required: false },
      viewed_at: { type: 'timestamptz', required: false },
      created_at: { type: 'timestamptz', required: true },
      updated_at: { type: 'timestamptz', required: true }
    },
    search_execution_log: {
      id: { type: 'uuid', required: true },
      search_id: { type: 'uuid', required: true },
      execution_type: { type: 'text', required: true },
      started_at: { type: 'timestamptz', required: false },
      completed_at: { type: 'timestamptz', required: false },
      status: { type: 'text', required: true },
      total_results_found: { type: 'integer', required: false },
      results_by_board: { type: 'jsonb', required: false },
      error_message: { type: 'text', required: false },
      error_details: { type: 'jsonb', required: false },
      created_at: { type: 'timestamptz', required: true }
    },
    scraping_preferences: {
      id: { type: 'uuid', required: true },
      user_id: { type: 'uuid', required: true },
      linkedin_enabled: { type: 'boolean', required: false },
      linkedin_use_login: { type: 'boolean', required: false },
      linkedin_email: { type: 'text', required: false },
      linkedin_rate_limit_ms: { type: 'integer', required: false },
      linkedin_max_results_per_search: { type: 'integer', required: false },
      linkedin_user_agent_rotation: { type: 'boolean', required: false },
      respect_rate_limits: { type: 'boolean', required: false },
      enable_anti_bot_measures: { type: 'boolean', required: false },
      max_concurrent_requests: { type: 'integer', required: false },
      default_delay_ms: { type: 'integer', required: false },
      max_retries: { type: 'integer', required: false },
      store_raw_html: { type: 'boolean', required: false },
      anonymize_searches: { type: 'boolean', required: false },
      created_at: { type: 'timestamptz', required: true },
      updated_at: { type: 'timestamptz', required: true }
    },
    scraping_request_log: {
      id: { type: 'uuid', required: true },
      user_id: { type: 'uuid', required: true },
      job_board: { type: 'text', required: true }, // Often missing
      status: { type: 'text', required: true },
      url: { type: 'text', required: false },
      results_count: { type: 'integer', required: false },
      error_message: { type: 'text', required: false },
      response_time_ms: { type: 'integer', required: false },
      user_agent: { type: 'text', required: false },
      created_at: { type: 'timestamptz', required: true }
    },
    job_profiles: {
      id: { type: 'uuid', required: true },
      user_id: { type: 'uuid', required: true },
      name: { type: 'text', required: true }, // Often missing
      title: { type: 'text', required: true },
      bio: { type: 'text', required: false }, // Often missing
      summary: { type: 'text', required: false }, // Often missing
      location: { type: 'text', required: false }, // Often missing
      experience_level: { type: 'text', required: false },
      employment_types: { type: 'text[]', required: false },
      desired_salary_min: { type: 'integer', required: false },
      desired_salary_max: { type: 'integer', required: false },
      salary_currency: { type: 'text', required: false },
      locations: { type: 'text[]', required: false },
      remote_preference: { type: 'text', required: false },
      skills: { type: 'text[]', required: false },
      industries: { type: 'text[]', required: false },
      company_sizes: { type: 'text[]', required: false },
      values: { type: 'text[]', required: false },
      deal_breakers: { type: 'text[]', required: false },
      resume_url: { type: 'text', required: false },
      linkedin_url: { type: 'text', required: false },
      portfolio_url: { type: 'text', required: false },
      cover_letter_template: { type: 'text', required: false },
      is_active: { type: 'boolean', required: false },
      created_at: { type: 'timestamptz', required: true },
      updated_at: { type: 'timestamptz', required: true }
    }
  };

  async validateSchema(): Promise<ValidationResult> {
    const issues: SchemaIssue[] = [];
    const tables: Record<string, TableColumn[]> = {};
    
    try {
      // Try to get database schema
      let currentSchema: TableColumn[] = [];
      
      try {
        currentSchema = await this.getDatabaseSchema();
      } catch (schemaError) {
        console.warn('Could not fetch full schema information, using table existence checks only');
        
        // Fallback: Just check if tables exist
        for (const tableName of Object.keys(this.expectedSchema)) {
          try {
            const { error } = await supabase
              .from(tableName)
              .select('count')
              .limit(1)
              .single();
            
            if (!error) {
              // Table exists
              tables[tableName] = [{
                table_name: tableName,
                column_name: 'exists',
                data_type: 'unknown',
                is_nullable: 'YES',
                column_default: null
              }];
            } else if (error.code === 'PGRST116') {
              // Table doesn't exist
              issues.push({
                table: tableName,
                issue: 'Table does not exist',
                severity: 'error',
                suggestion: `Create table ${tableName} with required columns`
              });
            }
          } catch (e) {
            console.debug(`Table ${tableName} check failed:`, e);
          }
        }
        
        // Can't check columns without schema access
        if (Object.keys(tables).length > 0) {
          issues.push({
            table: 'system',
            issue: 'Limited validation: Unable to check column details. Deploy the schema introspection functions for full validation.',
            severity: 'warning',
            suggestion: 'Run migration: 20250805_create_schema_introspection_function.sql'
          });
        }
      }
      
      // If we got full schema data, do complete validation
      if (currentSchema.length > 0) {
        // Organize by table
        for (const column of currentSchema) {
          if (!tables[column.table_name]) {
            tables[column.table_name] = [];
          }
          tables[column.table_name].push(column);
        }
        
        // Check for missing tables
        for (const [tableName, expectedColumns] of Object.entries(this.expectedSchema)) {
          if (!tables[tableName]) {
            issues.push({
              table: tableName,
              issue: 'Table does not exist',
              severity: 'error',
              suggestion: `Create table ${tableName} with required columns`
            });
            continue;
          }
          
          // Check for missing columns
          const existingColumns = new Set(tables[tableName].map(col => col.column_name));
          
          for (const [columnName, columnDef] of Object.entries(expectedColumns)) {
            if (!existingColumns.has(columnName)) {
              issues.push({
                table: tableName,
                column: columnName,
                issue: 'Column does not exist',
                severity: columnDef.required ? 'error' : 'warning',
                suggestion: `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${this.mapToSqlType(columnDef.type)}${columnDef.required ? ' NOT NULL' : ''};`
              });
            }
          }
        }
        
        // Check for common issues
        this.checkCommonIssues(tables, issues);
      }
      
      return {
        isValid: issues.length === 0,
        issues,
        tables,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Schema validation error:', error);
      issues.push({
        table: 'system',
        issue: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'error'
      });
      
      return {
        isValid: false,
        issues,
        tables,
        timestamp: new Date().toISOString()
      };
    }
  }

  async getDatabaseSchema(): Promise<TableColumn[]> {
    try {
      // Try using a direct SQL query through RPC
      const query = `
        SELECT 
          table_name,
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name IN (${Object.keys(this.expectedSchema).map(t => `'${t}'`).join(', ')})
        ORDER BY table_name, ordinal_position;
      `;

      // First try: Use sql RPC function if available
      const { data: sqlData, error: sqlError } = await supabase.rpc('sql', { query });
      
      if (!sqlError && sqlData) {
        return sqlData;
      }

      // Second try: Get schema information through a custom RPC function
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_table_columns', {
        schema_name: 'public'
      });
      
      if (!rpcError && rpcData) {
        return rpcData;
      }

      // Third try: Query tables directly to infer schema
      const tables: TableColumn[] = [];
      
      // For each expected table, try to query it with limit 0 to check if it exists
      for (const tableName of Object.keys(this.expectedSchema)) {
        try {
          const { error: tableError } = await supabase
            .from(tableName)
            .select('*')
            .limit(0);
          
          if (!tableError) {
            // Table exists, but we can't get column info this way
            // Add a placeholder entry
            tables.push({
              table_name: tableName,
              column_name: 'unknown',
              data_type: 'unknown',
              is_nullable: 'YES',
              column_default: null
            });
          }
        } catch (e) {
          // Table doesn't exist or other error
          console.debug(`Table ${tableName} check failed:`, e);
        }
      }

      if (tables.length > 0) {
        console.warn('Using limited schema information. Some validation features may be unavailable.');
        return tables;
      }

      throw new Error('Unable to fetch database schema. Please ensure you have proper database access.');
      
    } catch (error) {
      throw new Error(`Failed to fetch schema: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private checkCommonIssues(tables: Record<string, TableColumn[]>, issues: SchemaIssue[]): void {
    // Check for incorrect remote_type column type
    const jobSearches = tables['job_searches'];
    if (jobSearches) {
      const remoteTypeCol = jobSearches.find(col => col.column_name === 'remote_type');
      if (remoteTypeCol && remoteTypeCol.data_type === 'boolean') {
        issues.push({
          table: 'job_searches',
          column: 'remote_type',
          issue: 'Column type mismatch: expected text, found boolean',
          severity: 'error',
          suggestion: 'ALTER TABLE job_searches ALTER COLUMN remote_type TYPE text USING CASE WHEN remote_type THEN \'remote\' ELSE \'onsite\' END;'
        });
      }
    }
    
    // Check for missing RLS policies
    // This would require additional RPC function to check policies
  }

  private mapToSqlType(type: string): string {
    const typeMap: Record<string, string> = {
      'uuid': 'UUID',
      'text': 'TEXT',
      'text[]': 'TEXT[]',
      'boolean': 'BOOLEAN',
      'integer': 'INTEGER',
      'numeric': 'DECIMAL(3,2)',
      'timestamptz': 'TIMESTAMP WITH TIME ZONE',
      'timestamp': 'TIMESTAMP',
      'time': 'TIME',
      'jsonb': 'JSONB'
    };
    
    return typeMap[type] || 'TEXT';
  }

  async generateAutoFix(): Promise<string | null> {
    const validation = await this.validateSchema();
    
    if (validation.isValid) {
      return null;
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const migrations: string[] = [
      `-- Auto-generated migration to fix schema issues`,
      `-- Generated at: ${new Date().toISOString()}`,
      `-- Issues found: ${validation.issues.length}`,
      '',
      'BEGIN;',
      ''
    ];
    
    // Group issues by table
    const issuesByTable = validation.issues.reduce((acc, issue) => {
      if (!acc[issue.table]) {
        acc[issue.table] = [];
      }
      acc[issue.table].push(issue);
      return acc;
    }, {} as Record<string, SchemaIssue[]>);
    
    // Generate CREATE TABLE statements for missing tables
    for (const [tableName, tableIssues] of Object.entries(issuesByTable)) {
      const tableExists = validation.tables[tableName];
      
      if (!tableExists && tableIssues.some(i => i.issue === 'Table does not exist')) {
        migrations.push(`-- Create missing table: ${tableName}`);
        migrations.push(this.generateCreateTableStatement(tableName));
        migrations.push('');
      }
    }
    
    // Generate ALTER TABLE statements for missing columns
    for (const [tableName, tableIssues] of Object.entries(issuesByTable)) {
      const columnIssues = tableIssues.filter(i => i.issue === 'Column does not exist');
      
      if (columnIssues.length > 0 && validation.tables[tableName]) {
        migrations.push(`-- Add missing columns to ${tableName}`);
        for (const issue of columnIssues) {
          if (issue.suggestion) {
            migrations.push(issue.suggestion);
          }
        }
        migrations.push('');
      }
    }
    
    // Add type corrections
    for (const issue of validation.issues) {
      if (issue.issue.includes('type mismatch') && issue.suggestion) {
        migrations.push(`-- Fix type mismatch for ${issue.table}.${issue.column}`);
        migrations.push(issue.suggestion);
        migrations.push('');
      }
    }
    
    migrations.push('COMMIT;');
    
    return migrations.join('\n');
  }

  private generateCreateTableStatement(tableName: string): string {
    const columns = this.expectedSchema[tableName];
    if (!columns) {
      return `-- Unable to generate CREATE TABLE for ${tableName}`;
    }
    
    const columnDefs: string[] = [];
    const primaryKey = 'id';
    
    for (const [columnName, columnDef] of Object.entries(columns)) {
      let def = `  ${columnName} ${this.mapToSqlType(columnDef.type)}`;
      
      if (columnName === primaryKey) {
        def += ' PRIMARY KEY DEFAULT gen_random_uuid()';
      }
      
      if (columnDef.required && columnName !== primaryKey) {
        def += ' NOT NULL';
      }
      
      // Add defaults for common columns
      if (columnName === 'created_at' || columnName === 'updated_at') {
        def += ' DEFAULT NOW()';
      } else if (columnName === 'is_active') {
        def += ' DEFAULT true';
      } else if (columnDef.type === 'boolean' && !columnDef.required) {
        def += ' DEFAULT false';
      }
      
      columnDefs.push(def);
    }
    
    // Add foreign keys
    if (tableName !== 'job_board_sources' && columns.user_id) {
      columnDefs.push('  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE');
    }
    
    return `CREATE TABLE IF NOT EXISTS ${tableName} (\n${columnDefs.join(',\n')}\n);`;
  }

  // CLI support (Node.js environment only)
  async runCLI(): Promise<void> {
    // Check if we're in a Node.js environment
    if (typeof process === 'undefined' || typeof require === 'undefined') {
      console.error('CLI functionality is only available in Node.js environment');
      return;
    }

    try {
      // Dynamic imports for Node.js-only modules
      const fs = await import('fs');
      const path = await import('path');
      
      const args = process.argv.slice(2);
      const autoFix = args.includes('--auto-fix');
      
      console.log('🔍 Rashenal Schema Validator');
      console.log('===========================\n');
      
      const validation = await this.validateSchema();
      
      console.log(`📊 Validation Result: ${validation.isValid ? '✅ PASSED' : '❌ FAILED'}`);
      console.log(`📅 Timestamp: ${validation.timestamp}`);
      console.log(`📋 Tables Checked: ${Object.keys(validation.tables).length}`);
      console.log(`⚠️  Issues Found: ${validation.issues.length}\n`);
      
      if (validation.issues.length > 0) {
        console.log('Issues:');
        console.log('-------');
        for (const issue of validation.issues) {
          const icon = issue.severity === 'error' ? '❌' : issue.severity === 'warning' ? '⚠️' : 'ℹ️';
          console.log(`${icon} [${issue.severity.toUpperCase()}] ${issue.table}${issue.column ? `.${issue.column}` : ''}: ${issue.issue}`);
          if (issue.suggestion) {
            console.log(`   💡 ${issue.suggestion}`);
          }
        }
        console.log('');
      }
      
      if (autoFix && !validation.isValid) {
        console.log('🔧 Generating auto-fix migration...\n');
        
        const migration = await this.generateAutoFix();
        if (migration) {
          const filename = `${new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19)}_auto_fix.sql`;
          const filepath = path.join(process.cwd(), 'supabase', 'migrations', filename);
          
          try {
            fs.writeFileSync(filepath, migration);
            console.log(`✅ Migration saved to: ${filepath}`);
            console.log('\nTo apply the migration, run:');
            console.log(`  supabase db push`);
          } catch (err) {
            console.error(`❌ Failed to save migration: ${err instanceof Error ? err.message : 'Unknown error'}`);
            console.log('\nMigration content:');
            console.log('==================');
            console.log(migration);
          }
        }
      }
    } catch (error) {
      console.error('Failed to run CLI:', error);
    }
  }
}

// CLI execution is handled separately via npm scripts
// This file is now browser-compatible