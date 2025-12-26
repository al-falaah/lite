-- ===================================================================
-- CORRECT FIX: The policy must specify roles explicitly
-- ===================================================================
-- The issue: "WITH CHECK (true)" without "TO" clause defaults to the
-- current role only, which blocks anonymous users
-- ===================================================================

-- Step 1: Drop the broken INSERT policy
DROP POLICY IF EXISTS "allow_insert_applications" ON applications;

-- Step 2: Create the CORRECT INSERT policy with explicit roles
CREATE POLICY "allow_insert_applications"
ON applications
FOR INSERT
TO anon, authenticated  -- This is the critical fix!
WITH CHECK (true);

-- ===================================================================
-- VERIFICATION
-- ===================================================================

-- Check the policy (should show roles: {anon,authenticated})
SELECT
  policyname as "Policy Name",
  cmd as "Command",
  roles as "Roles"
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'applications'
  AND policyname = 'allow_insert_applications';
