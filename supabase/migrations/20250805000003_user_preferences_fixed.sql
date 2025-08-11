-- Migration: 20250805000003_user_preferences_fixed.sql
-- Fixed version with proper ordering and existence checks

-- Drop existing policies if they exist
DO $$ 
BEGIN
    -- Drop policies for user_preferences if they exist
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_preferences' AND policyname = 'Users can view their own preferences') THEN
        DROP POLICY "Users can view their own preferences" ON user_preferences;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_preferences' AND policyname = 'Users can insert their own preferences') THEN
        DROP POLICY "Users can insert their own preferences" ON user_preferences;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_preferences' AND policyname = 'Users can update their own preferences') THEN
        DROP POLICY "Users can update their own preferences" ON user_preferences;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_preferences' AND policyname = 'Users can delete their own preferences') THEN
        DROP POLICY "Users can delete their own preferences" ON user_preferences;
    END IF;
    
    -- Drop policies for community_shares if they exist
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'community_shares' AND policyname = 'Users can view shares they created or received') THEN
        DROP POLICY "Users can view shares they created or received" ON community_shares;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'community_shares' AND policyname = 'Users can create shares for their own searches') THEN
        DROP POLICY "Users can create shares for their own searches" ON community_shares;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'community_shares' AND policyname = 'Users can update their own shares') THEN
        DROP POLICY "Users can update their own shares" ON community_shares;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'community_shares' AND policyname = 'Users can delete their own shares') THEN
        DROP POLICY "Users can delete their own shares" ON community_shares;
    END IF;
    
    -- Drop policies for user_profiles if they exist
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Users can view their own profile') THEN
        DROP POLICY "Users can view their own profile" ON user_profiles;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Users can insert their own profile') THEN
        DROP POLICY "Users can insert their own profile" ON user_profiles;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Users can update their own profile') THEN
        DROP POLICY "Users can update their own profile" ON user_profiles;
    END IF;
END $$;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;

-- Create user_preferences table for accessibility and security settings
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  accessibility_settings JSONB DEFAULT '{}'::jsonb,
  security_settings JSONB DEFAULT '{}'::jsonb,
  ui_preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Add missing columns to user_preferences if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_preferences' AND column_name = 'accessibility_settings') THEN
        ALTER TABLE user_preferences ADD COLUMN accessibility_settings JSONB DEFAULT '{}'::jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_preferences' AND column_name = 'security_settings') THEN
        ALTER TABLE user_preferences ADD COLUMN security_settings JSONB DEFAULT '{}'::jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_preferences' AND column_name = 'ui_preferences') THEN
        ALTER TABLE user_preferences ADD COLUMN ui_preferences JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- Create user_profiles table for 2FA support
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns to user_profiles if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'phone_number') THEN
        ALTER TABLE user_profiles ADD COLUMN phone_number TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'phone_verified') THEN
        ALTER TABLE user_profiles ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'two_factor_enabled') THEN
        ALTER TABLE user_profiles ADD COLUMN two_factor_enabled BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'two_factor_secret') THEN
        ALTER TABLE user_profiles ADD COLUMN two_factor_secret TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'backup_codes') THEN
        ALTER TABLE user_profiles ADD COLUMN backup_codes TEXT[];
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'last_login_at') THEN
        ALTER TABLE user_profiles ADD COLUMN last_login_at TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'login_attempts') THEN
        ALTER TABLE user_profiles ADD COLUMN login_attempts INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'locked_until') THEN
        ALTER TABLE user_profiles ADD COLUMN locked_until TIMESTAMPTZ;
    END IF;
END $$;

-- Create community sharing table for future use
CREATE TABLE IF NOT EXISTS community_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  search_id UUID REFERENCES enhanced_job_searches(id) ON DELETE CASCADE,
  share_type TEXT DEFAULT 'view' CHECK (share_type IN ('view', 'collaborate')),
  permission_level TEXT DEFAULT 'read' CHECK (permission_level IN ('read', 'write', 'admin')),
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns to community_shares if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'community_shares' AND column_name = 'share_type') THEN
        ALTER TABLE community_shares ADD COLUMN share_type TEXT DEFAULT 'view' CHECK (share_type IN ('view', 'collaborate'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'community_shares' AND column_name = 'permission_level') THEN
        ALTER TABLE community_shares ADD COLUMN permission_level TEXT DEFAULT 'read' CHECK (permission_level IN ('read', 'write', 'admin'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'community_shares' AND column_name = 'is_active') THEN
        ALTER TABLE community_shares ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'community_shares' AND column_name = 'expires_at') THEN
        ALTER TABLE community_shares ADD COLUMN expires_at TIMESTAMPTZ;
    END IF;
END $$;

-- Add lock functionality to enhanced_job_searches
ALTER TABLE enhanced_job_searches 
ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS lock_code_hash TEXT,
ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS locked_by UUID REFERENCES auth.users(id);

-- Add search status for pause/resume functionality
ALTER TABLE enhanced_job_searches 
ADD COLUMN IF NOT EXISTS search_status TEXT DEFAULT 'inactive' CHECK (search_status IN ('inactive', 'running', 'paused', 'stopped', 'completed', 'failed'));

-- Enable Row Level Security
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_shares ENABLE ROW LEVEL SECURITY;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to hash lock codes securely
CREATE OR REPLACE FUNCTION hash_lock_code(code TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Simple hash for demo - in production use proper bcrypt or similar
  RETURN encode(digest(code || 'rashenal_salt', 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Create function to verify lock codes
CREATE OR REPLACE FUNCTION verify_lock_code(search_id UUID, code TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  stored_hash TEXT;
BEGIN
  SELECT lock_code_hash INTO stored_hash 
  FROM enhanced_job_searches 
  WHERE id = search_id AND is_locked = TRUE;
  
  IF stored_hash IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN stored_hash = hash_lock_code(code);
END;
$$ LANGUAGE plpgsql;

-- Create RLS policies for user_preferences
CREATE POLICY "Users can view their own preferences" ON user_preferences
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own preferences" ON user_preferences
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own preferences" ON user_preferences
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own preferences" ON user_preferences
  FOR DELETE USING (user_id = auth.uid());

-- RLS policies for user_profiles  
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (user_id = auth.uid());

-- RLS policies for community_shares
CREATE POLICY "Users can view shares they created or received" ON community_shares
  FOR SELECT USING (
    user_id = auth.uid() OR shared_with_user_id = auth.uid()
  );

CREATE POLICY "Users can create shares for their own searches" ON community_shares
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM enhanced_job_searches 
      WHERE id = search_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own shares" ON community_shares
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own shares" ON community_shares
  FOR DELETE USING (user_id = auth.uid());

-- Create triggers for updated_at timestamp
CREATE TRIGGER update_user_preferences_updated_at 
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_user_preferences_updated_at();

CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_user_preferences_updated_at();

-- Create indexes (after all tables are created)
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_job_searches_status ON enhanced_job_searches(search_status);
CREATE INDEX IF NOT EXISTS idx_enhanced_job_searches_locked ON enhanced_job_searches(is_locked);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_phone ON user_profiles(phone_number);
CREATE INDEX IF NOT EXISTS idx_user_profiles_2fa ON user_profiles(two_factor_enabled);
CREATE INDEX IF NOT EXISTS idx_community_shares_user_id ON community_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_community_shares_shared_with ON community_shares(shared_with_user_id);
CREATE INDEX IF NOT EXISTS idx_community_shares_search_id ON community_shares(search_id);
CREATE INDEX IF NOT EXISTS idx_community_shares_active ON community_shares(is_active);

-- Create 2FA verification tables
CREATE TABLE IF NOT EXISTS two_factor_verifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  verification_code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns to two_factor_verifications if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'two_factor_verifications' AND column_name = 'phone_number') THEN
        ALTER TABLE two_factor_verifications ADD COLUMN phone_number TEXT NOT NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'two_factor_verifications' AND column_name = 'verification_code') THEN
        ALTER TABLE two_factor_verifications ADD COLUMN verification_code TEXT NOT NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'two_factor_verifications' AND column_name = 'expires_at') THEN
        ALTER TABLE two_factor_verifications ADD COLUMN expires_at TIMESTAMPTZ NOT NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'two_factor_verifications' AND column_name = 'verified_at') THEN
        ALTER TABLE two_factor_verifications ADD COLUMN verified_at TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'two_factor_verifications' AND column_name = 'attempts') THEN
        ALTER TABLE two_factor_verifications ADD COLUMN attempts INTEGER DEFAULT 0;
    END IF;
END $$;

-- Enable RLS for 2FA verifications
ALTER TABLE two_factor_verifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for 2FA verifications
CREATE POLICY "Users can view their own 2FA verifications" ON two_factor_verifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own 2FA verifications" ON two_factor_verifications
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Create index for 2FA verifications
CREATE INDEX IF NOT EXISTS idx_2fa_verifications_user_id ON two_factor_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_2fa_verifications_expires ON two_factor_verifications(expires_at);

-- Function to send 2FA verification code (placeholder - implement with SMS service)
CREATE OR REPLACE FUNCTION send_2fa_verification_code(
  p_user_id UUID,
  p_phone_number TEXT
)
RETURNS UUID AS $$
DECLARE
  v_code TEXT;
  v_verification_id UUID;
BEGIN
  -- Generate random 6-digit code
  v_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
  
  -- Insert verification record
  INSERT INTO two_factor_verifications (
    user_id, 
    phone_number, 
    verification_code,
    expires_at
  ) VALUES (
    p_user_id,
    p_phone_number,
    v_code, -- In production, hash this
    NOW() + INTERVAL '10 minutes'
  ) RETURNING id INTO v_verification_id;
  
  -- In production, send SMS here
  -- For now, just log it (remove in production)
  RAISE NOTICE '2FA Code for %: %', p_phone_number, v_code;
  
  RETURN v_verification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify 2FA code
CREATE OR REPLACE FUNCTION verify_2fa_code(
  p_verification_id UUID,
  p_code TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_stored_code TEXT;
  v_expires_at TIMESTAMPTZ;
  v_attempts INTEGER;
  v_user_id UUID;
BEGIN
  -- Get verification details
  SELECT verification_code, expires_at, attempts, user_id
  INTO v_stored_code, v_expires_at, v_attempts, v_user_id
  FROM two_factor_verifications
  WHERE id = p_verification_id AND verified_at IS NULL;
  
  -- Check if verification exists
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Check if expired
  IF v_expires_at < NOW() THEN
    RETURN FALSE;
  END IF;
  
  -- Check if too many attempts
  IF v_attempts >= 5 THEN
    RETURN FALSE;
  END IF;
  
  -- Increment attempts
  UPDATE two_factor_verifications
  SET attempts = attempts + 1
  WHERE id = p_verification_id;
  
  -- Verify code
  IF v_stored_code = p_code THEN
    -- Mark as verified
    UPDATE two_factor_verifications
    SET verified_at = NOW()
    WHERE id = p_verification_id;
    
    -- Enable 2FA for user
    UPDATE user_profiles
    SET two_factor_enabled = TRUE,
        phone_verified = TRUE
    WHERE user_id = v_user_id;
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment explaining the migration
COMMENT ON SCHEMA public IS 'Fixed user preferences migration with proper ordering of table creation, index creation, and 2FA support';