# 🗄️ Database Schema Fix Commands

## Overview
This document provides exact commands to fix the database schema issues in Rashenal. The migration will create missing tables and columns needed for the enhanced job search functionality.

## 📋 Prerequisites
- Supabase CLI installed
- Project linked to Supabase
- Terminal/Command Prompt access

## 🚀 Execution Steps

### Step 1: Navigate to Project Directory
```bash
cd "C:\Users\rharv\Documents\rashenal"
```

### Step 2: Verify Supabase Connection
```bash
supabase status
```
**Expected output:** Should show your project status and connection info.

### Step 3: Apply the Migrations
```bash
supabase db push
```
**What this does:** Applies all pending migration files to your database, including:
- `20250804_create_scraping_tables.sql`
- `20250804120000_fix_remaining_schema_issues_v2.sql`  
- `20250805_create_schema_introspection_function.sql` (for debug tools)

### Step 4: Verify Migration Applied
```bash
supabase migration list
```
**Expected output:** Should show `20250804_fix_missing_columns_comprehensive` as applied.

### Step 5: Pull Updated Schema (Optional)
```bash
supabase db pull
```
**What this does:** Updates your local schema files to match the database.

### Step 6: Generate Updated TypeScript Types
```bash
supabase gen types typescript --linked > src/lib/database-types-auto.ts
```
**What this does:** Generates fresh TypeScript types from your database schema.

## 🔍 Verification Commands

### Check if Tables Exist
```bash
supabase db reset --linked
```
**Or use the SQL console to run:**
```sql
-- Check if enhanced_job_searches table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'enhanced_job_searches'
);

-- Check if required columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'enhanced_job_searches'
AND column_name IN ('preferred_skills', 'minimum_match_score');

-- Check scraping_request_log for job_board column
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'scraping_request_log'
AND column_name = 'job_board';
```

### Test Job Search Functionality
After migration, test the job search feature in your app:
1. Navigate to Job Finder
2. Try creating a new enhanced job search
3. Click "Search LinkedIn Now" button
4. Verify no console errors about missing columns

## 🗃️ Files Created/Modified

### Migration File
- `supabase/migrations/20250804_fix_missing_columns_comprehensive.sql`
  - Creates missing tables: `enhanced_job_searches`, `job_search_results`, `search_execution_log`, `job_board_sources`
  - Adds missing columns: `preferred_skills`, `minimum_match_score`, `job_board`
  - Sets up proper indexes, RLS policies, and triggers

### TypeScript Types
- `src/lib/database-types.generated.ts`
  - Updated types matching the new database schema
  - Compatible with existing code imports

## 🔧 Troubleshooting

### Problem: Debug tools show "Failed to fetch schema: relation public.information_schema.columns does not exist"
**Solution:** This means the schema introspection functions haven't been deployed yet. The debug tools will work with limited functionality until you run:
```bash
supabase db push
```
This will deploy the `20250805_create_schema_introspection_function.sql` migration that enables full schema validation.

### Problem: "supabase: command not found"
**Solution:**
```bash
# Install Supabase CLI if not installed
npm install -g supabase
# Or use npx
npx supabase db push
```

### Problem: Migration fails with foreign key errors
**Solution:**
```bash
# Reset database and reapply all migrations
supabase db reset --linked
```

### Problem: "Column already exists" errors
**Solution:** The migration uses `IF NOT EXISTS` clauses, so this shouldn't happen. If it does:
```bash
# Check current schema
supabase db diff --schema public
# Or manually inspect with
supabase db shell
```

### Problem: TypeScript errors after migration
**Solution:**
1. Restart your development server
2. Update imports to use the new types:
```typescript
// Update imports in your service files
import type { EnhancedJobSearch, JobSearchResult } from './database-types.generated';
```

### Problem: RLS policy errors
**Solution:** The migration creates proper RLS policies. If issues persist:
```sql
-- Check RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE '%job%';
```

## 📊 What the Migration Adds

### New Tables
- ✅ `enhanced_job_searches` - Enhanced search configurations
- ✅ `job_search_results` - Individual job results with AI analysis
- ✅ `search_execution_log` - Search execution tracking
- ✅ `job_board_sources` - Job board source definitions

### New Columns
- ✅ `enhanced_job_searches.preferred_skills` - Nice-to-have skills
- ✅ `enhanced_job_searches.minimum_match_score` - AI match threshold
- ✅ `job_profiles.name` - Profile name field
- ✅ `job_profiles.bio` - Profile biography
- ✅ `job_profiles.summary` - Profile summary
- ✅ `job_profiles.location` - Single location field

### Indexes & Performance
- ✅ Proper database indexes for query performance
- ✅ Row Level Security (RLS) policies
- ✅ Triggers for `updated_at` timestamps

## 🎯 Success Criteria

After running these commands, you should be able to:
1. ✅ Create enhanced job searches without database errors
2. ✅ Use the "Search LinkedIn Now" functionality
3. ✅ View job search results with AI analysis
4. ✅ Access LinkedIn scraping settings
5. ✅ See proper TypeScript intellisense

## 🚨 Important Notes

- ⚠️ **Backup First:** Consider backing up your database before running migrations
- ⚠️ **Staging Environment:** Test in staging environment if available
- ⚠️ **User Data:** The migration preserves existing user data
- ⚠️ **Downtime:** Minimal downtime expected during migration

## 📞 Support

If you encounter issues:
1. Check the Supabase dashboard for error logs
2. Verify your database connection
3. Ensure you have proper permissions
4. Review the migration file for any conflicts

---

**Ready to execute?** Run the commands above in order, and your database schema will be fully synchronized with your application code! 🚀