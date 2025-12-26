-- ===================================================================
-- PROPER FIX: Enable RLS with correct policies for anonymous users
-- ===================================================================
-- This will fix the security warning in Supabase
-- Run this in Supabase Dashboard > SQL Editor
-- ===================================================================

-- Step 1: Re-enable RLS on applications table
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Anyone can submit applications" ON applications;
DROP POLICY IF EXISTS "Users can view their own applications" ON applications;
DROP POLICY IF EXISTS "Admins have full access to applications" ON applications;
DROP POLICY IF EXISTS "anon_insert_applications" ON applications;
DROP POLICY IF EXISTS "auth_insert_applications" ON applications;
DROP POLICY IF EXISTS "admin_all_applications" ON applications;
DROP POLICY IF EXISTS "admin_select_applications" ON applications;
DROP POLICY IF EXISTS "admin_update_applications" ON applications;
DROP POLICY IF EXISTS "admin_delete_applications" ON applications;

-- Step 3: Create policies that allow anonymous application submissions

-- Allow ANONYMOUS users to INSERT applications (this is the key!)
CREATE POLICY "anon_insert_applications"
ON applications
FOR INSERT
TO anon
WITH CHECK (true);

-- Allow AUTHENTICATED users to INSERT applications
CREATE POLICY "auth_insert_applications"
ON applications
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow admins to SELECT all applications
CREATE POLICY "admin_select_applications"
ON applications
FOR SELECT
TO authenticated
USING (
  COALESCE((auth.jwt() -> 'is_admin') = 'true'::jsonb, false)
  OR COALESCE((auth.jwt() -> 'user_metadata' -> 'is_admin') = 'true'::jsonb, false)
);

-- Allow admins to UPDATE all applications
CREATE POLICY "admin_update_applications"
ON applications
FOR UPDATE
TO authenticated
USING (
  COALESCE((auth.jwt() -> 'is_admin') = 'true'::jsonb, false)
  OR COALESCE((auth.jwt() -> 'user_metadata' -> 'is_admin') = 'true'::jsonb, false)
)
WITH CHECK (
  COALESCE((auth.jwt() -> 'is_admin') = 'true'::jsonb, false)
  OR COALESCE((auth.jwt() -> 'user_metadata' -> 'is_admin') = 'true'::jsonb, false)
);

-- Allow admins to DELETE all applications
CREATE POLICY "admin_delete_applications"
ON applications
FOR DELETE
TO authenticated
USING (
  COALESCE((auth.jwt() -> 'is_admin') = 'true'::jsonb, false)
  OR COALESCE((auth.jwt() -> 'user_metadata' -> 'is_admin') = 'true'::jsonb, false)
);

-- ===================================================================
-- VERIFICATION QUERIES
-- ===================================================================

-- Check if RLS is enabled (should show 't' for true)
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'applications';

-- Check all policies (should show 5 policies)
SELECT policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'applications'
ORDER BY policyname;
