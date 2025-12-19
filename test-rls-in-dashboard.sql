-- =====================================================
-- RUN THIS IN SUPABASE DASHBOARD SQL EDITOR
-- This tests if RLS policies allow updates for your user
-- =====================================================

-- Step 1: Check your authentication
SELECT
  auth.uid() as my_user_id,
  auth.email() as my_email;

-- Step 2: Check if you're an admin
SELECT
  id,
  full_name,
  email,
  is_admin,
  created_at
FROM profiles
WHERE id = auth.uid();

-- Step 3: If is_admin is false, set it to true (IMPORTANT!)
-- Uncomment the next 3 lines if you need to make yourself admin:
-- UPDATE profiles
-- SET is_admin = true
-- WHERE id = auth.uid();

-- Step 4: Check current RLS policies
SELECT
  policyname,
  cmd,
  roles::text[],
  qual::text as using_clause,
  with_check::text as with_check_clause
FROM pg_policies
WHERE tablename = 'blog_posts'
ORDER BY cmd, policyname;

-- Step 5: Try to SELECT a blog post (should work for everyone if published)
SELECT id, title, status, created_at
FROM blog_posts
LIMIT 1;

-- Step 6: Try to UPDATE a blog post (should work if you're admin)
UPDATE blog_posts
SET excerpt = 'Test update from SQL Dashboard at ' || NOW()
WHERE id = (SELECT id FROM blog_posts LIMIT 1)
RETURNING id, title, excerpt;

-- If Step 6 succeeds, RLS is working correctly!
-- If it fails, there's an RLS policy issue.

-- Step 7: Check for any slow functions that might be causing timeouts
SELECT
  proname as function_name,
  provolatile as volatility,
  prosecdef as security_definer
FROM pg_proc
WHERE proname LIKE '%admin%' OR proname LIKE '%blog%'
ORDER BY proname;
