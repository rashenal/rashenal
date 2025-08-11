/*
  # SAFE User Profiles and Foreign Key Fix
  
  This version creates the user_profiles table if it doesn't exist,
  then adds missing columns, and finally fixes all the foreign key issues.
  
  SAFE to run multiple times - uses IF NOT EXISTS and ADD COLUMN IF NOT EXISTS
*/

-- ============================================================================
-- STEP 1: CREATE USER_PROFILES TABLE IF IT DOESN'T EXIST
-- ============================================================================

-- Create the user_profiles table with all required columns
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================ 
-- STEP 2: ADD ANY MISSING COLUMNS TO EXISTING TABLE
-- ============================================================================

-- Add columns that might be missing from existing user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS user_id UUID,
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_profiles_user_id_fkey'
        AND table_name = 'user_profiles'
    ) THEN
        ALTER TABLE user_profiles 
        ADD CONSTRAINT user_profiles_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added foreign key constraint user_profiles_user_id_fkey';
    ELSE
        RAISE NOTICE 'Foreign key constraint already exists';
    END IF;
END $$;

-- ============================================================================
-- STEP 3: POPULATE MISSING USER PROFILES
-- ============================================================================

-- First, update existing records to ensure user_id is populated
UPDATE user_profiles 
SET user_id = id 
WHERE user_id IS NULL;

-- Now insert missing user profiles for auth users who don't have them
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

-- Report results
DO $$
DECLARE
    auth_count INTEGER;
    profile_count INTEGER;
BEGIN
    SELECT COUNT(*) FROM auth.users WHERE deleted_at IS NULL INTO auth_count;
    SELECT COUNT(*) FROM user_profiles INTO profile_count;
    
    RAISE NOTICE 'Auth users: %, User profiles: %', auth_count, profile_count;
    
    IF auth_count = profile_count THEN
        RAISE NOTICE '✅ SUCCESS: Perfect 1:1 relationship between auth users and user profiles';
    ELSE
        RAISE WARNING '❌ MISMATCH: % auth users vs % user profiles', auth_count, profile_count;
    END IF;
END $$;

-- ============================================================================
-- STEP 4: FIX JOB_PROFILES TABLE
-- ============================================================================

-- Add missing columns to job_profiles table
ALTER TABLE job_profiles 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS summary TEXT,
ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS cover_letter_template TEXT,
ADD COLUMN IF NOT EXISTS cv_tone TEXT,
ADD COLUMN IF NOT EXISTS cover_letter_tone TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS intro_video_url TEXT,
ADD COLUMN IF NOT EXISTS work_preferences JSONB DEFAULT '{}'::jsonb;

-- Populate email column in job_profiles from user_profiles
UPDATE job_profiles jp
SET email = up.email
FROM user_profiles up
WHERE jp.user_id = up.id
  AND jp.email IS NULL
  AND up.email IS NOT NULL;

-- ============================================================================
-- STEP 5: CREATE AUTO-PROFILE FUNCTIONS
-- ============================================================================

-- Function to automatically create user profile when user signs up
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
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

-- Function to ensure user profile exists (callable from app)
CREATE OR REPLACE FUNCTION ensure_user_profile(user_uuid UUID)
RETURNS user_profiles AS $$
DECLARE
    result user_profiles;
    auth_user auth.users;
BEGIN
    -- Check if profile already exists
    SELECT * INTO result FROM user_profiles WHERE id = user_uuid;
    
    IF FOUND THEN
        RETURN result;
    END IF;
    
    -- Get auth user data
    SELECT * INTO auth_user FROM auth.users WHERE id = user_uuid;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User % not found in auth.users', user_uuid;
    END IF;
    
    -- Create missing profile
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

-- Create trigger for auto-profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- ============================================================================
-- STEP 6: UPDATE SECURITY POLICIES
-- ============================================================================

-- User profiles policy
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR ALL USING (auth.uid() = id);

-- Job profiles policy
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
-- STEP 7: CREATE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_job_profiles_user_id ON job_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_job_profiles_email ON job_profiles(email) WHERE email IS NOT NULL;

-- ============================================================================
-- STEP 8: FINAL VERIFICATION
-- ============================================================================

DO $$
DECLARE
    auth_users_count INTEGER;
    user_profiles_count INTEGER;
    job_profiles_count INTEGER;
    orphaned_job_profiles INTEGER;
BEGIN
    -- Get counts
    SELECT COUNT(*) FROM auth.users WHERE deleted_at IS NULL INTO auth_users_count;
    SELECT COUNT(*) FROM user_profiles INTO user_profiles_count;
    SELECT COUNT(*) FROM job_profiles INTO job_profiles_count;
    
    -- Check for orphaned job profiles
    SELECT COUNT(*) 
    FROM job_profiles jp
    LEFT JOIN user_profiles up ON jp.user_id = up.id
    WHERE up.id IS NULL
    INTO orphaned_job_profiles;
    
    -- Report final state
    RAISE NOTICE '=== MIGRATION COMPLETE ===';
    RAISE NOTICE 'Auth Users: %', auth_users_count;
    RAISE NOTICE 'User Profiles: %', user_profiles_count;
    RAISE NOTICE 'Job Profiles: %', job_profiles_count;
    RAISE NOTICE 'Orphaned Job Profiles: %', orphaned_job_profiles;
    
    -- Success checks
    IF auth_users_count = user_profiles_count THEN
        RAISE NOTICE '✅ Perfect 1:1 relationship between auth.users and user_profiles';
    ELSE
        RAISE WARNING '❌ Relationship mismatch: % auth users vs % user profiles', 
                     auth_users_count, user_profiles_count;
    END IF;
    
    IF orphaned_job_profiles = 0 THEN
        RAISE NOTICE '✅ All job_profiles have valid foreign key references';
    ELSE
        RAISE WARNING '❌ Found % job_profiles with invalid foreign key references', orphaned_job_profiles;
    END IF;
    
    -- Check if email columns exist
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_profiles' AND column_name = 'email') THEN
        RAISE NOTICE '✅ Email column exists in job_profiles';
    ELSE
        RAISE WARNING '❌ Email column missing in job_profiles';
    END IF;
    
    -- Check if functions exist
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'ensure_user_profile') THEN
        RAISE NOTICE '✅ ensure_user_profile function created';
    ELSE
        RAISE WARNING '❌ ensure_user_profile function missing';
    END IF;
    
    RAISE NOTICE '=== READY FOR TESTING ===';
    RAISE NOTICE 'You can now test job profile creation in the application';
END $$;