-- Create token_usage_analytics table for optimization tracking
-- This table will store detailed token usage metrics for cost optimization

CREATE TABLE IF NOT EXISTS token_usage_analytics (
    id TEXT PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    operation TEXT NOT NULL,
    agent_id TEXT NOT NULL,
    agent_type TEXT NOT NULL,
    
    -- Token breakdown
    prompt_tokens INTEGER NOT NULL DEFAULT 0,
    completion_tokens INTEGER NOT NULL DEFAULT 0,
    total_tokens INTEGER NOT NULL DEFAULT 0,
    
    -- Cost tracking
    cost DECIMAL(10,6) NOT NULL DEFAULT 0,
    model_type TEXT NOT NULL,
    
    -- Classification
    category TEXT NOT NULL DEFAULT 'routine',
    priority TEXT NOT NULL DEFAULT 'medium',
    
    -- Optimization metrics
    cached BOOLEAN NOT NULL DEFAULT FALSE,
    cache_hit_rate DECIMAL(5,2),
    optimization_applied TEXT[] DEFAULT '{}',
    
    -- Quality metrics
    confidence_score DECIMAL(5,2),
    user_satisfaction INTEGER,
    
    -- Performance
    response_time_ms INTEGER NOT NULL DEFAULT 0,
    retry_count INTEGER NOT NULL DEFAULT 0,
    
    -- Context
    user_id TEXT,
    session_id TEXT,
    request_size_chars INTEGER NOT NULL DEFAULT 0,
    response_size_chars INTEGER NOT NULL DEFAULT 0,
    
    -- Indexing for analytics queries
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_token_analytics_timestamp ON token_usage_analytics(timestamp);
CREATE INDEX IF NOT EXISTS idx_token_analytics_user_id ON token_usage_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_token_analytics_operation ON token_usage_analytics(operation);
CREATE INDEX IF NOT EXISTS idx_token_analytics_model_type ON token_usage_analytics(model_type);
CREATE INDEX IF NOT EXISTS idx_token_analytics_created_at ON token_usage_analytics(created_at);

-- Create composite index for dashboard queries
CREATE INDEX IF NOT EXISTS idx_token_analytics_dashboard ON token_usage_analytics(user_id, created_at DESC, operation);

-- Add RLS policies for user data isolation
ALTER TABLE token_usage_analytics ENABLE ROW LEVEL SECURITY;

-- Users can only see their own analytics data
CREATE POLICY token_analytics_user_policy ON token_usage_analytics
    FOR ALL USING (user_id = auth.uid()::text OR user_id = 'system');

-- Allow system-level analytics for admins (extend as needed)
CREATE POLICY token_analytics_admin_policy ON token_usage_analytics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid()::text 
            AND user_profiles.email = 'rharveybis@hotmail.com'
        )
    );

-- Grant appropriate permissions
GRANT ALL ON token_usage_analytics TO authenticated;
GRANT ALL ON token_usage_analytics TO service_role;