-- ===================================================================
-- QUICK FIX: Simply disable RLS on applications table
-- ===================================================================
-- This is the fastest way to restore application submissions
-- Run this in Supabase Dashboard > SQL Editor
-- ===================================================================

-- Just disable RLS entirely on the applications table
ALTER TABLE applications DISABLE ROW LEVEL SECURITY;

-- Verify it worked
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'applications';

-- Expected result: rowsecurity should be 'f' (false)
