-- =============================================
-- Fix Applications RLS Policies
-- =============================================
-- This migration fixes the RLS policy conflict that was blocking
-- anonymous application submissions (error 42501)
--
-- Problem: The "allow_admin_all" policy had with_check: null,
-- which caused conflicts with the public INSERT policy

-- Step 1: Drop all existing policies on applications table
DROP POLICY IF EXISTS "Anyone can submit applications" ON applications;
DROP POLICY IF EXISTS "allow_public_insert" ON applications;
DROP POLICY IF EXISTS "allow_admin_all" ON applications;
DROP POLICY IF EXISTS "Admins can manage applications" ON applications;

-- Step 2: Create INSERT policy for public (anonymous) users
-- This allows anyone to submit applications without authentication
CREATE POLICY "public_can_insert_applications"
ON applications
FOR INSERT
TO public
WITH CHECK (true);

-- Step 3: Create separate policies for admins with explicit WITH CHECK clauses
-- This eliminates the conflict by having explicit policies for each operation

CREATE POLICY "admin_can_select_applications"
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
-- List all policies on applications table
SELECT
    schemaname,
    tablename,
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'applications'
ORDER BY policyname;

-- =============================================
-- SUCCESS
-- =============================================
SELECT '✅ Applications RLS policies fixed! Public can now submit applications.' as message;
