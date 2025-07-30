/*
  # Create User Profiles and AI Coaching Data Schema

  1. New Tables
    - `user_profiles`
      - `id` (uuid, primary key, references auth.users)
      - `full_name` (text)
      - `email` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `habits`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `name` (text)
      - `category` (text)
      - `target_value` (integer)
      - `target_unit` (text)
      - `color` (text)
      - `icon` (text)
      - `created_at` (timestamp)
      - `is_active` (boolean)
    
    - `habit_completions`
      - `id` (uuid, primary key)
      - `habit_id` (uuid, references habits)
      - `user_id` (uuid, references user_profiles)
      - `completed_at` (date)
      - `value_completed` (integer)
      - `notes` (text)
    
    - `goals`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `title` (text)
      - `description` (text)
      - `category` (text)
      - `target_date` (date)
      - `progress` (integer, 0-100)
      - `status` (text)
      - `created_at` (timestamp)
    
    - `ai_chat_messages`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `message` (text)
      - `sender` (text) -- 'user' or 'ai'
      - `created_at` (timestamp)
    
    - `achievements`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `title` (text)
      - `description` (text)
      - `icon` (text)
      - `earned_at` (timestamp)
      - `category` (text)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create habits table
CREATE TABLE IF NOT EXISTS habits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'health',
  target_value integer NOT NULL DEFAULT 1,
  target_unit text NOT NULL DEFAULT 'minutes',
  color text NOT NULL DEFAULT 'purple',
  icon text NOT NULL DEFAULT '⭐',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create habit_completions table
CREATE TABLE IF NOT EXISTS habit_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id uuid REFERENCES habits(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  completed_at date NOT NULL DEFAULT CURRENT_DATE,
  value_completed integer NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(habit_id, completed_at)
);

-- Create goals table
CREATE TABLE IF NOT EXISTS goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'personal',
  target_date date,
  progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  created_at timestamptz DEFAULT now()
);

-- Create ai_chat_messages table
CREATE TABLE IF NOT EXISTS ai_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  message text NOT NULL,
  sender text NOT NULL CHECK (sender IN ('user', 'ai')),
  created_at timestamptz DEFAULT now()
);

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL DEFAULT '🏆',
  category text NOT NULL DEFAULT 'general',
  earned_at timestamptz DEFAULT now()
);

-- Additional tables to support SmartTasks and AI features

-- Create tasks table for Smart Task Management
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'completed')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  category text,
  due_date date,
  ai_suggested boolean DEFAULT false,
  position integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Create ai_insights table for storing AI-generated insights
CREATE TABLE IF NOT EXISTS ai_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  insight_type text NOT NULL, -- 'productivity', 'habit', 'goal', 'motivation'
  title text NOT NULL,
  content text NOT NULL,
  confidence_score decimal(3,2), -- AI confidence 0.00-1.00
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

-- Create vision_movies table for AI Vision Movie feature
CREATE TABLE IF NOT EXISTS vision_movies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  video_url text,
  thumbnail_url text,
  script_content text,
  status text DEFAULT 'generating' CHECK (status IN ('generating', 'ready', 'failed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_preferences table for customization
CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  theme text DEFAULT 'purple',
  notifications_enabled boolean DEFAULT true,
  ai_coaching_style text DEFAULT 'encouraging', -- 'encouraging', 'direct', 'analytical'
  dashboard_layout jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);
-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE vision_movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies for user_profiles
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create policies for habits
CREATE POLICY "Users can manage own habits"
  ON habits
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for habit_completions
CREATE POLICY "Users can manage own habit completions"
  ON habit_completions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for goals
CREATE POLICY "Users can manage own goals"
  ON goals
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for ai_chat_messages
CREATE POLICY "Users can manage own chat messages"
  ON ai_chat_messages
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for achievements
CREATE POLICY "Users can read own achievements"
  ON achievements
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert achievements"
  ON achievements
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
-- Create policies for tasks
CREATE POLICY "Users can manage own tasks"
  ON tasks
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for ai_insights
CREATE POLICY "Users can read own insights"
  ON ai_insights
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage insights"
  ON ai_insights
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for vision_movies
CREATE POLICY "Users can manage own vision movies"
  ON vision_movies
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for user_preferences
CREATE POLICY "Users can manage own preferences"
  ON user_preferences
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);
-- Create function to automatically create user profile
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profile on signup
DROP TRIGGER IF EXISTS create_user_profile_trigger ON auth.users;
CREATE TRIGGER create_user_profile_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_completions_user_id ON habit_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_completions_habit_id ON habit_completions(habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_completions_date ON habit_completions(completed_at);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_user_id ON ai_chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON achievements(user_id);
-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_ai_insights_user_id ON ai_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_type ON ai_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_vision_movies_user_id ON vision_movies(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- Function to auto-create user preferences
CREATE OR REPLACE FUNCTION create_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create preferences when profile is created
CREATE TRIGGER create_user_preferences_trigger
  AFTER INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_user_preferences();