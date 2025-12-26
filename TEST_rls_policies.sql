-- ===================================================================
-- TEST: Verify RLS policies are correctly set
-- ===================================================================
-- Run this to check current state of RLS and policies
-- ===================================================================

-- 1. Check if RLS is enabled
SELECT
  schemaname,
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'applications';

-- 2. List all policies on applications table
SELECT
  schemaname,
  tablename,
  policyname as "Policy Name",
  cmd as "Command",
  roles as "Roles",
  qual as "USING Expression",
  with_check as "WITH CHECK Expression"
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'applications'
ORDER BY policyname;

-- 3. Count total policies (should be 4)
SELECT COUNT(*) as "Total Policies"
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'applications';
