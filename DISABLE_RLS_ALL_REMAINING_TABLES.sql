-- ===================================================================
-- DISABLE RLS: All Remaining Tables with RLS Issues
-- ===================================================================
-- This includes blog_posts and class_schedules
-- Admin operations are timing out due to RLS policies
-- ===================================================================

-- Disable RLS on blog_posts (article publishing timeout)
ALTER TABLE blog_posts DISABLE ROW LEVEL SECURITY;

-- Disable RLS on class_schedules (schedule generation blocked)
ALTER TABLE class_schedules DISABLE ROW LEVEL SECURITY;

-- Verify both are disabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('blog_posts', 'class_schedules')
ORDER BY tablename;

-- Expected result: rowsecurity should be 'f' (false) for both tables
