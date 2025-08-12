-- Add preferences JSONB column to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_preferences ON user_profiles USING gin(preferences);

-- Set default preferences for existing users
UPDATE user_profiles 
SET preferences = jsonb_build_object(
  'taskBoard', jsonb_build_object(
    'showCardDetails', true,
    'compactView', false,
    'showAIInsights', true,
    'columnVisibility', jsonb_build_object(
      'backlog', true,
      'todo', true,
      'in_progress', true,
      'blocked', true,
      'done', true
    ),
    'sortOrder', 'position',
    'filterTags', jsonb_build_array()
  ),
  'ui', jsonb_build_object(
    'theme', 'system',
    'sidebarCollapsed', false,
    'autoFocusInput', true,
    'enableAnimations', true
  ),
  'ai', jsonb_build_object(
    'coachingStyle', 'encouraging',
    'autoSuggest', true,
    'showInsights', true
  ),
  'notifications', jsonb_build_object(
    'emailEnabled', false,
    'pushEnabled', false,
    'taskReminders', true,
    'habitReminders', true
  )
)
WHERE preferences IS NULL OR preferences = '{}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN user_profiles.preferences IS 'User preferences for UI state, display settings, and feature toggles stored as JSONB';