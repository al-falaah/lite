-- Rename admin roles:
--   madrasah_admin + store_admin → registrar
--   research_admin + blog_admin → academic_dean
--
-- Step 1: Drop old constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Step 2: Rename existing roles in profiles table
UPDATE profiles SET role = 'registrar' WHERE role IN ('madrasah_admin', 'store_admin');
UPDATE profiles SET role = 'academic_dean' WHERE role IN ('research_admin', 'blog_admin');

-- Step 3: Add new constraint with updated role values
ALTER TABLE profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('director', 'teacher', 'student', 'registrar', 'academic_dean'));

-- Step 4: Update is_admin_role() helper function
CREATE OR REPLACE FUNCTION is_admin_role(role_value TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN role_value IN ('director', 'registrar', 'academic_dean');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 5: Ensure is_admin flag is correct for renamed roles
UPDATE profiles SET is_admin = true WHERE role IN ('registrar', 'academic_dean');

-- Step 6: Update RLS policies that reference old role names
-- Recitations admin policy
DROP POLICY IF EXISTS "Admins can manage all recitations" ON recitations;
CREATE POLICY "Admins can manage all recitations" ON recitations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('registrar', 'director')
    )
  );

-- Step 7: Update admin_users view to reference new role names
CREATE OR REPLACE VIEW admin_users AS
SELECT
  u.id,
  u.email,
  u.created_at AS signed_up_at,
  p.full_name,
  p.is_admin,
  p.created_at AS profile_created_at
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE p.role IN ('director', 'registrar', 'academic_dean')
   OR p.is_admin = true;

-- Step 8: Update test/exam system RLS policies (was research_admin → academic_dean)
DROP POLICY IF EXISTS "Admins can manage test settings" ON program_test_settings;
CREATE POLICY "Admins can manage test settings"
  ON program_test_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('director', 'academic_dean')
    )
  );

DROP POLICY IF EXISTS "Admins can view all test questions" ON test_questions;
CREATE POLICY "Admins can view all test questions"
  ON test_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('director', 'academic_dean')
    )
  );

DROP POLICY IF EXISTS "Admins can manage test questions" ON test_questions;
CREATE POLICY "Admins can manage test questions"
  ON test_questions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('director', 'academic_dean')
    )
  );

DROP POLICY IF EXISTS "Admins can view all attempts" ON test_attempts;
CREATE POLICY "Admins can view all attempts"
  ON test_attempts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('director', 'academic_dean')
    )
  );

COMMENT ON COLUMN profiles.role IS
'User role. Valid values:
- director: Full access (founder)
- registrar: Enrollment, students, teachers, store (was madrasah_admin + store_admin)
- academic_dean: Blog, research, lesson notes, analytics (was research_admin + blog_admin)
- teacher: Teacher portal
- student: Student portal

Note: is_admin flag should be true for director, registrar, academic_dean.';
