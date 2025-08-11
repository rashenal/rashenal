-- News & Insights Dashboard Schema Migration
-- This migration creates tables for news aggregation, industry insights, and personalized feeds

-- News sources configuration
CREATE TABLE IF NOT EXISTS news_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  feed_url TEXT, -- RSS/API feed URL
  source_type TEXT CHECK (source_type IN ('rss', 'api', 'scraper', 'newsletter')) NOT NULL,
  category TEXT[] NOT NULL DEFAULT '{}', -- ['technology', 'business', 'career', etc.]
  reliability_score DECIMAL(3,2) DEFAULT 0.80, -- 0.00 to 1.00
  is_active BOOLEAN DEFAULT true,
  last_fetched TIMESTAMPTZ,
  fetch_frequency_minutes INTEGER DEFAULT 360, -- 6 hours default
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- News articles/insights storage
CREATE TABLE IF NOT EXISTS news_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES news_sources(id) ON DELETE CASCADE,
  external_id TEXT, -- ID from the source
  title TEXT NOT NULL,
  summary TEXT,
  content TEXT,
  author TEXT,
  published_at TIMESTAMPTZ,
  url TEXT NOT NULL,
  image_url TEXT,
  categories TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  sentiment DECIMAL(3,2), -- -1.00 (negative) to 1.00 (positive)
  relevance_score DECIMAL(3,2), -- 0.00 to 1.00
  engagement_metrics JSONB DEFAULT '{}', -- views, shares, comments, etc.
  ai_summary TEXT, -- AI-generated summary
  ai_key_points TEXT[], -- AI-extracted key points
  ai_action_items TEXT[], -- AI-suggested actions
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source_id, external_id)
);

-- User news preferences
CREATE TABLE IF NOT EXISTS user_news_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  categories TEXT[] DEFAULT '{}', -- Preferred news categories
  keywords TEXT[] DEFAULT '{}', -- Keywords to track
  companies TEXT[] DEFAULT '{}', -- Companies to follow
  industries TEXT[] DEFAULT '{}', -- Industries to monitor
  excluded_sources UUID[] DEFAULT '{}', -- Blocked news sources
  excluded_keywords TEXT[] DEFAULT '{}', -- Keywords to filter out
  notification_settings JSONB DEFAULT '{
    "daily_digest": true,
    "breaking_news": false,
    "weekly_summary": true,
    "digest_time": "09:00",
    "timezone": "UTC"
  }',
  reading_history_retention_days INTEGER DEFAULT 30,
  ai_personalization_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- User's reading history and interactions
CREATE TABLE IF NOT EXISTS news_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id UUID REFERENCES news_articles(id) ON DELETE CASCADE,
  action TEXT CHECK (action IN ('viewed', 'clicked', 'saved', 'shared', 'hidden', 'reported')) NOT NULL,
  reading_time_seconds INTEGER,
  scroll_depth DECIMAL(3,2), -- 0.00 to 1.00 (percentage scrolled)
  feedback TEXT CHECK (feedback IN ('helpful', 'not_helpful', 'irrelevant')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, article_id, action)
);

-- Saved articles collection
CREATE TABLE IF NOT EXISTS saved_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id UUID REFERENCES news_articles(id) ON DELETE CASCADE,
  folder TEXT DEFAULT 'default',
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  priority INTEGER DEFAULT 0, -- 0 (low) to 5 (high)
  is_archived BOOLEAN DEFAULT false,
  reminder_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, article_id)
);

-- Industry insights and trends
CREATE TABLE IF NOT EXISTS industry_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  industry TEXT NOT NULL,
  insight_type TEXT CHECK (insight_type IN ('trend', 'alert', 'opportunity', 'risk', 'update')) NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  impact_level TEXT CHECK (impact_level IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  confidence_score DECIMAL(3,2) DEFAULT 0.70, -- 0.00 to 1.00
  source_articles UUID[] DEFAULT '{}', -- References to news_articles
  data_points JSONB DEFAULT '{}', -- Statistical data supporting the insight
  geographic_scope TEXT[] DEFAULT '{}', -- ['global', 'us', 'europe', etc.]
  affected_roles TEXT[] DEFAULT '{}', -- Job roles affected
  recommended_actions TEXT[] DEFAULT '{}',
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- News digests (daily/weekly summaries)
CREATE TABLE IF NOT EXISTS news_digests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  digest_type TEXT CHECK (digest_type IN ('daily', 'weekly', 'monthly', 'custom')) NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  article_ids UUID[] DEFAULT '{}', -- Featured articles
  insight_ids UUID[] DEFAULT '{}', -- Featured insights
  summary TEXT NOT NULL, -- AI-generated summary
  key_trends TEXT[] DEFAULT '{}',
  action_items TEXT[] DEFAULT '{}',
  personalization_score DECIMAL(3,2), -- How well it matches user preferences
  was_sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ,
  was_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  user_feedback TEXT CHECK (user_feedback IN ('excellent', 'good', 'fair', 'poor')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, digest_type, period_start)
);

-- Trending topics tracking
CREATE TABLE IF NOT EXISTS trending_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL,
  category TEXT,
  mention_count INTEGER DEFAULT 1,
  growth_rate DECIMAL(5,2), -- Percentage growth
  sentiment_avg DECIMAL(3,2),
  geographic_distribution JSONB DEFAULT '{}',
  related_articles UUID[] DEFAULT '{}',
  peak_time TIMESTAMPTZ,
  trending_since TIMESTAMPTZ DEFAULT NOW(),
  trending_until TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_news_articles_published_at ON news_articles(published_at DESC);
CREATE INDEX idx_news_articles_categories ON news_articles USING GIN(categories);
CREATE INDEX idx_news_articles_tags ON news_articles USING GIN(tags);
CREATE INDEX idx_news_articles_relevance ON news_articles(relevance_score DESC);
CREATE INDEX idx_news_interactions_user_article ON news_interactions(user_id, article_id);
CREATE INDEX idx_news_interactions_created_at ON news_interactions(created_at DESC);
CREATE INDEX idx_saved_articles_user_folder ON saved_articles(user_id, folder);
CREATE INDEX idx_industry_insights_industry ON industry_insights(industry);
CREATE INDEX idx_industry_insights_valid_from ON industry_insights(valid_from DESC);
CREATE INDEX idx_news_digests_user_type ON news_digests(user_id, digest_type);
CREATE INDEX idx_trending_topics_category ON trending_topics(category);
CREATE INDEX idx_trending_topics_mention_count ON trending_topics(mention_count DESC);

-- Enable Row Level Security
ALTER TABLE news_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_news_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE industry_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_digests ENABLE ROW LEVEL SECURITY;
ALTER TABLE trending_topics ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- News sources are public read
CREATE POLICY "News sources are viewable by all users" ON news_sources
  FOR SELECT USING (true);

-- News articles are public read
CREATE POLICY "News articles are viewable by all users" ON news_articles
  FOR SELECT USING (true);

-- User preferences are private
CREATE POLICY "Users can manage their own news preferences" ON user_news_preferences
  FOR ALL USING (auth.uid() = user_id);

-- User interactions are private
CREATE POLICY "Users can manage their own news interactions" ON news_interactions
  FOR ALL USING (auth.uid() = user_id);

-- Saved articles are private
CREATE POLICY "Users can manage their own saved articles" ON saved_articles
  FOR ALL USING (auth.uid() = user_id);

-- Industry insights are public read
CREATE POLICY "Industry insights are viewable by all users" ON industry_insights
  FOR SELECT USING (true);

-- News digests are private
CREATE POLICY "Users can view their own news digests" ON news_digests
  FOR SELECT USING (auth.uid() = user_id);

-- Trending topics are public read
CREATE POLICY "Trending topics are viewable by all users" ON trending_topics
  FOR SELECT USING (true);

-- Functions for news management

-- Function to calculate article relevance for a user
CREATE OR REPLACE FUNCTION calculate_article_relevance(
  p_article_id UUID,
  p_user_id UUID
) RETURNS DECIMAL AS $$
DECLARE
  v_relevance DECIMAL := 0.5; -- Base relevance
  v_preferences user_news_preferences;
  v_article news_articles;
BEGIN
  -- Get user preferences
  SELECT * INTO v_preferences FROM user_news_preferences WHERE user_id = p_user_id;
  -- Get article
  SELECT * INTO v_article FROM news_articles WHERE id = p_article_id;
  
  IF v_preferences.id IS NOT NULL AND v_article.id IS NOT NULL THEN
    -- Check category match
    IF v_article.categories && v_preferences.categories THEN
      v_relevance := v_relevance + 0.2;
    END IF;
    
    -- Check keyword match
    IF EXISTS (
      SELECT 1 FROM unnest(v_preferences.keywords) AS keyword
      WHERE v_article.title ILIKE '%' || keyword || '%' 
         OR v_article.summary ILIKE '%' || keyword || '%'
    ) THEN
      v_relevance := v_relevance + 0.2;
    END IF;
    
    -- Check excluded keywords
    IF EXISTS (
      SELECT 1 FROM unnest(v_preferences.excluded_keywords) AS keyword
      WHERE v_article.title ILIKE '%' || keyword || '%'
    ) THEN
      v_relevance := v_relevance - 0.3;
    END IF;
  END IF;
  
  RETURN LEAST(1.0, GREATEST(0.0, v_relevance));
END;
$$ LANGUAGE plpgsql;

-- Function to generate digest
CREATE OR REPLACE FUNCTION generate_news_digest(
  p_user_id UUID,
  p_digest_type TEXT,
  p_period_start TIMESTAMPTZ,
  p_period_end TIMESTAMPTZ
) RETURNS UUID AS $$
DECLARE
  v_digest_id UUID;
  v_article_ids UUID[];
  v_summary TEXT;
BEGIN
  -- Get top relevant articles for the period
  SELECT ARRAY_AGG(id ORDER BY relevance_score DESC, published_at DESC LIMIT 10)
  INTO v_article_ids
  FROM news_articles
  WHERE published_at BETWEEN p_period_start AND p_period_end
    AND relevance_score > 0.5;
  
  -- Generate summary (would be done by AI in reality)
  v_summary := 'Your ' || p_digest_type || ' news digest for ' || 
               to_char(p_period_start, 'Mon DD, YYYY') || ' - ' || 
               to_char(p_period_end, 'Mon DD, YYYY');
  
  -- Create digest
  INSERT INTO news_digests (
    user_id, digest_type, period_start, period_end,
    article_ids, summary, personalization_score
  ) VALUES (
    p_user_id, p_digest_type, p_period_start, p_period_end,
    v_article_ids, v_summary, 0.75
  ) RETURNING id INTO v_digest_id;
  
  RETURN v_digest_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update article relevance scores
CREATE OR REPLACE FUNCTION update_article_relevance() RETURNS TRIGGER AS $$
BEGIN
  -- Update relevance score based on interactions
  UPDATE news_articles
  SET relevance_score = (
    SELECT COALESCE(AVG(
      CASE 
        WHEN action = 'saved' THEN 0.9
        WHEN action = 'shared' THEN 0.8
        WHEN action = 'clicked' THEN 0.6
        WHEN action = 'viewed' THEN 0.4
        WHEN action = 'hidden' THEN 0.1
        ELSE 0.3
      END
    ), 0.5)
    FROM news_interactions
    WHERE article_id = NEW.article_id
  )
  WHERE id = NEW.article_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_article_relevance
  AFTER INSERT OR UPDATE ON news_interactions
  FOR EACH ROW
  EXECUTE FUNCTION update_article_relevance();

-- Add updated_at triggers
CREATE TRIGGER set_updated_at_news_sources
  BEFORE UPDATE ON news_sources
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_news_articles
  BEFORE UPDATE ON news_articles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_user_news_preferences
  BEFORE UPDATE ON user_news_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_saved_articles
  BEFORE UPDATE ON saved_articles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_industry_insights
  BEFORE UPDATE ON industry_insights
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_trending_topics
  BEFORE UPDATE ON trending_topics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();