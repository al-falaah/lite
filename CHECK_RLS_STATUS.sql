-- ===================================================================
-- CHECK RLS STATUS: Verify RLS is disabled and no policies exist
-- ===================================================================

-- Check if RLS is enabled on blog_posts and class_schedules
SELECT
    tablename,
    rowsecurity as rls_enabled,
    (SELECT COUNT(*)
     FROM pg_policies
     WHERE tablename = t.tablename
     AND schemaname = 'public') as policy_count
FROM pg_tables t
WHERE schemaname = 'public'
  AND tablename IN ('blog_posts', 'class_schedules')
ORDER BY tablename;

-- Show all existing policies on blog_posts (should be empty)
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'blog_posts';

-- Show all existing policies on class_schedules (should be empty)
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'class_schedules';

-- Expected results:
-- 1. First query should show rls_enabled = f (false) and policy_count = 0
-- 2. Second query should return no rows
-- 3. Third query should return no rows
