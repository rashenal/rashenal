-- Migration: Create tables for job board scraping configuration and monitoring
-- Purpose: Support LinkedIn scraping with proper rate limiting and user preferences

BEGIN;

-- Create scraping preferences table
CREATE TABLE IF NOT EXISTS scraping_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- LinkedIn specific settings
    linkedin_enabled BOOLEAN DEFAULT true,
    linkedin_use_login BOOLEAN DEFAULT false,
    linkedin_email TEXT,
    linkedin_rate_limit_ms INTEGER DEFAULT 3000,
    linkedin_max_results_per_search INTEGER DEFAULT 50,
    linkedin_user_agent_rotation BOOLEAN DEFAULT true,
    
    -- General scraping settings
    respect_rate_limits BOOLEAN DEFAULT true,
    enable_anti_bot_measures BOOLEAN DEFAULT true,
    max_concurrent_requests INTEGER DEFAULT 1,
    default_delay_ms INTEGER DEFAULT 2000,
    max_retries INTEGER DEFAULT 3,
    
    -- Privacy settings
    store_raw_html BOOLEAN DEFAULT false,
    anonymize_searches BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create scraping request log table for monitoring and rate limiting
CREATE TABLE IF NOT EXISTS scraping_request_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    job_board TEXT NOT NULL, -- 'linkedin', 'indeed', etc.
    status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'rate_limited', 'blocked')),
    
    -- Request details
    url TEXT,
    results_count INTEGER,
    error_message TEXT,
    response_time_ms INTEGER,
    
    -- Request headers and user agent used (for debugging)
    user_agent TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_scraping_preferences_user_id ON scraping_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_scraping_request_log_user_id ON scraping_request_log(user_id);
CREATE INDEX IF NOT EXISTS idx_scraping_request_log_job_board ON scraping_request_log(job_board);
CREATE INDEX IF NOT EXISTS idx_scraping_request_log_created_at ON scraping_request_log(created_at);
CREATE INDEX IF NOT EXISTS idx_scraping_request_log_user_board_date ON scraping_request_log(user_id, job_board, created_at);

-- Enable RLS (Row Level Security)
ALTER TABLE scraping_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraping_request_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for scraping_preferences
CREATE POLICY "Users can view their own scraping preferences" ON scraping_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scraping preferences" ON scraping_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scraping preferences" ON scraping_preferences
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scraping preferences" ON scraping_preferences
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for scraping_request_log
CREATE POLICY "Users can view their own scraping request logs" ON scraping_request_log
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert scraping request logs" ON scraping_request_log
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at on scraping_preferences
CREATE TRIGGER update_scraping_preferences_updated_at 
    BEFORE UPDATE ON scraping_preferences 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default scraping preferences for existing users (optional)
-- This will create safe default settings for all existing users
INSERT INTO scraping_preferences (
    user_id,
    linkedin_enabled,
    linkedin_use_login,
    linkedin_rate_limit_ms,
    linkedin_max_results_per_search,
    linkedin_user_agent_rotation,
    respect_rate_limits,
    enable_anti_bot_measures,
    max_concurrent_requests,
    default_delay_ms,
    max_retries,
    store_raw_html,
    anonymize_searches
)
SELECT 
    u.id,
    true,  -- linkedin_enabled
    false, -- linkedin_use_login (never store credentials by default)
    3000,  -- linkedin_rate_limit_ms (3 seconds)
    50,    -- linkedin_max_results_per_search
    true,  -- linkedin_user_agent_rotation
    true,  -- respect_rate_limits
    true,  -- enable_anti_bot_measures
    1,     -- max_concurrent_requests (conservative)
    2000,  -- default_delay_ms (2 seconds)
    3,     -- max_retries
    false, -- store_raw_html (privacy)
    true   -- anonymize_searches (privacy)
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM scraping_preferences sp WHERE sp.user_id = u.id
);

COMMIT;

-- Add helpful comments
COMMENT ON TABLE scraping_preferences IS 'User preferences for job board scraping with safety and privacy controls';
COMMENT ON TABLE scraping_request_log IS 'Log of all scraping requests for monitoring and rate limiting';

COMMENT ON COLUMN scraping_preferences.linkedin_rate_limit_ms IS 'Minimum milliseconds between LinkedIn requests (min 1000)';
COMMENT ON COLUMN scraping_preferences.max_concurrent_requests IS 'Maximum concurrent scraping requests (max 3)';
COMMENT ON COLUMN scraping_preferences.linkedin_max_results_per_search IS 'Maximum results per LinkedIn search (max 100)';
COMMENT ON COLUMN scraping_preferences.store_raw_html IS 'Whether to store raw HTML (disabled for privacy)';
COMMENT ON COLUMN scraping_preferences.anonymize_searches IS 'Whether to anonymize search queries in logs';

COMMENT ON COLUMN scraping_request_log.status IS 'Request outcome: success, failed, rate_limited, blocked';
COMMENT ON COLUMN scraping_request_log.response_time_ms IS 'Response time in milliseconds for performance monitoring';

COMMIT;