#!/usr/bin/env ts-node
/*
  # Manual Migration Runner for Hosted Supabase

  This script applies the SQL migrations we created to fix the foreign key constraint issue.
  Run this with: npx ts-node scripts/run-migrations.ts

  IMPORTANT: This should be run with admin/service role credentials, not user credentials.
  You may need to run these SQL commands directly in the Supabase dashboard SQL editor.
*/

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY; // Need service role key for schema changes

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing environment variables:');
  console.error('  VITE_SUPABASE_URL:', !!SUPABASE_URL);
  console.error('  SUPABASE_SERVICE_KEY:', !!SUPABASE_SERVICE_KEY);
  console.error('\nTo run migrations, you need the service role key (not anon key)');
  console.error('Get it from: Supabase Dashboard → Settings → API → service_role key');
  console.error('Set it as: SUPABASE_SERVICE_KEY=your-service-role-key');
  process.exit(1);
}

// Create admin client with service role
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runSQL(sql: string, description: string): Promise<boolean> {
  try {
    console.log(`🔄 Running: ${description}...`);
    
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error(`❌ Failed: ${description}`);
      console.error('Error:', error.message);
      return false;
    }
    
    console.log(`✅ Success: ${description}`);
    return true;
  } catch (err) {
    console.error(`❌ Exception in: ${description}`);
    console.error('Error:', err);
    return false;
  }
}

async function runMigration(filename: string): Promise<boolean> {
  const migrationPath = path.join(__dirname, '..', 'src', 'supabase', 'migrations', filename);
  
  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Migration file not found: ${migrationPath}`);
    return false;
  }
  
  const sql = fs.readFileSync(migrationPath, 'utf8');
  return await runSQL(sql, `Migration: ${filename}`);
}

async function main() {
  console.log('🚀 Starting Migration Runner');
  console.log('================================');
  
  // Test connection
  console.log('🔍 Testing connection...');
  const { data, error } = await supabase.from('user_profiles').select('count').limit(1);
  if (error) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }
  console.log('✅ Connected to Supabase');
  
  // Run migrations in order
  const migrations = [
    '20250804_fix_missing_user_profiles.sql',
    '20250804_fix_job_profiles_schema.sql'
  ];
  
  let allSuccess = true;
  
  for (const migration of migrations) {
    const success = await runMigration(migration);
    if (!success) {
      allSuccess = false;
      console.error(`❌ Migration failed: ${migration}`);
      break;
    }
  }
  
  if (allSuccess) {
    console.log('\n🎉 All migrations completed successfully!');
    console.log('\nNow test job profile creation to verify the fix.');
  } else {
    console.log('\n💥 Migration failed. Check errors above.');
    process.exit(1);
  }
}

// Handle direct script execution
if (require.main === module) {
  main().catch(console.error);
}

export { runSQL, runMigration };