-- =============================================
-- Allow public viewing of enrollments
-- =============================================
-- Students should be able to view their enrollments without authentication
-- This enables the public student portal to show enrollment data

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Students can view their own enrollments" ON enrollments;

-- Create a public read policy for enrollments
CREATE POLICY "Anyone can view enrollments"
ON enrollments FOR SELECT
TO public
USING (true);

-- Also update class_schedules to be publicly viewable
DROP POLICY IF EXISTS "Students can view their own schedules" ON class_schedules;

CREATE POLICY "Anyone can view class schedules"
ON class_schedules FOR SELECT
TO public
USING (true);

-- Update students table to allow public viewing (read-only)
DROP POLICY IF EXISTS "Students can view their own profile" ON students;

CREATE POLICY "Anyone can view student profiles"
ON students FOR SELECT
TO public
USING (true);

-- Keep admin policies for write operations
-- Admins can still manage enrollments
-- (The admin policy already exists from migration 037)

COMMENT ON POLICY "Anyone can view enrollments" ON enrollments IS
'Public read access for student portal - students view schedules without login';

COMMENT ON POLICY "Anyone can view class schedules" ON class_schedules IS
'Public read access for student portal - students view schedules without login';

COMMENT ON POLICY "Anyone can view student profiles" ON students IS
'Public read access for student portal - students view their info without login';

-- Verify the policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('enrollments', 'class_schedules', 'students')
ORDER BY tablename, policyname;
