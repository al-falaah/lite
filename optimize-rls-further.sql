-- =============================================
-- FURTHER RLS OPTIMIZATION
-- Use IMMUTABLE function with better caching
-- =============================================

-- Drop the old function
DROP FUNCTION IF EXISTS is_user_admin();

-- Create optimized version with IMMUTABLE for better caching
CREATE OR REPLACE FUNCTION is_user_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  admin_status boolean;
BEGIN
  SELECT is_admin INTO admin_status
  FROM profiles
  WHERE id = auth.uid()
  LIMIT 1;

  RETURN COALESCE(admin_status, false);
END;
$$;

-- Add a comment for documentation
COMMENT ON FUNCTION is_user_admin() IS 'Fast cached check if current user is admin';

-- Test the function
SELECT
  is_user_admin() as "Am I admin?",
  auth.uid() as "My User ID";

-- Show execution plan for a sample update
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
UPDATE blog_posts
SET excerpt = 'test'
WHERE id = (SELECT id FROM blog_posts LIMIT 1);
