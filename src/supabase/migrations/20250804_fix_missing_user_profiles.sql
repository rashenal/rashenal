/*
  # Fix Missing User Profiles

  This migration fixes the foreign key constraint issue by ensuring all authenticated users 
  have corresponding user_profiles records.

  Issue: job_profiles.user_id references user_profiles(id), but some auth.users don't have 
  corresponding user_profiles records, causing foreign key constraint violations.

  Solution:
  1. Create missing user_profiles for existing auth.users
  2. Improve the trigger function to handle edge cases
  3. Add a function to manually sync users if needed
*/

-- Function to create missing user profiles for existing auth users
CREATE OR REPLACE FUNCTION sync_missing_user_profiles()
RETURNS INTEGER AS $$
DECLARE
  inserted_count INTEGER := 0;
BEGIN
  -- Insert missing user profiles for existing auth users
  INSERT INTO user_profiles (id, email, full_name, created_at, updated_at)
  SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', au.email) as full_name,
    au.created_at,
    NOW() as updated_at
  FROM auth.users au
  LEFT JOIN user_profiles up ON au.id = up.id
  WHERE up.id IS NULL
    AND au.email IS NOT NULL;
  
  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  
  RAISE NOTICE 'Created % missing user profiles', inserted_count;
  RETURN inserted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run the sync function to create missing profiles
SELECT sync_missing_user_profiles();

-- Improve the user profile creation trigger to handle edge cases
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create if profile doesn't exist and user has email
  IF NEW.email IS NOT NULL THEN
    INSERT INTO user_profiles (id, email, full_name, created_at, updated_at)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
      NEW.created_at,
      NEW.updated_at
    )
    ON CONFLICT (id) DO NOTHING; -- Prevent duplicate key errors
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger (it should already exist but let's ensure it's using the updated function)
DROP TRIGGER IF EXISTS create_user_profile_trigger ON auth.users;
CREATE TRIGGER create_user_profile_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();

-- Add a function to manually ensure a user profile exists (for use in application code)
CREATE OR REPLACE FUNCTION ensure_user_profile(user_uuid UUID)
RETURNS UUID AS $$
DECLARE
  profile_id UUID;
  user_email TEXT;
  user_name TEXT;
BEGIN
  -- Check if profile already exists
  SELECT id INTO profile_id FROM user_profiles WHERE id = user_uuid;
  
  IF profile_id IS NOT NULL THEN
    RETURN profile_id;
  END IF;
  
  -- Get user data from auth.users
  SELECT email, raw_user_meta_data->>'full_name' 
  INTO user_email, user_name 
  FROM auth.users 
  WHERE id = user_uuid;
  
  IF user_email IS NULL THEN
    RAISE EXCEPTION 'User with ID % not found in auth.users', user_uuid;
  END IF;
  
  -- Create the missing profile
  INSERT INTO user_profiles (id, email, full_name, created_at, updated_at)
  VALUES (
    user_uuid,
    user_email,
    COALESCE(user_name, user_email),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION sync_missing_user_profiles() TO authenticated;
GRANT EXECUTE ON FUNCTION ensure_user_profile(UUID) TO authenticated;

-- Verify the fix by checking if any auth users are missing profiles
DO $$
DECLARE
  missing_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO missing_count
  FROM auth.users au
  LEFT JOIN user_profiles up ON au.id = up.id
  WHERE up.id IS NULL AND au.email IS NOT NULL;
  
  IF missing_count > 0 THEN
    RAISE WARNING 'Still have % users missing profiles after sync', missing_count;
  ELSE
    RAISE NOTICE 'All authenticated users now have user profiles';
  END IF;
END;
$$;