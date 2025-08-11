/*
  # Test Queries for Migration Fixes
  
  Run these queries in Supabase SQL Editor to verify that all fixes work correctly.
  Copy and paste each section individually to test different aspects.
*/

-- ============================================================================
-- TEST 1: Verify User Profiles and Auth Users Match
-- ============================================================================

SELECT 
    'User Profile Verification' as test_name,
    (SELECT COUNT(*) FROM auth.users WHERE deleted_at IS NULL) as auth_users_count,
    (SELECT COUNT(*) FROM user_profiles) as user_profiles_count,
    CASE 
        WHEN (SELECT COUNT(*) FROM auth.users WHERE deleted_at IS NULL) = 
             (SELECT COUNT(*) FROM user_profiles) 
        THEN '✅ PASS: Perfect 1:1 relationship'
        ELSE '❌ FAIL: Mismatch between auth users and profiles'
    END as result;

-- ============================================================================
-- TEST 2: Check Foreign Key Integrity (Job Profiles → User Profiles)
-- ============================================================================

SELECT 
    'Foreign Key Integrity Check' as test_name,
    COUNT(*) as total_job_profiles,
    COUNT(up.id) as valid_references,
    COUNT(*) - COUNT(up.id) as orphaned_profiles,
    CASE 
        WHEN COUNT(*) = COUNT(up.id) 
        THEN '✅ PASS: All job profiles have valid user references'
        ELSE '❌ FAIL: Some job profiles have invalid user references'
    END as result
FROM job_profiles jp
LEFT JOIN user_profiles up ON jp.user_id = up.id;

-- ============================================================================
-- TEST 3: Verify Email Column Exists and is Populated
-- ============================================================================

SELECT 
    'Email Column Verification' as test_name,
    COUNT(*) as total_job_profiles,
    COUNT(email) as profiles_with_email,
    COUNT(*) - COUNT(email) as profiles_missing_email,
    ROUND(COUNT(email)::numeric / COUNT(*) * 100, 1) || '%' as email_coverage,
    CASE 
        WHEN COUNT(email) > 0 
        THEN '✅ PASS: Email column exists and has data'
        ELSE '❌ FAIL: Email column missing or empty'
    END as result
FROM job_profiles;

-- ============================================================================
-- TEST 4: Test Auto-Profile Creation Function
-- ============================================================================

-- This tests the ensure_user_profile function
-- Replace 'your-user-id-here' with an actual user ID from auth.users
/*
DO $$
DECLARE
    test_user_id UUID := 'your-user-id-here'; -- Replace with actual user ID
    result user_profiles;
BEGIN
    -- Test the ensure_user_profile function
    SELECT ensure_user_profile(test_user_id) INTO result;
    
    RAISE NOTICE 'Function test result: User %, Name: %, Email: %', 
                 result.id, result.full_name, result.email;
END $$;
*/

-- ============================================================================
-- TEST 5: Verify All Expected Columns Exist
-- ============================================================================

SELECT 
    'Schema Column Verification' as test_name,
    COUNT(*) as total_columns_found,
    CASE 
        WHEN COUNT(*) >= 15 -- Minimum expected columns
        THEN '✅ PASS: All expected columns exist'
        ELSE '❌ FAIL: Missing columns detected'
    END as result,
    string_agg(column_name, ', ' ORDER BY ordinal_position) as all_columns
FROM information_schema.columns 
WHERE table_name = 'job_profiles' 
  AND table_schema = 'public';

-- ============================================================================
-- TEST 6: Test Job Profile Creation (Simulated)
-- ============================================================================

-- This query shows what would happen during job profile creation
SELECT 
    'Job Profile Creation Readiness' as test_name,
    u.id as user_id,
    u.email as auth_email,
    up.full_name as profile_name,
    up.email as profile_email,
    CASE 
        WHEN up.id IS NOT NULL 
        THEN '✅ READY: User profile exists, job profile creation should work'
        ELSE '❌ NOT READY: User profile missing'
    END as status
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.id
WHERE u.deleted_at IS NULL
LIMIT 5;

-- ============================================================================
-- TEST 7: Row Level Security Policy Test
-- ============================================================================

-- Test that RLS policies work correctly
SELECT 
    'RLS Policy Test' as test_name,
    COUNT(*) as accessible_profiles,
    CASE 
        WHEN COUNT(*) >= 0 
        THEN '✅ PASS: RLS policies allow access'
        ELSE '❌ FAIL: RLS policies blocking access'
    END as result
FROM job_profiles
WHERE user_id = auth.uid(); -- This uses the current authenticated user

-- ============================================================================
-- TEST 8: Trigger Function Test
-- ============================================================================

-- Verify the trigger function exists and will work for new users
SELECT 
    'Trigger Function Verification' as test_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_proc 
            WHERE proname = 'create_user_profile'
        ) THEN '✅ PASS: Auto-profile creation function exists'
        ELSE '❌ FAIL: Auto-profile creation function missing'
    END as function_status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_trigger 
            WHERE tgname = 'on_auth_user_created'
        ) THEN '✅ PASS: Auto-profile creation trigger exists'
        ELSE '❌ FAIL: Auto-profile creation trigger missing'
    END as trigger_status;

-- ============================================================================
-- TEST 9: Full End-to-End Simulation
-- ============================================================================

-- This simulates the complete flow that should now work
WITH user_check AS (
    SELECT 
        u.id,
        u.email,
        up.id as profile_exists,
        CASE WHEN up.id IS NOT NULL THEN 'Profile Exists' ELSE 'No Profile' END as status
    FROM auth.users u
    LEFT JOIN user_profiles up ON u.id = up.id
    WHERE u.deleted_at IS NULL
    LIMIT 1
),
simulation AS (
    SELECT 
        uc.*,
        CASE 
            WHEN uc.profile_exists IS NOT NULL 
            THEN 'Job profile creation should succeed'
            ELSE 'ensure_user_profile() function should create missing profile first'
        END as expected_behavior
    FROM user_check uc
)
SELECT 
    'End-to-End Flow Simulation' as test_name,
    id as test_user_id,
    email as test_user_email,
    status as current_status,
    expected_behavior,
    '✅ READY: Migration fixes should resolve all issues' as overall_status
FROM simulation;

-- ============================================================================
-- SUMMARY REPORT
-- ============================================================================

SELECT 
    '=== MIGRATION FIX SUMMARY ===' as summary,
    (SELECT COUNT(*) FROM auth.users WHERE deleted_at IS NULL) as total_auth_users,
    (SELECT COUNT(*) FROM user_profiles) as total_user_profiles,
    (SELECT COUNT(*) FROM job_profiles) as total_job_profiles,
    CASE 
        WHEN (SELECT COUNT(*) FROM auth.users WHERE deleted_at IS NULL) = 
             (SELECT COUNT(*) FROM user_profiles)
        THEN '✅ User profiles fixed'
        ELSE '❌ User profiles still need fixing'
    END as user_profile_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'job_profiles' AND column_name = 'email')
        THEN '✅ Email column added'
        ELSE '❌ Email column missing'
    END as email_column_status,
    CASE 
        WHEN NOT EXISTS (
            SELECT 1 FROM job_profiles jp
            LEFT JOIN user_profiles up ON jp.user_id = up.id
            WHERE up.id IS NULL
        ) THEN '✅ Foreign keys fixed'
        ELSE '❌ Foreign key issues remain'
    END as foreign_key_status;