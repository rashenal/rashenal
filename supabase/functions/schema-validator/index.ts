// Supabase Edge Function for Database Schema Validation
// This function validates the database schema and returns detailed analysis

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
  metadata: {
    totalTables: number;
    totalIssues: number;
    errorCount: number;
    warningCount: number;
    infoCount: number;
  };
}

const expectedSchema: Record<string, Record<string, any>> = {
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

function mapToSqlType(type: string): string {
  const typeMap: Record<string, string> = {
    'uuid': 'UUID',
    'text': 'TEXT',
    'text[]': 'TEXT[]',
    'boolean': 'BOOLEAN',
    'integer': 'INTEGER',
    'numeric': 'DECIMAL',
    'timestamptz': 'TIMESTAMP WITH TIME ZONE',
    'timestamp': 'TIMESTAMP',
    'time': 'TIME',
    'jsonb': 'JSONB'
  };
  
  return typeMap[type] || 'TEXT';
}

async function validateSchema(supabase: any): Promise<ValidationResult> {
  const issues: SchemaIssue[] = [];
  const tables: Record<string, TableColumn[]> = {};
  
  try {
    // Get current database schema using the RPC function
    const { data: schemaData, error: schemaError } = await supabase
      .rpc('get_table_columns', {
        schema_name: 'public'
      });
    
    if (schemaError) {
      throw new Error(`Failed to fetch schema: ${schemaError.message}`);
    }
    
    // Process the data
    for (const column of schemaData || []) {
      // Only include tables we're expecting
      if (expectedSchema[column.table_name]) {
        if (!tables[column.table_name]) {
          tables[column.table_name] = [];
        }
        tables[column.table_name].push(column);
      }
    }
    
    // Check for missing tables
    for (const [tableName, expectedColumns] of Object.entries(expectedSchema)) {
      if (!tables[tableName]) {
        issues.push({
          table: tableName,
          issue: 'Table does not exist',
          severity: 'error',
          suggestion: `CREATE TABLE ${tableName} with required columns`
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
            suggestion: `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${mapToSqlType(columnDef.type)}${columnDef.required ? ' NOT NULL' : ''};`
          });
        }
      }
    }
    
    // Generate metadata
    const metadata = {
      totalTables: Object.keys(tables).length,
      totalIssues: issues.length,
      errorCount: issues.filter(i => i.severity === 'error').length,
      warningCount: issues.filter(i => i.severity === 'warning').length,
      infoCount: issues.filter(i => i.severity === 'info').length
    };
    
    return {
      isValid: issues.length === 0,
      issues,
      tables,
      timestamp: new Date().toISOString(),
      metadata
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
      timestamp: new Date().toISOString(),
      metadata: {
        totalTables: Object.keys(tables).length,
        totalIssues: issues.length,
        errorCount: issues.filter(i => i.severity === 'error').length,
        warningCount: issues.filter(i => i.severity === 'warning').length,
        infoCount: issues.filter(i => i.severity === 'info').length
      }
    };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    // Get Supabase credentials from environment
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authorization header
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      // Use the auth token if provided
      supabase.auth.setAuth(authHeader.replace('Bearer ', ''));
    }

    // Handle different HTTP methods
    switch (req.method) {
      case 'GET':
      case 'POST': {
        console.log('🔍 Starting schema validation...');
        
        const result = await validateSchema(supabase);
        
        console.log(`✅ Validation complete. Issues found: ${result.issues.length}`);
        
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }
      
      default:
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
          status: 405,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
    }
  } catch (error) {
    console.error('Schema validator error:', error);
    
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});