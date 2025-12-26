-- ===================================================================
-- NUCLEAR OPTION: Start completely fresh
-- ===================================================================
-- This will:
-- 1. Disable RLS
-- 2. Drop ALL policies
-- 3. Re-enable RLS
-- 4. Create ONE simple policy that definitely works
-- ===================================================================

-- Step 1: Disable RLS completely
ALTER TABLE applications DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop EVERY possible policy
DROP POLICY IF EXISTS "Anyone can submit applications" ON applications;
DROP POLICY IF EXISTS "Users can view their own applications" ON applications;
DROP POLICY IF EXISTS "Admins have full access to applications" ON applications;
DROP POLICY IF EXISTS "anon_insert_applications" ON applications;
DROP POLICY IF EXISTS "auth_insert_applications" ON applications;
DROP POLICY IF EXISTS "admin_all_applications" ON applications;
DROP POLICY IF EXISTS "admin_select_applications" ON applications;
DROP POLICY IF EXISTS "admin_update_applications" ON applications;
DROP POLICY IF EXISTS "admin_delete_applications" ON applications;
DROP POLICY IF EXISTS "allow_insert_applications" ON applications;
DROP POLICY IF EXISTS "allow_select_applications" ON applications;
DROP POLICY IF EXISTS "allow_update_applications" ON applications;
DROP POLICY IF EXISTS "allow_delete_applications" ON applications;

-- Step 3: Re-enable RLS
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Step 4: Create ONE permissive policy for INSERT that allows everything
CREATE POLICY "public_insert_applications"
ON applications
AS PERMISSIVE
FOR INSERT
TO public
WITH CHECK (true);

-- Step 5: Create ONE policy for SELECT (authenticated only)
CREATE POLICY "authenticated_select_applications"
ON applications
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (true);

-- Step 6: Create ONE policy for UPDATE (authenticated only)
CREATE POLICY "authenticated_update_applications"
ON applications
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Step 7: Create ONE policy for DELETE (authenticated only)
CREATE POLICY "authenticated_delete_applications"
ON applications
AS PERMISSIVE
FOR DELETE
TO authenticated
USING (true);

-- ===================================================================
-- VERIFICATION
-- ===================================================================

-- Show RLS status
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'applications';

-- Show all policies
SELECT policyname, cmd, roles, permissive
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'applications'
ORDER BY policyname;
