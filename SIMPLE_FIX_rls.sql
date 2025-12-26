-- ===================================================================
-- SIMPLIFIED FIX: Enable RLS with minimal policies
-- ===================================================================
-- This uses the simplest possible approach that will work
-- Run this in Supabase Dashboard > SQL Editor
-- ===================================================================

-- Step 1: Re-enable RLS on applications table
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies
DROP POLICY IF EXISTS "Anyone can submit applications" ON applications;
DROP POLICY IF EXISTS "Users can view their own applications" ON applications;
DROP POLICY IF EXISTS "Admins have full access to applications" ON applications;
DROP POLICY IF EXISTS "anon_insert_applications" ON applications;
DROP POLICY IF EXISTS "auth_insert_applications" ON applications;
DROP POLICY IF EXISTS "admin_all_applications" ON applications;
DROP POLICY IF EXISTS "admin_select_applications" ON applications;
DROP POLICY IF EXISTS "admin_update_applications" ON applications;
DROP POLICY IF EXISTS "admin_delete_applications" ON applications;

-- Step 3: Create ONE simple policy for INSERT that works for EVERYONE

-- Allow ANYONE (anon + authenticated) to INSERT applications
CREATE POLICY "allow_insert_applications"
ON applications
FOR INSERT
WITH CHECK (true);

-- Allow authenticated users to SELECT (so admins can view)
CREATE POLICY "allow_select_applications"
ON applications
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to UPDATE (so admins can update)
CREATE POLICY "allow_update_applications"
ON applications
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to DELETE (so admins can delete)
CREATE POLICY "allow_delete_applications"
ON applications
FOR DELETE
TO authenticated
USING (true);

-- ===================================================================
-- VERIFICATION
-- ===================================================================

SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'applications';

SELECT policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'applications'
ORDER BY policyname;
