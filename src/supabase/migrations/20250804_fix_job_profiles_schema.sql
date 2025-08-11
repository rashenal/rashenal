/*
  # Fix Job Profiles Schema Mismatch

  This migration fixes the schema mismatch between the database and TypeScript interface.
  
  Issues:
  1. Database has 'title' field but interface expects 'name'
  2. Database is missing email, phone, location fields that are in the interface
  3. Need to ensure consistency between schema and code

  Solution:
  1. Add missing columns (email, phone, location) 
  2. Rename 'title' to 'name' to match interface
  3. Update constraints and indexes as needed
*/

-- Add missing columns to job_profiles table
ALTER TABLE job_profiles 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS location TEXT;

-- Rename title column to name to match TypeScript interface
-- Check if the column rename is needed
DO $$
BEGIN
    -- Check if title column exists and name doesn't
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'job_profiles' AND column_name = 'title')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'job_profiles' AND column_name = 'name') 
    THEN
        -- Rename title to name
        ALTER TABLE job_profiles RENAME COLUMN title TO name;
        RAISE NOTICE 'Renamed title column to name in job_profiles table';
    ELSE
        RAISE NOTICE 'Column rename not needed - name column already exists or title column missing';
    END IF;
END $$;

-- Ensure name column is NOT NULL (it was required as title)
ALTER TABLE job_profiles 
ALTER COLUMN name SET NOT NULL;

-- Update any existing records that might have null values
UPDATE job_profiles 
SET name = COALESCE(name, 'Untitled Profile')
WHERE name IS NULL OR name = '';

-- Create index on user_id if it doesn't exist (for performance)
CREATE INDEX IF NOT EXISTS idx_job_profiles_user_id ON job_profiles(user_id);

-- Create index on email if it doesn't exist (for lookups)
CREATE INDEX IF NOT EXISTS idx_job_profiles_email ON job_profiles(email) WHERE email IS NOT NULL;

-- Verify the schema matches expectations
DO $$
DECLARE
    title_exists BOOLEAN;
    name_exists BOOLEAN;
    email_exists BOOLEAN;
    phone_exists BOOLEAN;
    location_exists BOOLEAN;
BEGIN
    -- Check for expected columns
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'job_profiles' AND column_name = 'title'
    ) INTO title_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'job_profiles' AND column_name = 'name'
    ) INTO name_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'job_profiles' AND column_name = 'email'
    ) INTO email_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'job_profiles' AND column_name = 'phone'
    ) INTO phone_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'job_profiles' AND column_name = 'location'
    ) INTO location_exists;
    
    -- Report results
    RAISE NOTICE 'Schema verification:';
    RAISE NOTICE '  title column exists: %', title_exists;
    RAISE NOTICE '  name column exists: %', name_exists;
    RAISE NOTICE '  email column exists: %', email_exists;
    RAISE NOTICE '  phone column exists: %', phone_exists;
    RAISE NOTICE '  location column exists: %', location_exists;
    
    IF name_exists AND email_exists AND phone_exists AND location_exists THEN
        RAISE NOTICE 'Schema is now consistent with TypeScript interface';
    ELSE
        RAISE WARNING 'Schema may still have inconsistencies';
    END IF;
END $$;