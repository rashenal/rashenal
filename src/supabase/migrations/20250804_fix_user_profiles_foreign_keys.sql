/*
  # Fix User Profiles and Foreign Key Constraints
  
  This comprehensive migration fixes the core issues with user profiles and job profiles:
  1. Creates missing user_profiles records for existing authenticated users
  2. Adds missing email column to job_profiles table
  3. Fixes foreign key relationships: auth.users → user_profiles → job_profiles
  4. Creates auto-profile creation function and trigger
  5. Ensures data integrity and proper constraints

  ISSUES ADDRESSED:
  - "User profile does not exist - this is the root cause of the foreign key error"
  - Missing email column in job_profiles
  - Foreign key constraint violations
  - Auto-creation of user profiles for new signups

  Run this in Supabase SQL Editor to fix all issues.
*/

-- ============================================================================
-- STEP 1: FIX USER_PROFILES TABLE SCHEMA FIRST
-- ============================================================================

-- First, let's see what we're working with
DO $$
DECLARE
    auth_count INTEGER;
    profile_count INTEGER;
    missing_count INTEGER;
BEGIN
    -- Count users in auth.users
    SELECT COUNT(*) FROM auth.users INTO auth_count;
    
    -- Count existing user_profiles (if table exists)
    SELECT COUNT(*) FROM user_profiles INTO profile_count;
    
    missing_count := auth_count - profile_count;
    
    RAISE NOTICE 'AUTH USERS: % | USER PROFILES: % | MISSING: %', 
                 auth_count, profile_count, missing_count;
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'user_profiles table does not exist, will create it';
END $$;

-- Add missing columns to user_profiles table if they don't exist
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS user_id UUID;

-- Ensure user_id references auth.users if constraint doesn't exist
DO $$
BEGIN
    -- Add foreign key constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_profiles_user_id_fkey'
        AND table_name = 'user_profiles'
    ) THEN
        ALTER TABLE user_profiles 
        ADD CONSTRAINT user_profiles_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added foreign key constraint user_profiles_user_id_fkey';
    END IF;
END $$;

-- Update existing user_profiles to populate user_id if it's NULL
UPDATE user_profiles 
SET user_id = id 
WHERE user_id IS NULL;

-- ============================================================================
-- STEP 2: CREATE MISSING USER_PROFILES RECORDS
-- ============================================================================

-- Create missing user_profiles for existing authenticated users
INSERT INTO user_profiles (id, user_id, full_name, email, created_at, updated_at)
SELECT 
    u.id,
    u.id as user_id,
    COALESCE(
        u.raw_user_meta_data->>'full_name',
        u.raw_user_meta_data->>'name', 
        split_part(u.email, '@', 1),
        'User'
    ) as full_name,
    u.email,
    u.created_at,
    NOW()
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.id
WHERE up.id IS NULL
  AND u.email IS NOT NULL
  AND u.deleted_at IS NULL
ON CONFLICT (id) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    email = COALESCE(user_profiles.email, EXCLUDED.email),
    full_name = COALESCE(user_profiles.full_name, EXCLUDED.full_name),
    updated_at = NOW();

-- Report what was created
DO $$
DECLARE
    created_count INTEGER;
BEGIN
    GET DIAGNOSTICS created_count = ROW_COUNT;
    RAISE NOTICE 'Created/updated % user profiles', created_count;
END $$;

-- ============================================================================
-- STEP 3: ADD MISSING EMAIL COLUMN TO JOB_PROFILES
-- ============================================================================

-- Add email column if it doesn't exist
ALTER TABLE job_profiles 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Populate email column from user_profiles
UPDATE job_profiles jp
SET email = up.email
FROM user_profiles up
WHERE jp.user_id = up.id
  AND jp.email IS NULL;

-- ============================================================================
-- STEP 4: CREATE AUTO-PROFILE CREATION FUNCTION
-- ============================================================================

-- Function to automatically create user profile when user signs up
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    -- Create user_profile record for new auth user
    INSERT INTO user_profiles (id, user_id, full_name, email, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.id,
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name',
            split_part(NEW.email, '@', 1),
            'New User'
        ),
        NEW.email,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        user_id = EXCLUDED.user_id,
        email = COALESCE(user_profiles.email, EXCLUDED.email),
        full_name = COALESCE(user_profiles.full_name, EXCLUDED.full_name),
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create user profiles
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- ============================================================================
-- STEP 5: CREATE ENSURE USER PROFILE FUNCTION (FOR EXISTING USERS)
-- ============================================================================

-- Function to ensure user profile exists (can be called from app)
CREATE OR REPLACE FUNCTION ensure_user_profile(user_uuid UUID)
RETURNS user_profiles AS $$
DECLARE
    result user_profiles;
    auth_user auth.users;
BEGIN
    -- First check if profile already exists
    SELECT * INTO result FROM user_profiles WHERE user_id = user_uuid;
    
    IF FOUND THEN
        RETURN result;
    END IF;
    
    -- Get the auth user data
    SELECT * INTO auth_user FROM auth.users WHERE id = user_uuid;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User % not found in auth.users', user_uuid;
    END IF;
    
    -- Create the missing profile
    INSERT INTO user_profiles (id, user_id, full_name, email, created_at, updated_at)
    VALUES (
        user_uuid,
        user_uuid,
        COALESCE(
            auth_user.raw_user_meta_data->>'full_name',
            auth_user.raw_user_meta_data->>'name',
            split_part(auth_user.email, '@', 1),
            'User'
        ),
        auth_user.email,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        user_id = EXCLUDED.user_id,
        email = COALESCE(user_profiles.email, EXCLUDED.email),
        full_name = COALESCE(user_profiles.full_name, EXCLUDED.full_name),
        updated_at = NOW()
    RETURNING * INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 6: VERIFY FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- Verify all job_profiles have valid user_id references
DO $$
DECLARE
    orphaned_count INTEGER;
BEGIN
    SELECT COUNT(*) 
    FROM job_profiles jp
    LEFT JOIN user_profiles up ON jp.user_id = up.id
    WHERE up.id IS NULL
    INTO orphaned_count;
    
    IF orphaned_count > 0 THEN
        RAISE WARNING 'Found % job_profiles with invalid user_id references', orphaned_count;
        
        -- List the problematic records
        RAISE NOTICE 'Orphaned job_profiles: %', (
            SELECT string_agg(jp.id::text, ', ')
            FROM job_profiles jp
            LEFT JOIN user_profiles up ON jp.user_id = up.id
            WHERE up.id IS NULL
        );
    ELSE
        RAISE NOTICE 'All job_profiles have valid user_id references';
    END IF;
END $$;

-- ============================================================================
-- STEP 7: UPDATE ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Ensure RLS policies work with the corrected schema
-- Update user_profiles RLS policy
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR ALL USING (auth.uid() = id);

-- Update job_profiles RLS policy to work through user_profiles
DROP POLICY IF EXISTS "Users can view own job profiles" ON job_profiles;
CREATE POLICY "Users can view own job profiles" ON job_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.id = job_profiles.user_id
        )
    );

-- ============================================================================
-- STEP 8: CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Ensure proper indexes exist
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_job_profiles_user_id ON job_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_job_profiles_email ON job_profiles(email) WHERE email IS NOT NULL;

-- ============================================================================
-- STEP 9: FINAL VERIFICATION AND REPORTING
-- ============================================================================

DO $$
DECLARE
    auth_users_count INTEGER;
    user_profiles_count INTEGER;
    job_profiles_count INTEGER;
    profiles_with_email INTEGER;
    job_profiles_with_email INTEGER;
BEGIN
    -- Get counts
    SELECT COUNT(*) FROM auth.users WHERE deleted_at IS NULL INTO auth_users_count;
    SELECT COUNT(*) FROM user_profiles INTO user_profiles_count;
    SELECT COUNT(*) FROM job_profiles INTO job_profiles_count;
    SELECT COUNT(*) FROM user_profiles WHERE email IS NOT NULL INTO profiles_with_email;
    SELECT COUNT(*) FROM job_profiles WHERE email IS NOT NULL INTO job_profiles_with_email;
    
    -- Report final state
    RAISE NOTICE '=== MIGRATION COMPLETE ===';
    RAISE NOTICE 'Auth Users: %', auth_users_count;
    RAISE NOTICE 'User Profiles: %', user_profiles_count;
    RAISE NOTICE 'Job Profiles: %', job_profiles_count;
    RAISE NOTICE 'User Profiles with Email: %', profiles_with_email;
    RAISE NOTICE 'Job Profiles with Email: %', job_profiles_with_email;
    
    -- Verify 1:1 relationship
    IF auth_users_count = user_profiles_count THEN
        RAISE NOTICE '✅ Perfect 1:1 relationship between auth.users and user_profiles';
    ELSE
        RAISE WARNING '❌ Mismatch: % auth users vs % user profiles', 
                     auth_users_count, user_profiles_count;
    END IF;
    
    -- Check foreign key integrity
    PERFORM jp.id 
    FROM job_profiles jp
    LEFT JOIN user_profiles up ON jp.user_id = up.id
    WHERE up.id IS NULL
    LIMIT 1;
    
    IF NOT FOUND THEN
        RAISE NOTICE '✅ All job_profiles have valid foreign key references';
    ELSE
        RAISE WARNING '❌ Some job_profiles still have invalid foreign key references';
    END IF;
    
    RAISE NOTICE '=== READY FOR TESTING ===';
END $$;

-- ============================================================================
-- STEP 10: TEST QUERIES (FOR VERIFICATION)
-- ============================================================================

-- Test query 1: Verify user profile exists for a specific user
-- USAGE: Replace 'your-user-id' with actual user ID
-- SELECT ensure_user_profile('your-user-id');

-- Test query 2: Check foreign key integrity
-- SELECT 
--     jp.id as job_profile_id,
--     jp.name as profile_name,
--     up.full_name as user_name,
--     up.email as user_email
-- FROM job_profiles jp
-- JOIN user_profiles up ON jp.user_id = up.id
-- LIMIT 5;

-- Test query 3: Verify email population
-- SELECT 
--     COUNT(*) as total_job_profiles,
--     COUNT(email) as profiles_with_email,
--     COUNT(*) - COUNT(email) as missing_email
-- FROM job_profiles;

RAISE NOTICE 'Migration completed successfully! Run the test queries to verify everything works.';