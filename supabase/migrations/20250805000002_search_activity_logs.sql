-- Create search_activity_logs table for real-time verbose logging
-- Migration: 20250805000002_search_activity_logs.sql

CREATE TABLE IF NOT EXISTS search_activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  execution_id UUID NOT NULL, -- References search_execution_log.id
  log_type TEXT NOT NULL CHECK (log_type IN ('info', 'success', 'error', 'debug', 'warning')),
  message TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_search_activity_logs_execution_id ON search_activity_logs(execution_id);
CREATE INDEX IF NOT EXISTS idx_search_activity_logs_timestamp ON search_activity_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_search_activity_logs_type ON search_activity_logs(log_type);

-- Enable Row Level Security
ALTER TABLE search_activity_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policy - users can view logs for their own search executions
CREATE POLICY "Users can view activity logs for their own searches" ON search_activity_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM search_execution_log 
      INNER JOIN enhanced_job_searches ON search_execution_log.search_id = enhanced_job_searches.id
      WHERE search_execution_log.id = search_activity_logs.execution_id 
      AND enhanced_job_searches.user_id = auth.uid()
    )
  );

-- Create policy for Edge Functions to insert logs
CREATE POLICY "System can create activity logs" ON search_activity_logs
  FOR INSERT WITH CHECK (true); -- Edge Functions run with service role