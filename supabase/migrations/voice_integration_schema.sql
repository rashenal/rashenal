-- Voice Agent and WhatsApp Integration Database Schema
-- Add voice-related tables to Rashenal database

-- Voice agent configurations
CREATE TABLE IF NOT EXISTS voice_agents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  config JSONB NOT NULL DEFAULT '{}',
  markdown_content TEXT,
  is_active BOOLEAN DEFAULT true,
  platforms TEXT[] DEFAULT ARRAY['web'],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User voice profiles for custom voices
CREATE TABLE IF NOT EXISTS user_voice_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  voice_id TEXT NOT NULL,
  name TEXT,
  sample_url TEXT,
  voice_data JSONB DEFAULT '{}',
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, voice_id)
);

-- WhatsApp conversations log
CREATE TABLE IF NOT EXISTS whatsapp_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_message TEXT,
  bot_response TEXT,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'voice', 'image', 'button')),
  platform TEXT DEFAULT 'whatsapp',
  metadata JSONB DEFAULT '{}',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Voice usage logs for analytics and billing
CREATE TABLE IF NOT EXISTS voice_usage_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('synthesize', 'transcribe', 'clone')),
  text_length INTEGER,
  audio_duration INTEGER,
  voice_config JSONB DEFAULT '{}',
  cost_credits DECIMAL(10,4) DEFAULT 0,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Voice agent deployments
CREATE TABLE IF NOT EXISTS voice_agent_deployments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  voice_agent_id UUID REFERENCES voice_agents(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('web', 'whatsapp', 'watch', 'api')),
  endpoint_url TEXT,
  config JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'error')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(voice_agent_id, platform)
);

-- Add phone number to user profiles for WhatsApp integration
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS voice_agent_config JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS whatsapp_enabled BOOLEAN DEFAULT false;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_voice_agents_user_id ON voice_agents(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_agents_active ON voice_agents(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_voice_profiles_user_id ON user_voice_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_profiles_status ON user_voice_profiles(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_phone ON whatsapp_conversations(phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_user_id ON whatsapp_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_timestamp ON whatsapp_conversations(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_voice_usage_user_id ON voice_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_usage_timestamp ON voice_usage_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_voice_deployments_agent_id ON voice_agent_deployments(voice_agent_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_phone ON user_profiles(phone) WHERE phone IS NOT NULL;

-- Row Level Security (RLS) policies

-- Voice agents - users can only access their own agents
ALTER TABLE voice_agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own voice agents" ON voice_agents
  FOR ALL USING (auth.uid() = user_id);

-- Voice profiles - users can only access their own profiles
ALTER TABLE user_voice_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own voice profiles" ON user_voice_profiles
  FOR ALL USING (auth.uid() = user_id);

-- WhatsApp conversations - users can access their own conversations
ALTER TABLE whatsapp_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access their own WhatsApp conversations" ON whatsapp_conversations
  FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

-- Voice usage logs - users can access their own usage
ALTER TABLE voice_usage_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own voice usage" ON voice_usage_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Voice deployments - users can manage deployments for their agents
ALTER TABLE voice_agent_deployments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage deployments for their voice agents" ON voice_agent_deployments
  FOR ALL USING (
    voice_agent_id IN (
      SELECT id FROM voice_agents WHERE user_id = auth.uid()
    )
  );

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at timestamps
CREATE TRIGGER update_voice_agents_updated_at 
  BEFORE UPDATE ON voice_agents 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_voice_profiles_updated_at 
  BEFORE UPDATE ON user_voice_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_voice_deployments_updated_at 
  BEFORE UPDATE ON voice_agent_deployments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default voice agent for existing users
INSERT INTO voice_agents (user_id, name, description, config, markdown_content, platforms)
SELECT 
  id as user_id,
  'Personal Coach' as name,
  'Your default AI voice coach' as description,
  '{
    "wakeWords": ["hey claude", "hey rashee"],
    "voiceProfile": {
      "style": "encouraging",
      "pace": "medium",
      "energy": "moderate"
    },
    "conversationFlow": {
      "greeting": "Good morning! I''m here to help you make the most of your day. How are you feeling?",
      "checkInQuestions": ["How did you sleep?", "What''s your energy level like today?"],
      "responses": {}
    }
  }' as config,
  '# Personal Coach

## Voice Profile
- **Style:** encouraging
- **Pace:** medium
- **Energy:** moderate

## Wake Words
- hey claude
- hey rashee
- start coaching

## Conversation Patterns
### Greeting
- Good morning! I''m here to help you make the most of your day. How are you feeling?

### Check-in Questions
- How did you sleep?
- What''s your energy level like today?
- What''s the most important thing you want to accomplish today?
' as markdown_content,
  ARRAY['web'] as platforms
FROM auth.users 
WHERE id NOT IN (SELECT user_id FROM voice_agents WHERE user_id IS NOT NULL)
ON CONFLICT DO NOTHING;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON voice_agents TO authenticated;
GRANT ALL ON user_voice_profiles TO authenticated;
GRANT ALL ON whatsapp_conversations TO authenticated;
GRANT SELECT ON voice_usage_logs TO authenticated;
GRANT ALL ON voice_agent_deployments TO authenticated;

-- Comment on tables
COMMENT ON TABLE voice_agents IS 'User-created voice agents with configuration and behavior';
COMMENT ON TABLE user_voice_profiles IS 'Custom voice profiles for personalized synthesis';
COMMENT ON TABLE whatsapp_conversations IS 'Log of all WhatsApp conversations with the voice agent';
COMMENT ON TABLE voice_usage_logs IS 'Usage tracking for voice features (synthesis, transcription, cloning)';
COMMENT ON TABLE voice_agent_deployments IS 'Deployment configurations for voice agents across platforms';
