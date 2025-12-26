-- ===================================================================
-- FINAL WORKING FIX: Use default role permissions
-- ===================================================================
-- The issue: Supabase doesn't recognize 'public' or 'anon' roles properly
-- Solution: Create policies without TO clause (applies to current role)
--           but make them PERMISSIVE so they allow all operations
-- ===================================================================

-- Step 1: Disable RLS
ALTER TABLE applications DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop all policies
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
DROP POLICY IF EXISTS "public_insert_applications" ON applications;
DROP POLICY IF EXISTS "authenticated_select_applications" ON applications;
DROP POLICY IF EXISTS "authenticated_update_applications" ON applications;
DROP POLICY IF EXISTS "authenticated_delete_applications" ON applications;

-- Step 3: Re-enable RLS
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Step 4: Create a completely permissive INSERT policy
-- This applies to the current role (including anon via service)
CREATE POLICY "enable_insert_for_all"
ON applications
AS PERMISSIVE
FOR INSERT
WITH CHECK (true);

-- Step 5: Create SELECT for authenticated users
CREATE POLICY "enable_select_for_authenticated"
ON applications
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (true);

-- Step 6: Create UPDATE for authenticated users
CREATE POLICY "enable_update_for_authenticated"
ON applications
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Step 7: Create DELETE for authenticated users
CREATE POLICY "enable_delete_for_authenticated"
ON applications
AS PERMISSIVE
FOR DELETE
TO authenticated
USING (true);

-- ===================================================================
-- VERIFICATION
-- ===================================================================

SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'applications';
SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'applications';
