/*
  # Fix Missing Job Profile Columns

  This migration adds all missing columns to the job_profiles table that are expected
  by the application but may not exist in the actual database.

  Issue: The error "Could not find the 'cover_letter_template' column" suggests
  that some columns from the original schema were not created or were dropped.

  Solution: Add all potentially missing columns with proper defaults and constraints.
*/

-- Add all potentially missing columns to job_profiles table
ALTER TABLE job_profiles 
-- Core profile fields
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS summary TEXT,
ADD COLUMN IF NOT EXISTS cv_tone TEXT,
ADD COLUMN IF NOT EXISTS cover_letter_tone TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS intro_video_url TEXT,
ADD COLUMN IF NOT EXISTS cover_letter_template TEXT,

-- Work preferences and details (may be missing if migration wasn't complete)
ADD COLUMN IF NOT EXISTS work_preferences JSONB DEFAULT '{}'::jsonb,

-- Fields that should exist but might be missing
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

-- Ensure required columns exist with proper constraints
-- Note: We already handled the title->name rename in the previous migration

-- Add missing indexes for better performance
CREATE INDEX IF NOT EXISTS idx_job_profiles_experience_level ON job_profiles(experience_level);
CREATE INDEX IF NOT EXISTS idx_job_profiles_remote_preference ON job_profiles(remote_preference);
CREATE INDEX IF NOT EXISTS idx_job_profiles_is_active ON job_profiles(is_active);

-- Update existing records to have sensible defaults for new columns
UPDATE job_profiles SET
  bio = COALESCE(bio, ''),
  summary = COALESCE(summary, ''),
  skills = COALESCE(skills, '{}'),
  employment_types = COALESCE(employment_types, '{}'),
  locations = COALESCE(locations, '{}'),
  industries = COALESCE(industries, '{}'),
  company_sizes = COALESCE(company_sizes, '{}'),
  values = COALESCE(values, '{}'),
  deal_breakers = COALESCE(deal_breakers, '{}'),
  salary_currency = COALESCE(salary_currency, 'USD'),
  work_preferences = COALESCE(work_preferences, '{}'::jsonb)
WHERE bio IS NULL OR summary IS NULL OR skills IS NULL OR employment_types IS NULL 
   OR locations IS NULL OR industries IS NULL OR company_sizes IS NULL 
   OR values IS NULL OR deal_breakers IS NULL OR salary_currency IS NULL 
   OR work_preferences IS NULL;

-- Verify all expected columns exist
DO $$
DECLARE
    missing_columns TEXT[] := '{}';
    expected_columns TEXT[] := ARRAY[
        'id', 'user_id', 'name', 'email', 'phone', 'location', 'bio', 'summary',
        'skills', 'work_preferences', 'cv_tone', 'cover_letter_tone',
        'avatar_url', 'intro_video_url', 'is_active', 'created_at', 'updated_at',
        'experience_level', 'employment_types', 'desired_salary_min', 'desired_salary_max',
        'salary_currency', 'locations', 'remote_preference', 'industries',
        'company_sizes', 'values', 'deal_breakers', 'resume_url', 'linkedin_url',
        'portfolio_url', 'cover_letter_template'
    ];
    col TEXT;
    exists_check BOOLEAN;
    column_count INTEGER;
BEGIN
    FOREACH col IN ARRAY expected_columns
    LOOP
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'job_profiles' 
            AND column_name = col
            AND table_schema = 'public'
        ) INTO exists_check;
        
        IF NOT exists_check THEN
            missing_columns := array_append(missing_columns, col);
        END IF;
    END LOOP;
    
    IF array_length(missing_columns, 1) > 0 THEN
        RAISE WARNING 'Missing columns in job_profiles: %', array_to_string(missing_columns, ', ');
    ELSE
        RAISE NOTICE 'All expected columns exist in job_profiles table';
    END IF;
    
    -- Show current column count
    SELECT COUNT(*) FROM information_schema.columns 
    WHERE table_name = 'job_profiles' AND table_schema = 'public'
    INTO column_count;
    
    RAISE NOTICE 'job_profiles table now has % columns', column_count;
END $$;