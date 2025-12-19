-- Temporarily disable RLS on blog_posts to test if RLS is causing the timeout
-- This will allow anyone to read/write blog posts (not secure, just for testing!)

-- First, drop all existing policies
DROP POLICY IF EXISTS "blog_select_published" ON blog_posts;
DROP POLICY IF EXISTS "blog_insert_admin" ON blog_posts;
DROP POLICY IF EXISTS "blog_update_admin" ON blog_posts;
DROP POLICY IF EXISTS "blog_delete_admin" ON blog_posts;

-- Disable RLS entirely on the table
ALTER TABLE blog_posts DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT
    schemaname,
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename = 'blog_posts';

-- Check that no policies remain
SELECT policyname
FROM pg_policies
WHERE tablename = 'blog_posts';