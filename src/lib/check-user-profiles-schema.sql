/*
  # Quick Schema Check for user_profiles Table
  
  Run this FIRST before running the main migration to see what columns exist.
  This will help debug any column missing errors.
*/

-- Check if user_profiles table exists and what columns it has
SELECT 
    'user_profiles table schema' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- If the table doesn't exist, this will show no results
-- If it exists, you'll see all the columns

-- Also check what's in the table (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
        RAISE NOTICE 'user_profiles table exists with % rows', (SELECT COUNT(*) FROM user_profiles);
        
        -- Show existing column names
        RAISE NOTICE 'Existing columns: %', (
            SELECT string_agg(column_name, ', ' ORDER BY ordinal_position)
            FROM information_schema.columns 
            WHERE table_name = 'user_profiles' AND table_schema = 'public'
        );
    ELSE
        RAISE NOTICE 'user_profiles table does not exist - it needs to be created';
    END IF;
END $$;

-- Check auth.users structure for reference
SELECT 
    'auth.users table schema (for reference)' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND table_schema = 'auth'
  AND column_name IN ('id', 'email', 'created_at', 'updated_at', 'raw_user_meta_data')
ORDER BY ordinal_position;