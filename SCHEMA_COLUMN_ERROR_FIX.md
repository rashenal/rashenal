# Fix: "Could not find the 'cover_letter_template' column" Error

## Problem Description

The error occurs when trying to create job profiles:
```
Failed to create job profile: Could not find the 'cover_letter_template' column of 'job_profiles' in the schema cache
```

## Root Cause

The database schema is missing several columns that the application expects. This happens when:
1. Original migrations weren't applied completely
2. Database was created manually without all required columns
3. Schema cache is outdated

## Quick Fix (Recommended)

### Step 1: Use the Diagnostic Tool
1. Go to **Jobs → Professional Profiles**
2. Click the red **"Fix DB Issue"** button
3. Click **"Run Diagnostics"** to identify missing columns
4. Review the "Schema Column Check" results

### Step 2: Apply Database Fixes
Two options depending on your access level:

#### Option A: Manual SQL Execution (If you have Supabase Dashboard access)
1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Copy and paste the contents of this file: `src/supabase/migrations/20250804_fix_missing_job_profile_columns.sql`
4. Execute the migration

#### Option B: Use the Diagnostic Tool
1. In the diagnostic tool, click **"Fix Schema"**
2. Follow the instructions to run the migration manually

## The Migration SQL

If you need to run it manually, here's what needs to be executed:

```sql
-- Add all potentially missing columns
ALTER TABLE job_profiles 
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS summary TEXT,
ADD COLUMN IF NOT EXISTS cv_tone TEXT,
ADD COLUMN IF NOT EXISTS cover_letter_tone TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS intro_video_url TEXT,
ADD COLUMN IF NOT EXISTS cover_letter_template TEXT,
ADD COLUMN IF NOT EXISTS work_preferences JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS experience_level TEXT 
  CHECK (experience_level IN ('intern', 'junior', 'mid', 'senior', 'lead', 'executive')),
ADD COLUMN IF NOT EXISTS employment_types TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS desired_salary_min INTEGER,
ADD COLUMN IF NOT EXISTS desired_salary_max INTEGER,
ADD COLUMN IF NOT EXISTS salary_currency TEXT DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS locations TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS remote_preference TEXT 
  CHECK (remote_preference IN ('onsite', 'hybrid', 'remote', 'flexible')),
ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS industries TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS company_sizes TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS values TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS deal_breakers TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS resume_url TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS portfolio_url TEXT;
```

## Technical Implementation

### What Was Fixed

1. **Enhanced Diagnostic Tool** (`DatabaseMigrationHelper.tsx`):
   - Added schema column verification
   - Detects specific missing columns
   - Provides clear error reporting

2. **Updated JobFinderService** (`job-finder-service.ts`):
   - Tries both `title` and `name` fields (handles schema inconsistency)
   - Uses minimal field set to avoid schema errors
   - Better error handling and logging

3. **Comprehensive Migration** (`20250804_fix_missing_job_profile_columns.sql`):
   - Adds all potentially missing columns
   - Includes proper constraints and defaults
   - Updates existing records with sensible defaults

### Fallback Behavior

The application now:
1. **Attempts** profile creation with original schema (`title` field)
2. **Falls back** to alternative schema (`name` field) if needed
3. **Uses minimal** field set to avoid column errors
4. **Provides detailed** error logging for debugging

## Verification Steps

After applying the fix:

1. **Test Profile Creation**:
   - Go to Jobs → Professional Profiles
   - Try uploading a CV and creating a profile
   - Should work without column errors

2. **Verify Schema**:
   - Use the diagnostic tool to run "Schema Column Check"
   - Should show "All expected columns exist"

3. **Check Database**:
   ```sql
   SELECT column_name, data_type, is_nullable
   FROM information_schema.columns
   WHERE table_name = 'job_profiles'
   ORDER BY ordinal_position;
   ```

## Expected Columns in job_profiles

After the fix, the table should have these columns:
- `id`, `user_id`, `name`/`title`, `email`, `phone`, `location`
- `bio`, `summary`, `skills`, `work_preferences`
- `cv_tone`, `cover_letter_tone`, `avatar_url`, `intro_video_url`
- `is_active`, `created_at`, `updated_at`
- `experience_level`, `employment_types`, `desired_salary_min/max`
- `salary_currency`, `locations`, `remote_preference`
- `industries`, `company_sizes`, `values`, `deal_breakers`
- `resume_url`, `linkedin_url`, `portfolio_url`, `cover_letter_template`

## Prevention

To prevent this in the future:
1. Always run complete migrations when setting up new environments
2. Use schema validation in CI/CD pipelines
3. Keep migration files in version control
4. Test profile creation after any schema changes

## Rollback

If needed, you can remove the added columns:
```sql
-- Only if you need to rollback (not recommended)
ALTER TABLE job_profiles 
DROP COLUMN IF EXISTS cover_letter_template,
DROP COLUMN IF EXISTS bio,
-- ... etc
```

## Support

If the error persists:
1. Check browser console for detailed error messages
2. Verify user authentication and permissions
3. Ensure migrations ran successfully in Supabase dashboard
4. Contact database administrator if schema changes require elevated permissions