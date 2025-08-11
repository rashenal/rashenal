import { supabase } from '../../lib/supabase';
import { HealthCheckResult } from './status';

/**
 * Test Supabase connection
 */
export async function checkDatabase(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    // Test basic connection by checking auth status
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      return {
        status: 'fail',
        message: 'Supabase authentication check failed',
        details: { error: authError.message },
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime
      };
    }

    // Test database query (simple SELECT 1)
    const { data, error } = await supabase
      .from('tasks')
      .select('count(*)')
      .limit(1);

    if (error) {
      return {
        status: 'fail',
        message: 'Database query failed',
        details: { error: error.message, code: error.code },
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime
      };
    }

    return {
      status: 'pass',
      message: 'Database connection successful',
      details: {
        url: supabase.supabaseUrl,
        authStatus: authData.session ? 'authenticated' : 'anonymous',
        queryTest: 'passed'
      },
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime
    };
  } catch (error) {
    return {
      status: 'fail',
      message: 'Database connection failed',
      details: { error: error instanceof Error ? error.message : 'Unknown error' },
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime
    };
  }
}

/**
 * Test specific table access
 */
export async function checkTableAccess(tableName: string): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);

    if (error) {
      return {
        status: 'fail',
        message: `Table ${tableName} access failed`,
        details: { error: error.message, code: error.code },
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime
      };
    }

    return {
      status: 'pass',
      message: `Table ${tableName} access successful`,
      details: { recordCount: data?.length || 0 },
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime
    };
  } catch (error) {
    return {
      status: 'fail',
      message: `Table ${tableName} access error`,
      details: { error: error instanceof Error ? error.message : 'Unknown error' },
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime
    };
  }
}

/**
 * Test all critical tables
 */
export async function checkAllTables(): Promise<{ [key: string]: HealthCheckResult }> {
  const tables = [
    'tasks',
    'habits',
    'habit_completions',
    'goals',
    'projects',
    'job_profiles',
    'job_searches',
    'job_matches'
  ];
  
  const results: { [key: string]: HealthCheckResult } = {};
  
  // Check each table in parallel
  const checks = tables.map(async (table) => {
    results[`table_${table}`] = await checkTableAccess(table);
  });
  
  await Promise.all(checks);
  
  return results;
}

/**
 * Test database write operations (safe test)
 */
export async function checkDatabaseWrite(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    // Try to create a test record (that we'll immediately delete)
    const testData = {
      title: 'Health Check Test Task',
      description: 'This is a test task created by the health check system',
      status: 'todo',
      priority: 'low',
      created_at: new Date().toISOString()
    };

    const { data: insertData, error: insertError } = await supabase
      .from('tasks')
      .insert([testData])
      .select()
      .single();

    if (insertError) {
      return {
        status: 'fail',
        message: 'Database write test failed',
        details: { error: insertError.message, code: insertError.code },
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime
      };
    }

    // Clean up by deleting the test record
    if (insertData?.id) {
      await supabase
        .from('tasks')
        .delete()
        .eq('id', insertData.id);
    }

    return {
      status: 'pass',
      message: 'Database write test successful',
      details: { testRecordId: insertData?.id },
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime
    };
  } catch (error) {
    return {
      status: 'fail',
      message: 'Database write test error',
      details: { error: error instanceof Error ? error.message : 'Unknown error' },
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime
    };
  }
}