-- Auto-generated migration to fix schema issues
-- Generated at: 2025-08-05T08:59:37.983Z
-- Issues found: 132

BEGIN;

-- Add missing columns to enhanced_job_searches
--ALTER TABLE enhanced_job_searches ADD COLUMN IF NOT EXISTS id UUID NOT NULL;
ALTER TABLE enhanced_job_searches ADD COLUMN IF NOT EXISTS user_id UUID NOT NULL;
ALTER TABLE enhanced_job_searches ADD COLUMN IF NOT EXISTS profile_id UUID;
ALTER TABLE enhanced_job_searches ADD COLUMN IF NOT EXISTS search_name TEXT NOT NULL;
ALTER TABLE enhanced_job_searches ADD COLUMN IF NOT EXISTS job_title TEXT;
ALTER TABLE enhanced_job_searches ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE enhanced_job_searches ADD COLUMN IF NOT EXISTS remote_type TEXT;
ALTER TABLE enhanced_job_searches ADD COLUMN IF NOT EXISTS employment_type TEXT[];
ALTER TABLE enhanced_job_searches ADD COLUMN IF NOT EXISTS experience_level TEXT;
ALTER TABLE enhanced_job_searches ADD COLUMN IF NOT EXISTS salary_min INTEGER;
ALTER TABLE enhanced_job_searches ADD COLUMN IF NOT EXISTS salary_max INTEGER;
ALTER TABLE enhanced_job_searches ADD COLUMN IF NOT EXISTS salary_currency TEXT;
ALTER TABLE enhanced_job_searches ADD COLUMN IF NOT EXISTS company_size TEXT[];
ALTER TABLE enhanced_job_searches ADD COLUMN IF NOT EXISTS industry_sectors TEXT[];
ALTER TABLE enhanced_job_searches ADD COLUMN IF NOT EXISTS required_skills TEXT[];
ALTER TABLE enhanced_job_searches ADD COLUMN IF NOT EXISTS preferred_skills TEXT[];
ALTER TABLE enhanced_job_searches ADD COLUMN IF NOT EXISTS work_authorization TEXT;
ALTER TABLE enhanced_job_searches ADD COLUMN IF NOT EXISTS visa_sponsorship BOOLEAN;
ALTER TABLE enhanced_job_searches ADD COLUMN IF NOT EXISTS selected_job_boards TEXT[];
ALTER TABLE enhanced_job_searches ADD COLUMN IF NOT EXISTS search_frequency TEXT;
ALTER TABLE enhanced_job_searches ADD COLUMN IF NOT EXISTS scheduled_time TIME;
ALTER TABLE enhanced_job_searches ADD COLUMN IF NOT EXISTS timezone TEXT;
ALTER TABLE enhanced_job_searches ADD COLUMN IF NOT EXISTS max_results_per_board INTEGER;
ALTER TABLE enhanced_job_searches ADD COLUMN IF NOT EXISTS ai_matching_enabled BOOLEAN;
ALTER TABLE enhanced_job_searches ADD COLUMN IF NOT EXISTS IF NOT EXISTS minimum_match_score DECIMAL(3,2);
ALTER TABLE enhanced_job_searches ADD COLUMN IF NOT EXISTS is_active BOOLEAN;
ALTER TABLE enhanced_job_searches ADD COLUMN IF NOT EXISTS last_executed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE enhanced_job_searches ADD COLUMN IF NOT EXISTS next_execution_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE enhanced_job_searches ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE NOT NULL;
ALTER TABLE enhanced_job_searches ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL;

-- Add missing columns to job_board_sources
--ALTER TABLE job_board_sources ADD COLUMN IF NOT EXISTS id UUID NOT NULL;
ALTER TABLE job_board_sources ADD COLUMN IF NOT EXISTS name TEXT NOT NULL;
ALTER TABLE job_board_sources ADD COLUMN IF NOT EXISTS display_name TEXT NOT NULL;
ALTER TABLE job_board_sources ADD COLUMN IF NOT EXISTS website_url TEXT NOT NULL;
ALTER TABLE job_board_sources ADD COLUMN IF NOT EXISTS api_available BOOLEAN;
ALTER TABLE job_board_sources ADD COLUMN IF NOT EXISTS is_active BOOLEAN;
ALTER TABLE job_board_sources ADD COLUMN IF NOT EXISTS rate_limit_per_hour INTEGER;
ALTER TABLE job_board_sources ADD COLUMN IF NOT EXISTS supports_remote_filter BOOLEAN;
ALTER TABLE job_board_sources ADD COLUMN IF NOT EXISTS supports_salary_filter BOOLEAN;
ALTER TABLE job_board_sources ADD COLUMN IF NOT EXISTS supports_experience_filter BOOLEAN;
ALTER TABLE job_board_sources ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE NOT NULL;
ALTER TABLE job_board_sources ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL;

-- Add missing columns to job_search_results
--ALTER TABLE job_search_results ADD COLUMN IF NOT EXISTS id UUID NOT NULL;
ALTER TABLE job_search_results ADD COLUMN IF NOT EXISTS search_id UUID NOT NULL;
ALTER TABLE job_search_results ADD COLUMN IF NOT EXISTS job_board_source_id UUID NOT NULL;
ALTER TABLE job_search_results ADD COLUMN IF NOT EXISTS job_title TEXT NOT NULL;
ALTER TABLE job_search_results ADD COLUMN IF NOT EXISTS company_name TEXT NOT NULL;
ALTER TABLE job_search_results ADD COLUMN IF NOT EXISTS job_description TEXT;
ALTER TABLE job_search_results ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE job_search_results ADD COLUMN IF NOT EXISTS remote_type TEXT;
ALTER TABLE job_search_results ADD COLUMN IF NOT EXISTS employment_type TEXT;
ALTER TABLE job_search_results ADD COLUMN IF NOT EXISTS experience_level TEXT;
ALTER TABLE job_search_results ADD COLUMN IF NOT EXISTS salary_min INTEGER;
ALTER TABLE job_search_results ADD COLUMN IF NOT EXISTS salary_max INTEGER;
ALTER TABLE job_search_results ADD COLUMN IF NOT EXISTS salary_currency TEXT;
ALTER TABLE job_search_results ADD COLUMN IF NOT EXISTS original_job_id TEXT;
ALTER TABLE job_search_results ADD COLUMN IF NOT EXISTS job_url TEXT NOT NULL;
ALTER TABLE job_search_results ADD COLUMN IF NOT EXISTS posted_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE job_search_results ADD COLUMN IF NOT EXISTS application_deadline TIMESTAMP WITH TIME ZONE;
ALTER TABLE job_search_results ADD COLUMN IF NOT EXISTS ai_match_score DECIMAL(3,2);
ALTER TABLE job_search_results ADD COLUMN IF NOT EXISTS ai_analysis JSONB;
ALTER TABLE job_search_results ADD COLUMN IF NOT EXISTS skill_matches TEXT[];
ALTER TABLE job_search_results ADD COLUMN IF NOT EXISTS missing_skills TEXT[];
ALTER TABLE job_search_results ADD COLUMN IF NOT EXISTS is_bookmarked BOOLEAN;
ALTER TABLE job_search_results ADD COLUMN IF NOT EXISTS is_dismissed BOOLEAN;
ALTER TABLE job_search_results ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE job_search_results ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE NOT NULL;
ALTER TABLE job_search_results ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL;

-- Add missing columns to search_execution_log
--ALTER TABLE search_execution_log ADD COLUMN IF NOT EXISTS id UUID NOT NULL;
ALTER TABLE search_execution_log ADD COLUMN IF NOT EXISTS search_id UUID NOT NULL;
ALTER TABLE search_execution_log ADD COLUMN IF NOT EXISTS execution_type TEXT NOT NULL;
ALTER TABLE search_execution_log ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE search_execution_log ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE search_execution_log ADD COLUMN IF NOT EXISTS status TEXT NOT NULL;
ALTER TABLE search_execution_log ADD COLUMN IF NOT EXISTS total_results_found INTEGER;
ALTER TABLE search_execution_log ADD COLUMN IF NOT EXISTS results_by_board JSONB;
ALTER TABLE search_execution_log ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE search_execution_log ADD COLUMN IF NOT EXISTS error_details JSONB;
ALTER TABLE search_execution_log ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE NOT NULL;

-- Add missing columns to scraping_preferences
--ALTER TABLE scraping_preferences ADD COLUMN IF NOT EXISTS id UUID NOT NULL;
ALTER TABLE scraping_preferences ADD COLUMN IF NOT EXISTS user_id UUID NOT NULL;
ALTER TABLE scraping_preferences ADD COLUMN IF NOT EXISTS linkedin_enabled BOOLEAN;
ALTER TABLE scraping_preferences ADD COLUMN IF NOT EXISTS linkedin_use_login BOOLEAN;
ALTER TABLE scraping_preferences ADD COLUMN IF NOT EXISTS linkedin_email TEXT;
ALTER TABLE scraping_preferences ADD COLUMN IF NOT EXISTS linkedin_rate_limit_ms INTEGER;
ALTER TABLE scraping_preferences ADD COLUMN IF NOT EXISTS linkedin_max_results_per_search INTEGER;
ALTER TABLE scraping_preferences ADD COLUMN IF NOT EXISTS linkedin_user_agent_rotation BOOLEAN;
ALTER TABLE scraping_preferences ADD COLUMN IF NOT EXISTS respect_rate_limits BOOLEAN;
ALTER TABLE scraping_preferences ADD COLUMN IF NOT EXISTS enable_anti_bot_measures BOOLEAN;
ALTER TABLE scraping_preferences ADD COLUMN IF NOT EXISTS max_concurrent_requests INTEGER;
ALTER TABLE scraping_preferences ADD COLUMN IF NOT EXISTS default_delay_ms INTEGER;
ALTER TABLE scraping_preferences ADD COLUMN IF NOT EXISTS max_retries INTEGER;
ALTER TABLE scraping_preferences ADD COLUMN IF NOT EXISTS store_raw_html BOOLEAN;
ALTER TABLE scraping_preferences ADD COLUMN IF NOT EXISTS anonymize_searches BOOLEAN;
ALTER TABLE scraping_preferences ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE NOT NULL;
ALTER TABLE scraping_preferences ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL;

-- Add missing columns to scraping_request_log
--ALTER TABLE scraping_request_log ADD COLUMN IF NOT EXISTS id UUID NOT NULL;
ALTER TABLE scraping_request_log ADD COLUMN IF NOT EXISTS user_id UUID NOT NULL;
ALTER TABLE scraping_request_log ADD COLUMN IF NOT EXISTS job_board TEXT NOT NULL;
ALTER TABLE scraping_request_log ADD COLUMN IF NOT EXISTS status TEXT NOT NULL;
ALTER TABLE scraping_request_log ADD COLUMN IF NOT EXISTS url TEXT;
ALTER TABLE scraping_request_log ADD COLUMN IF NOT EXISTS results_count INTEGER;
ALTER TABLE scraping_request_log ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE scraping_request_log ADD COLUMN IF NOT EXISTS response_time_ms INTEGER;
ALTER TABLE scraping_request_log ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE scraping_request_log ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE NOT NULL;

-- Add missing columns to job_profiles
--ALTER TABLE job_profiles ADD COLUMN IF NOT EXISTS id UUID NOT NULL;
ALTER TABLE job_profiles ADD COLUMN IF NOT EXISTS user_id UUID NOT NULL;
ALTER TABLE job_profiles ADD COLUMN IF NOT EXISTS name TEXT NOT NULL;
ALTER TABLE job_profiles ADD COLUMN IF NOT EXISTS title TEXT NOT NULL;
ALTER TABLE job_profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE job_profiles ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE job_profiles ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE job_profiles ADD COLUMN IF NOT EXISTS experience_level TEXT;
ALTER TABLE job_profiles ADD COLUMN IF NOT EXISTS employment_types TEXT[];
ALTER TABLE job_profiles ADD COLUMN IF NOT EXISTS desired_salary_min INTEGER;
ALTER TABLE job_profiles ADD COLUMN IF NOT EXISTS desired_salary_max INTEGER;
ALTER TABLE job_profiles ADD COLUMN IF NOT EXISTS salary_currency TEXT;
ALTER TABLE job_profiles ADD COLUMN IF NOT EXISTS locations TEXT[];
ALTER TABLE job_profiles ADD COLUMN IF NOT EXISTS remote_preference TEXT;
ALTER TABLE job_profiles ADD COLUMN IF NOT EXISTS skills TEXT[];
ALTER TABLE job_profiles ADD COLUMN IF NOT EXISTS industries TEXT[];
ALTER TABLE job_profiles ADD COLUMN IF NOT EXISTS company_sizes TEXT[];
ALTER TABLE job_profiles ADD COLUMN IF NOT EXISTS values TEXT[];
ALTER TABLE job_profiles ADD COLUMN IF NOT EXISTS deal_breakers TEXT[];
ALTER TABLE job_profiles ADD COLUMN IF NOT EXISTS resume_url TEXT;
ALTER TABLE job_profiles ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE job_profiles ADD COLUMN IF NOT EXISTS portfolio_url TEXT;
ALTER TABLE job_profiles ADD COLUMN IF NOT EXISTS cover_letter_template TEXT;
ALTER TABLE job_profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN;
ALTER TABLE job_profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE NOT NULL;
ALTER TABLE job_profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL;

COMMIT;