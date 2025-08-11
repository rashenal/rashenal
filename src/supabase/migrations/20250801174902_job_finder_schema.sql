/*
  # Job Finder Module Schema

  1. New Tables
    - `job_profiles`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `title` (text) - Desired job title/role
      - `experience_level` (text) - junior/mid/senior/executive
      - `employment_types` (text[]) - full-time/part-time/contract/remote
      - `desired_salary_min` (integer)
      - `desired_salary_max` (integer)
      - `salary_currency` (text)
      - `locations` (text[]) - Preferred locations
      - `remote_preference` (text) - onsite/hybrid/remote
      - `skills` (text[]) - Key skills
      - `industries` (text[]) - Target industries
      - `company_sizes` (text[]) - startup/small/medium/enterprise
      - `values` (text[]) - Important company values
      - `deal_breakers` (text[]) - Things to avoid
      - `resume_url` (text)
      - `linkedin_url` (text)
      - `portfolio_url` (text)
      - `cover_letter_template` (text)
      - `is_active` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `job_searches`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `profile_id` (uuid, references job_profiles)
      - `search_name` (text)
      - `keywords` (text[])
      - `excluded_keywords` (text[])
      - `sources` (text[]) - indeed/linkedin/glassdoor/etc
      - `search_frequency` (text) - daily/weekly/realtime
      - `last_run_at` (timestamp)
      - `next_run_at` (timestamp)
      - `is_active` (boolean)
      - `notifications_enabled` (boolean)
      - `auto_apply_enabled` (boolean)
      - `min_match_score` (integer) - Minimum AI match score to include
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `job_applications`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `job_match_id` (uuid, references job_matches)
      - `company_name` (text)
      - `job_title` (text)
      - `job_url` (text)
      - `application_status` (text) - draft/applied/screening/interview/offer/rejected/withdrawn
      - `application_date` (timestamp)
      - `deadline_date` (timestamp)
      - `salary_min` (integer)
      - `salary_max` (integer)
      - `salary_currency` (text)
      - `location` (text)
      - `remote_type` (text)
      - `resume_version` (text)
      - `cover_letter` (text)
      - `notes` (text)
      - `interview_dates` (jsonb)
      - `follow_up_dates` (jsonb)
      - `contact_info` (jsonb)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `job_matches`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `job_search_id` (uuid, references job_searches)
      - `job_profile_id` (uuid, references job_profiles)
      - `job_title` (text)
      - `company_name` (text)
      - `job_description` (text)
      - `job_url` (text)
      - `source` (text)
      - `location` (text)
      - `remote_type` (text)
      - `salary_min` (integer)
      - `salary_max` (integer)
      - `salary_currency` (text)
      - `posted_date` (timestamp)
      - `deadline_date` (timestamp)
      - `ai_match_score` (integer) - 0-100
      - `ai_analysis` (jsonb) - Detailed AI evaluation
      - `ai_pros` (text[])
      - `ai_cons` (text[])
      - `ai_suggestions` (text)
      - `user_rating` (integer) - 1-5 stars
      - `is_saved` (boolean)
      - `is_hidden` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for user data access
*/

-- Create job_profiles table
CREATE TABLE IF NOT EXISTS job_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  experience_level TEXT CHECK (experience_level IN ('intern', 'junior', 'mid', 'senior', 'lead', 'executive')),
  employment_types TEXT[] DEFAULT '{}',
  desired_salary_min INTEGER,
  desired_salary_max INTEGER,
  salary_currency TEXT DEFAULT 'USD',
  locations TEXT[] DEFAULT '{}',
  remote_preference TEXT CHECK (remote_preference IN ('onsite', 'hybrid', 'remote', 'flexible')),
  skills TEXT[] DEFAULT '{}',
  industries TEXT[] DEFAULT '{}',
  company_sizes TEXT[] DEFAULT '{}',
  values TEXT[] DEFAULT '{}',
  deal_breakers TEXT[] DEFAULT '{}',
  resume_url TEXT,
  linkedin_url TEXT,
  portfolio_url TEXT,
  cover_letter_template TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create job_searches table
CREATE TABLE IF NOT EXISTS job_searches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES job_profiles(id) ON DELETE CASCADE,
  search_name TEXT NOT NULL,
  keywords TEXT[] DEFAULT '{}',
  excluded_keywords TEXT[] DEFAULT '{}',
  sources TEXT[] DEFAULT '{}',
  search_frequency TEXT DEFAULT 'daily' CHECK (search_frequency IN ('realtime', 'hourly', 'daily', 'weekly')),
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  notifications_enabled BOOLEAN DEFAULT true,
  auto_apply_enabled BOOLEAN DEFAULT false,
  min_match_score INTEGER DEFAULT 70 CHECK (min_match_score >= 0 AND min_match_score <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create job_matches table
CREATE TABLE IF NOT EXISTS job_matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  job_search_id UUID REFERENCES job_searches(id) ON DELETE CASCADE,
  job_profile_id UUID REFERENCES job_profiles(id) ON DELETE CASCADE,
  job_title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  job_description TEXT,
  job_url TEXT NOT NULL,
  source TEXT,
  location TEXT,
  remote_type TEXT,
  salary_min INTEGER,
  salary_max INTEGER,
  salary_currency TEXT DEFAULT 'USD',
  posted_date TIMESTAMPTZ,
  deadline_date TIMESTAMPTZ,
  ai_match_score INTEGER CHECK (ai_match_score >= 0 AND ai_match_score <= 100),
  ai_analysis JSONB DEFAULT '{}'::jsonb,
  ai_pros TEXT[] DEFAULT '{}',
  ai_cons TEXT[] DEFAULT '{}',
  ai_suggestions TEXT,
  user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
  is_saved BOOLEAN DEFAULT false,
  is_hidden BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate job postings
  UNIQUE(user_id, job_url)
);

-- Create job_applications table
CREATE TABLE IF NOT EXISTS job_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  job_match_id UUID REFERENCES job_matches(id) ON DELETE SET NULL,
  company_name TEXT NOT NULL,
  job_title TEXT NOT NULL,
  job_url TEXT,
  application_status TEXT DEFAULT 'draft' CHECK (
    application_status IN (
      'draft', 'applied', 'screening', 'phone_interview', 
      'technical_interview', 'onsite_interview', 'final_interview',
      'offer', 'negotiating', 'accepted', 'rejected', 'withdrawn'
    )
  ),
  application_date TIMESTAMPTZ,
  deadline_date TIMESTAMPTZ,
  salary_min INTEGER,
  salary_max INTEGER,
  salary_currency TEXT DEFAULT 'USD',
  location TEXT,
  remote_type TEXT,
  resume_version TEXT,
  cover_letter TEXT,
  notes TEXT,
  interview_dates JSONB DEFAULT '[]'::jsonb,
  follow_up_dates JSONB DEFAULT '[]'::jsonb,
  contact_info JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_job_profiles_user_id ON job_profiles(user_id);
CREATE INDEX idx_job_searches_user_id ON job_searches(user_id);
CREATE INDEX idx_job_matches_user_id ON job_matches(user_id);
CREATE INDEX idx_job_matches_search_id ON job_matches(job_search_id);
CREATE INDEX idx_job_matches_score ON job_matches(ai_match_score DESC);
CREATE INDEX idx_job_applications_user_id ON job_applications(user_id);
CREATE INDEX idx_job_applications_status ON job_applications(application_status);

-- Enable Row Level Security
ALTER TABLE job_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- job_profiles policies
CREATE POLICY "Users can view their own job profiles" ON job_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own job profiles" ON job_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own job profiles" ON job_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own job profiles" ON job_profiles
  FOR DELETE USING (auth.uid() = user_id);

-- job_searches policies
CREATE POLICY "Users can view their own job searches" ON job_searches
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own job searches" ON job_searches
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own job searches" ON job_searches
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own job searches" ON job_searches
  FOR DELETE USING (auth.uid() = user_id);

-- job_matches policies
CREATE POLICY "Users can view their own job matches" ON job_matches
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own job matches" ON job_matches
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own job matches" ON job_matches
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own job matches" ON job_matches
  FOR DELETE USING (auth.uid() = user_id);

-- job_applications policies
CREATE POLICY "Users can view their own job applications" ON job_applications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own job applications" ON job_applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own job applications" ON job_applications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own job applications" ON job_applications
  FOR DELETE USING (auth.uid() = user_id);

-- Create functions for updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_job_profiles_updated_at BEFORE UPDATE ON job_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_searches_updated_at BEFORE UPDATE ON job_searches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_matches_updated_at BEFORE UPDATE ON job_matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_applications_updated_at BEFORE UPDATE ON job_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();