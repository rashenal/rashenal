-- Plugin System Tables
-- Run this migration first before any code implementation

-- Plugin installations tracking
CREATE TABLE IF NOT EXISTS plugin_installations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plugin_id TEXT NOT NULL,
  plugin_name TEXT NOT NULL,
  plugin_version TEXT NOT NULL,
  settings JSONB DEFAULT '{}',
  permissions TEXT[] DEFAULT '{}',
  enabled BOOLEAN DEFAULT true,
  installed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_loaded TIMESTAMP WITH TIME ZONE,
  load_count INTEGER DEFAULT 0,
  UNIQUE(user_id, plugin_id)
);

-- Plugin data storage (sandboxed)
CREATE TABLE IF NOT EXISTS plugin_storage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plugin_id TEXT NOT NULL,
  key TEXT NOT NULL,
  value JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, plugin_id, key)
);

-- Plugin marketplace metadata
CREATE TABLE IF NOT EXISTS plugin_marketplace (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plugin_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  author TEXT,
  category TEXT,
  tags TEXT[],
  version TEXT,
  min_platform_version TEXT,
  pricing_model TEXT DEFAULT 'free', -- 'free', 'paid', 'freemium'
  price_monthly DECIMAL(10,2),
  downloads INTEGER DEFAULT 0,
  rating DECIMAL(3,2),
  featured BOOLEAN DEFAULT false,
  default_permissions TEXT[],
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE plugin_installations ENABLE ROW LEVEL SECURITY;
ALTER TABLE plugin_storage ENABLE ROW LEVEL SECURITY;
ALTER TABLE plugin_marketplace ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own plugin installations"
  ON plugin_installations FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own plugin storage"
  ON plugin_storage FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Everyone can view marketplace"
  ON plugin_marketplace FOR SELECT
  USING (true);

-- Indexes for performance
CREATE INDEX idx_plugin_installations_user_id ON plugin_installations(user_id);
CREATE INDEX idx_plugin_storage_user_plugin ON plugin_storage(user_id, plugin_id);
CREATE INDEX idx_plugin_marketplace_category ON plugin_marketplace(category);

-- Insert sample marketplace data
INSERT INTO plugin_marketplace (
  plugin_id, name, description, author, category, tags, version,
  featured, default_permissions
) VALUES (
  'ai.asista.motivation',
  'Motivation Booster',
  'AI-powered motivational support that adapts to your energy and goals',
  'Asista.AI',
  'wellness',
  ARRAY['motivation', 'wellness', 'ai', 'energy-aware'],
  '1.0.0',
  true,
  ARRAY['tasks:read', 'habits:read', 'goals:read', 'ai:chat', 'notifications:send']
) ON CONFLICT (plugin_id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();