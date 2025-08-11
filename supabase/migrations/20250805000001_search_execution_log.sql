-- Create search_execution_log table for monitoring job search executions
-- Migration: 20250805000001_search_execution_log.sql

CREATE TABLE IF NOT EXISTS search_execution_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  search_id UUID NOT NULL REFERENCES enhanced_job_searches(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  execution_time_ms INTEGER,
  total_results_found INTEGER DEFAULT 0,
  error_message TEXT,
  progress_data JSONB DEFAULT '{}'::jsonb,
  activity_log JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_search_execution_log_search_id ON search_execution_log(search_id);
CREATE INDEX IF NOT EXISTS idx_search_execution_log_status ON search_execution_log(status);
CREATE INDEX IF NOT EXISTS idx_search_execution_log_started_at ON search_execution_log(started_at DESC);

-- Enable Row Level Security
ALTER TABLE search_execution_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can view execution logs for their own searches
CREATE POLICY "Users can view their own search execution logs" ON search_execution_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM enhanced_job_searches 
      WHERE enhanced_job_searches.id = search_execution_log.search_id 
      AND enhanced_job_searches.user_id = auth.uid()
    )
  );

-- Users can create execution logs for their own searches
CREATE POLICY "Users can create execution logs for their own searches" ON search_execution_log
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM enhanced_job_searches 
      WHERE enhanced_job_searches.id = search_execution_log.search_id 
      AND enhanced_job_searches.user_id = auth.uid()
    )
  );

-- Users can update execution logs for their own searches
CREATE POLICY "Users can update their own search execution logs" ON search_execution_log
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM enhanced_job_searches 
      WHERE enhanced_job_searches.id = search_execution_log.search_id 
      AND enhanced_job_searches.user_id = auth.uid()
    )
  );

-- Create trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION update_search_execution_log_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_search_execution_log_updated_at 
  BEFORE UPDATE ON search_execution_log
  FOR EACH ROW EXECUTE FUNCTION update_search_execution_log_updated_at();