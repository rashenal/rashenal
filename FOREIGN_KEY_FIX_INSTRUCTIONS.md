# Foreign Key Constraint Fix Instructions

## Problem Description

Users are experiencing a foreign key constraint error when trying to create job profiles:

```
insert or update on table "job_profiles" violates foreign key constraint
"job_profiles_user_id_fkey"
DETAIL: Key (user_id)=(fec8b253-9b68-4136-9611-e1dfcbd4be65) is not present in table "user_profiles"
```

## Root Cause

The issue occurs because:
1. User exists in `auth.users` (they're authenticated)
2. User does NOT exist in `user_profiles` table 
3. `job_profiles.user_id` references `user_profiles.id`, not `auth.users.id`
4. The trigger to create user profiles automatically may have failed or wasn't run for existing users

## Solution Implemented

### 1. Updated JobFinderService (✅ COMPLETED)

The `createProfile` method now:
- Automatically checks if user profile exists
- Creates missing user profile before creating job profile
- Handles both automatic and manual creation fallbacks
- Provides detailed error logging

### 2. Created Database Migrations (✅ COMPLETED)

Two migration files were created:
- `20250804_fix_missing_user_profiles.sql` - Creates missing user profiles for existing auth users
- `20250804_fix_job_profiles_schema.sql` - Fixes schema mismatches and adds missing columns

### 3. Added Diagnostic Tool (✅ COMPLETED)

A temporary `DatabaseMigrationHelper` component was added to:
- Diagnose the exact cause of the constraint error
- Test foreign key constraints
- Manually create missing user profiles
- Provide detailed logging and feedback

## How to Use the Fix

### Option 1: Use the Diagnostic Tool (Recommended)

1. **Access the Tool:**
   - Go to Job Finder Dashboard → Professional Profiles
   - Click the red "Fix DB Issue" button in the top right
   - The diagnostic tool will appear

2. **Run Diagnostics:**
   - Click "Run Diagnostics" to identify the problem
   - Review the diagnostic results to confirm the issue

3. **Fix the Issue:**
   - Click "Fix User Profile" to create the missing user profile
   - Re-run diagnostics to verify the fix worked

4. **Test Profile Creation:**
   - Try creating a job profile normally
   - The foreign key constraint error should be resolved

### Option 2: Apply Database Migrations (Advanced)

If you have access to the Supabase dashboard:

1. **Run Missing User Profiles Migration:**
   ```sql
   -- Copy and paste the contents of:
   -- src/supabase/migrations/20250804_fix_missing_user_profiles.sql
   -- into the Supabase Dashboard SQL Editor
   ```

2. **Run Schema Fix Migration:**
   ```sql
   -- Copy and paste the contents of:
   -- src/supabase/migrations/20250804_fix_job_profiles_schema.sql  
   -- into the Supabase Dashboard SQL Editor
   ```

### Option 3: Manual SQL Fix (Quick Fix)

If you just need to fix the specific user `fec8b253-9b68-4136-9611-e1dfcbd4be65`:

```sql
-- Insert missing user profile
INSERT INTO user_profiles (id, email, full_name, created_at, updated_at)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', email) as full_name,
  created_at,
  NOW() as updated_at
FROM auth.users 
WHERE id = 'fec8b253-9b68-4136-9611-e1dfcbd4be65'
ON CONFLICT (id) DO NOTHING;
```

## Verification Steps

1. **Check User Profile Exists:**
   ```sql
   SELECT * FROM user_profiles WHERE id = 'fec8b253-9b68-4136-9611-e1dfcbd4be65';
   ```

2. **Test Job Profile Creation:**
   - Try creating a job profile through the UI
   - Should work without foreign key constraint errors

3. **Check for Other Missing Profiles:**
   ```sql
   SELECT COUNT(*) as missing_profiles
   FROM auth.users au
   LEFT JOIN user_profiles up ON au.id = up.id
   WHERE up.id IS NULL AND au.email IS NOT NULL;
   ```

## Technical Details

### Database Schema Chain:
```
auth.users (Supabase managed)
    ↓ (id)
user_profiles (our table)
    ↓ (id)  
job_profiles (our table)
```

### Key Files Modified:
- `src/lib/job-finder-service.ts` - Enhanced createProfile method
- `src/lib/database-types.ts` - Updated JobProfile interface  
- `src/components/DatabaseMigrationHelper.tsx` - Diagnostic tool
- `src/components/JobProfileManager.tsx` - Added diagnostic access

### Triggers in Place:
- `create_user_profile_trigger` - Automatically creates user profiles for new signups
- `ensure_user_profile()` function - Manual profile creation helper

## Cleanup Instructions

After the issue is resolved:

1. **Remove Diagnostic Tool:**
   - Remove the "Fix DB Issue" button from JobProfileManager
   - Remove the DatabaseMigrationHelper import and component
   - Delete `src/components/DatabaseMigrationHelper.tsx`

2. **Remove Debug Code:**
   - Remove console.log statements from job-finder-service.ts
   - Clean up any temporary debug state

## Prevention

To prevent this issue in the future:
1. The trigger should automatically create user profiles for new signups
2. The enhanced createProfile method will handle edge cases
3. Monitor for constraint errors in application logs
4. Consider adding a health check that verifies user profile consistency

## Support

If you encounter issues:
1. Check the diagnostic tool results for specific error details
2. Look for constraint error messages in browser console
3. Verify user authentication status and user ID
4. Check Supabase logs for detailed error information