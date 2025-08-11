-- Comprehensive migration to fix missing columns and tables for Rashenal job search functionality
-- This migration addresses schema mismatches between TypeScript code and database

BEGIN;

-- ==============================================
-- 1. CREATE MISSING TABLES
-- ==============================================

-- Create job_board_sources table (referenced by job-discovery-service.ts)
CREATE TABLE IF NOT EXISTS job_board_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    website_url TEXT NOT NULL,
    api_available BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    rate_limit_per_hour INTEGER,
    supports_remote_filter BOOLEAN DEFAULT false,
    supports_salary_filter BOOLEAN DEFAULT false,
    supports_experience_filter BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create enhanced_job_searches table (expected by job-discovery-service.ts)
CREATE TABLE IF NOT EXISTS enhanced_job_searches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES job_profiles(id) ON DELETE CASCADE,
    search_name TEXT NOT NULL,
    
    -- Basic Search Criteria
    job_title TEXT,
    location TEXT,
    remote_type TEXT CHECK (remote_type IN ('onsite', 'hybrid', 'remote', 'flexible')),
    employment_type TEXT[],
    experience_level TEXT CHECK (experience_level IN ('entry', 'junior', 'mid', 'senior', 'principal', 'executive')),
    salary_min INTEGER,
    salary_max INTEGER,
    salary_currency TEXT DEFAULT 'USD',
    
    -- Advanced Criteria
    company_size TEXT[],
    industry_sectors TEXT[],
    required_skills TEXT[],
    preferred_skills TEXT[], -- MISSING COLUMN #1
    work_authorization TEXT,
    visa_sponsorship BOOLEAN,
    
    -- Job Board Selection
    selected_job_boards TEXT[] DEFAULT ARRAY['linkedin', 'indeed'],
    
    -- Search Configuration
    search_frequency TEXT DEFAULT 'manual' CHECK (search_frequency IN ('manual', 'daily', 'weekly', 'bi_weekly')),
    scheduled_time TIME,
    timezone TEXT DEFAULT 'UTC',
    max_results_per_board INTEGER DEFAULT 50,
    
    -- AI Configuration
    ai_matching_enabled BOOLEAN DEFAULT true,
    minimum_match_score DECIMAL(3,2) DEFAULT 0.6 CHECK (minimum_match_score >= 0 AND minimum_match_score <= 1), -- MISSING COLUMN #2
    
    -- Status and Metadata
    is_active BOOLEAN DEFAULT true,
    last_executed_at TIMESTAMP WITH TIME ZONE,
    next_execution_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create job_search_results table (expected by job-discovery-service.ts)
CREATE TABLE IF NOT EXISTS job_search_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    search_id UUID NOT NULL REFERENCES enhanced_job_searches(id) ON DELETE CASCADE,
    job_board_source_id UUID NOT NULL REFERENCES job_board_sources(id) ON DELETE CASCADE,
    
    -- Job Details
    job_title TEXT NOT NULL,
    company_name TEXT NOT NULL,
    job_description TEXT,
    location TEXT,
    remote_type TEXT,
    employment_type TEXT,
    experience_level TEXT,
    salary_min INTEGER,
    salary_max INTEGER,
    salary_currency TEXT DEFAULT 'USD',
    
    -- Source Information
    original_job_id TEXT,
    job_url TEXT NOT NULL,
    posted_date TIMESTAMP WITH TIME ZONE,
    application_deadline TIMESTAMP WITH TIME ZONE,
    
    -- AI Analysis
    ai_match_score DECIMAL(3,2) CHECK (ai_match_score >= 0 AND ai_match_score <= 1),
    ai_analysis JSONB,
    skill_matches TEXT[],
    missing_skills TEXT[],
    
    -- User Actions
    is_bookmarked BOOLEAN DEFAULT false,
    is_dismissed BOOLEAN DEFAULT false,
    viewed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent duplicate job postings per search
    UNIQUE(search_id, original_job_id)
);

-- Create search_execution_log table (expected by job-discovery-service.ts)
CREATE TABLE IF NOT EXISTS search_execution_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    search_id UUID NOT NULL REFERENCES enhanced_job_searches(id) ON DELETE CASCADE,
    execution_type TEXT NOT NULL CHECK (execution_type IN ('manual', 'scheduled', 'test')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
    total_results_found INTEGER DEFAULT 0,
    results_by_board JSONB DEFAULT '{}',
    error_message TEXT,
    error_details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- 2. ADD MISSING COLUMNS TO EXISTING TABLES
-- ==============================================

-- Add job_board column to scraping_request_log if it doesn't exist
-- (The column exists in the migration but let's make sure)
DO $$
BEGIN
    -- Check if job_board column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'scraping_request_log' 
        AND column_name = 'job_board'
    ) THEN
        ALTER TABLE scraping_request_log ADD COLUMN job_board TEXT NOT NULL DEFAULT 'unknown';
        ALTER TABLE scraping_request_log ADD CONSTRAINT check_job_board_values 
            CHECK (job_board IN ('linkedin', 'indeed', 'glassdoor', 'monster', 'ziprecruiter', 'totaljobs', 'reed', 'stackoverflow', 'unknown'));
    END IF;
END
$$;

-- Add missing columns to job_profiles if they don't exist
DO $$
BEGIN
    -- Add name column (referenced in job-discovery-service.ts)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'job_profiles' 
        AND column_name = 'name' AND table_schema = 'public'
    ) THEN
        ALTER TABLE job_profiles ADD COLUMN name TEXT;
        -- Populate name with title for existing records
        UPDATE job_profiles SET name = title WHERE name IS NULL;
        -- Make name required
        ALTER TABLE job_profiles ALTER COLUMN name SET NOT NULL;
    END IF;

    -- Add bio column (referenced in job-discovery-service.ts)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'job_profiles' 
        AND column_name = 'bio' AND table_schema = 'public'
    ) THEN
        ALTER TABLE job_profiles ADD COLUMN bio TEXT;
    END IF;

    -- Add summary column (referenced in job-discovery-service.ts)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'job_profiles' 
        AND column_name = 'summary' AND table_schema = 'public'
    ) THEN
        ALTER TABLE job_profiles ADD COLUMN summary TEXT;
    END IF;

    -- Add location column (single location, not array)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'job_profiles' 
        AND column_name = 'location' AND table_schema = 'public'
    ) THEN
        ALTER TABLE job_profiles ADD COLUMN location TEXT;
        -- Populate from locations array for existing records
        UPDATE job_profiles SET location = locations[1] WHERE location IS NULL AND array_length(locations, 1) > 0;
    END IF;
END
$$;

-- ==============================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- ==============================================


-- make sure columns for indesxes exist before creating indexes

-- Add all missing columns to job_search_results
ALTER TABLE job_search_results 
ADD COLUMN IF NOT EXISTS is_dismissed BOOLEAN DEFAULT false;

ALTER TABLE job_search_results 
ADD COLUMN IF NOT EXISTS is_bookmarked BOOLEAN DEFAULT false;

ALTER TABLE job_search_results 
ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMPTZ;

ALTER TABLE job_search_results 
ADD COLUMN IF NOT EXISTS ai_match_score DECIMAL;

ALTER TABLE job_search_results 
ADD COLUMN IF NOT EXISTS ai_analysis JSONB;

ALTER TABLE job_search_results 
ADD COLUMN IF NOT EXISTS skill_matches TEXT[];

ALTER TABLE job_search_results 
ADD COLUMN IF NOT EXISTS missing_skills TEXT[];
-- Indexes for job_board_sources
CREATE INDEX IF NOT EXISTS idx_job_board_sources_active ON job_board_sources(is_active);
CREATE INDEX IF NOT EXISTS idx_job_board_sources_name ON job_board_sources(name);

-- Indexes for enhanced_job_searches
CREATE INDEX IF NOT EXISTS idx_enhanced_job_searches_user_id ON enhanced_job_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_job_searches_profile_id ON enhanced_job_searches(profile_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_job_searches_active ON enhanced_job_searches(is_active);
CREATE INDEX IF NOT EXISTS idx_enhanced_job_searches_frequency ON enhanced_job_searches(search_frequency);


-- Indexes for job_search_results
CREATE INDEX IF NOT EXISTS idx_job_search_results_search_id ON job_search_results(search_id);
CREATE INDEX IF NOT EXISTS idx_job_search_results_job_board_source_id ON job_search_results(job_board_source_id);
CREATE INDEX IF NOT EXISTS idx_job_search_results_match_score ON job_search_results(ai_match_score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_job_search_results_bookmarked ON job_search_results(is_bookmarked) WHERE is_bookmarked = true;

CREATE INDEX IF NOT EXISTS idx_job_search_results_dismissed ON job_search_results(is_dismissed);
CREATE INDEX IF NOT EXISTS idx_job_search_results_posted_date ON job_search_results(posted_date DESC);

-- Indexes for search_execution_log
CREATE INDEX IF NOT EXISTS idx_search_execution_log_search_id ON search_execution_log(search_id);
CREATE INDEX IF NOT EXISTS idx_search_execution_log_started_at ON search_execution_log(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_execution_log_status ON search_execution_log(status);

-- ==============================================
-- 4. ENABLE ROW LEVEL SECURITY
-- ==============================================

-- Enable RLS on new tables
ALTER TABLE job_board_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE enhanced_job_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_search_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_execution_log ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- 5. CREATE RLS POLICIES
-- ==============================================


-- Skip the rest of the policies to avoid more conflicts for now

-- ==============================================
-- 6. CREATE TRIGGERS FOR UPDATED_AT
-- ==============================================

-- Drop existing triggers if they exist, then recreate them
DROP TRIGGER IF EXISTS update_enhanced_job_searches_updated_at ON enhanced_job_searches;
CREATE TRIGGER update_enhanced_job_searches_updated_at 
    BEFORE UPDATE ON enhanced_job_searches 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_job_search_results_updated_at ON job_search_results;
CREATE TRIGGER update_job_search_results_updated_at 
    BEFORE UPDATE ON job_search_results 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_job_board_sources_updated_at ON job_board_sources;
CREATE TRIGGER update_job_board_sources_updated_at 
    BEFORE UPDATE ON job_board_sources 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- 7. INSERT DEFAULT JOB BOARD SOURCES
-- ==============================================

-- ==============================================
-- 2A. ADD MISSING COLUMNS TO job_board_sources
-- ==============================================

-- Add missing columns to existing job_board_sources table
ALTER TABLE job_board_sources 
ADD COLUMN IF NOT EXISTS display_name TEXT;

ALTER TABLE job_board_sources 
ADD COLUMN IF NOT EXISTS website_url TEXT;

ALTER TABLE job_board_sources 
ADD COLUMN IF NOT EXISTS api_available BOOLEAN DEFAULT false;

ALTER TABLE job_board_sources 
ADD COLUMN IF NOT EXISTS rate_limit_per_hour INTEGER;

ALTER TABLE job_board_sources 
ADD COLUMN IF NOT EXISTS supports_remote_filter BOOLEAN DEFAULT false;

ALTER TABLE job_board_sources 
ADD COLUMN IF NOT EXISTS supports_salary_filter BOOLEAN DEFAULT false;

ALTER TABLE job_board_sources 
ADD COLUMN IF NOT EXISTS supports_experience_filter BOOLEAN DEFAULT false;

ALTER TABLE job_board_sources 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE job_board_sources 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update display_name for existing records where it's null
UPDATE job_board_sources SET display_name = name WHERE display_name IS NULL;

-- Make display_name required after populating it
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'job_board_sources' 
        AND column_name = 'display_name'
        AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE job_board_sources ALTER COLUMN display_name SET NOT NULL;
    END IF;
END
$$;
--- Add unique constraint on name column (skip if already exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'job_board_sources_name_unique'
    ) THEN
        ALTER TABLE job_board_sources
        ADD CONSTRAINT job_board_sources_name_unique UNIQUE (name);
    END IF;
END
$$;

-- Use code column for conflict resolution since it's the primary unique key
/* INSERT INTO job_board_sources (name, code, display_name, website_url, api_available, is_active, rate_limit_per_hour, supports_remote_filter, supports_salary_filter, supports_experience_filter) VALUES
    ('linkedin', 'linkedin', 'LinkedIn', 'https://linkedin.com/jobs', false, true, 10, true, true, true),
    ('indeed', 'indeed', 'Indeed', 'https://indeed.com', false, true, 20, true, true, true),
    ('glassdoor', 'glassdoor', 'Glassdoor', 'https://glassdoor.com', false, true, 15, true, true, true),
    ('monster', 'monster', 'Monster', 'https://monster.com', false, true, 25, true, true, false),
    ('ziprecruiter', 'ziprecruiter', 'ZipRecruiter', 'https://ziprecruiter.com', false, true, 30, true, true, true),
    ('totaljobs', 'totaljobs', 'TotalJobs', 'https://totaljobs.com', false, true, 20, true, true, true),
    ('reed', 'reed', 'Reed', 'https://reed.co.uk', false, true, 25, true, true, true),
    ('stackoverflow', 'stackoverflow', 'Stack Overflow Jobs', 'https://stackoverflow.com/jobs', false, false, 10, true, true, true)
ON CONFLICT (code) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    website_url = EXCLUDED.website_url,
    updated_at = NOW();
*/
COMMIT; 

-- Add helpful comments
COMMENT ON TABLE enhanced_job_searches IS 'Enhanced job search configurations with AI matching and multi-board support';
COMMENT ON TABLE job_search_results IS 'Individual job results from enhanced searches with AI analysis';
COMMENT ON TABLE search_execution_log IS 'Log of search executions for monitoring and debugging';
COMMENT ON TABLE job_board_sources IS 'Available job board sources with their capabilities';

COMMENT ON COLUMN enhanced_job_searches.preferred_skills IS 'Nice-to-have skills (vs required_skills)';
COMMENT ON COLUMN enhanced_job_searches.minimum_match_score IS 'Minimum AI match score to include results (0.0-1.0)';
COMMENT ON COLUMN job_search_results.ai_match_score IS 'AI-calculated match score (0.0-1.0)';
COMMENT ON COLUMN scraping_request_log.job_board IS 'Name of the job board being scraped';