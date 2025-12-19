-- Check current RLS policies on blog_posts table
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual AS using_expression,
  with_check AS with_check_expression
FROM pg_policies
WHERE tablename = 'blog_posts'
ORDER BY cmd, policyname;

-- Check if RLS is enabled on the table
SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_enabled,
  relrowsecurity AS rls_forced
FROM pg_tables
JOIN pg_class ON pg_tables.tablename = pg_class.relname
WHERE tablename = 'blog_posts';

-- Check if there are any functions that might be slowing things down
SELECT
  proname AS function_name,
  prosrc AS function_body
FROM pg_proc
WHERE proname LIKE '%admin%' OR proname LIKE '%blog%';
