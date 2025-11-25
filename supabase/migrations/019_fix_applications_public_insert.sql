-- =============================================
-- Fix Applications Public Insert Policy
-- =============================================
-- Error: "new row violates row-level security policy for table applications"
-- This means the public insert policy isn't working correctly.

-- Step 1: Ensure RLS is enabled
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Anyone can submit applications" ON applications;
DROP POLICY IF EXISTS "allow_public_insert" ON applications;
DROP POLICY IF EXISTS "public_can_insert_applications" ON applications;
DROP POLICY IF EXISTS "allow_admin_all" ON applications;
DROP POLICY IF EXISTS "Admins can manage applications" ON applications;
DROP POLICY IF EXISTS "admin_can_select_applications" ON applications;
DROP POLICY IF EXISTS "admin_can_update_applications" ON applications;
DROP POLICY IF EXISTS "admin_can_delete_applications" ON applications;

-- Step 3: Create public INSERT policy (for anonymous application submissions)
-- Using 'anon' role specifically for unauthenticated users
CREATE POLICY "allow_anonymous_application_insert"
ON applications
FOR INSERT
TO anon
WITH CHECK (true);

-- Also allow authenticated users to insert (in case they're logged in)
CREATE POLICY "allow_authenticated_application_insert"
ON applications
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Step 4: Create admin SELECT policy
CREATE POLICY "admin_can_view_applications"
ON applications
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
);

-- Step 5: Create admin UPDATE policy
CREATE POLICY "admin_can_update_applications"
ON applications
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
);

-- Step 6: Create admin DELETE policy
CREATE POLICY "admin_can_delete_applications"
ON applications
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
);

-- =============================================
-- Verification
-- =============================================
-- Show all policies on applications table
SELECT
    schemaname,
    tablename,
    policyname,
    cmd as operation,
    roles,
    qual as using_clause,
    with_check
FROM pg_policies
WHERE tablename = 'applications'
ORDER BY policyname;

-- =============================================
-- SUCCESS
-- =============================================
SELECT '✅ Applications table now allows public inserts!' as message;
