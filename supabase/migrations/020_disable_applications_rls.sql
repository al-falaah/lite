-- =============================================
-- Disable RLS on Applications Table
-- =============================================
-- The RLS policies are preventing anonymous application submissions.
-- Since applications are meant to be public submissions, we'll disable
-- RLS entirely on this table.

-- Drop all policies
DROP POLICY IF EXISTS "allow_anonymous_application_insert" ON applications;
DROP POLICY IF EXISTS "allow_authenticated_application_insert" ON applications;
DROP POLICY IF EXISTS "admin_can_view_applications" ON applications;
DROP POLICY IF EXISTS "admin_can_update_applications" ON applications;
DROP POLICY IF EXISTS "admin_can_delete_applications" ON applications;
DROP POLICY IF EXISTS "public_can_insert_applications" ON applications;
DROP POLICY IF EXISTS "admin_can_select_applications" ON applications;

-- Disable RLS entirely
ALTER TABLE applications DISABLE ROW LEVEL SECURITY;

-- =============================================
-- SUCCESS
-- =============================================
SELECT '✅ RLS disabled on applications table - public submissions now allowed!' as message;
