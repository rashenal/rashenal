-- Create RPC function for schema introspection
-- This allows the application to query database schema information safely

BEGIN;

-- Drop function if exists to allow updates
DROP FUNCTION IF EXISTS get_table_columns(text);

-- Create function to get table columns information
CREATE OR REPLACE FUNCTION get_table_columns(schema_name text DEFAULT 'public')
RETURNS TABLE (
    table_name text,
    column_name text,
    data_type text,
    is_nullable text,
    column_default text
) 
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT 
        c.table_name::text,
        c.column_name::text,
        c.data_type::text,
        c.is_nullable::text,
        c.column_default::text
    FROM information_schema.columns c
    WHERE c.table_schema = schema_name
    ORDER BY c.table_name, c.ordinal_position;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_table_columns(text) TO authenticated;

-- Create a more flexible SQL execution function (admin only)
CREATE OR REPLACE FUNCTION execute_sql(query text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result jsonb;
BEGIN
    -- Only allow this for service role or specific admin users
    IF auth.role() != 'service_role' THEN
        RAISE EXCEPTION 'Unauthorized access to execute_sql function';
    END IF;
    
    -- Execute the query and return results as JSONB
    EXECUTE 'SELECT jsonb_agg(row_to_json(t)) FROM (' || query || ') t' INTO result;
    RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

-- Do not grant public access to execute_sql - it's admin only

-- Create a safer table existence check function
CREATE OR REPLACE FUNCTION check_table_exists(table_name text, schema_name text DEFAULT 'public')
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = schema_name 
        AND table_name = check_table_exists.table_name
    );
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION check_table_exists(text, text) TO authenticated;

-- Create function to get all tables in schema
CREATE OR REPLACE FUNCTION get_schema_tables(schema_name text DEFAULT 'public')
RETURNS TABLE (
    table_name text,
    table_type text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT 
        t.table_name::text,
        t.table_type::text
    FROM information_schema.tables t
    WHERE t.table_schema = schema_name
    AND t.table_type = 'BASE TABLE'
    ORDER BY t.table_name;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_schema_tables(text) TO authenticated;

-- Create function to get column details for a specific table
CREATE OR REPLACE FUNCTION get_table_column_details(
    p_table_name text,
    p_schema_name text DEFAULT 'public'
)
RETURNS TABLE (
    column_name text,
    data_type text,
    is_nullable boolean,
    column_default text,
    ordinal_position integer,
    character_maximum_length integer,
    numeric_precision integer,
    numeric_scale integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT 
        c.column_name::text,
        c.data_type::text,
        CASE WHEN c.is_nullable = 'YES' THEN true ELSE false END,
        c.column_default::text,
        c.ordinal_position::integer,
        c.character_maximum_length::integer,
        c.numeric_precision::integer,
        c.numeric_scale::integer
    FROM information_schema.columns c
    WHERE c.table_schema = p_schema_name
    AND c.table_name = p_table_name
    ORDER BY c.ordinal_position;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_table_column_details(text, text) TO authenticated;

COMMIT;

-- Add helpful comments
COMMENT ON FUNCTION get_table_columns(text) IS 'Returns column information for all tables in the specified schema';
COMMENT ON FUNCTION check_table_exists(text, text) IS 'Checks if a table exists in the specified schema';
COMMENT ON FUNCTION get_schema_tables(text) IS 'Returns all base tables in the specified schema';
COMMENT ON FUNCTION get_table_column_details(text, text) IS 'Returns detailed column information for a specific table';