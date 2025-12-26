-- Check RLS status on all important tables
SELECT
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('applications', 'students', 'profiles', 'enrollments', 'payments', 'class_schedules')
ORDER BY tablename;

-- Check policies on students table
SELECT
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'students'
ORDER BY policyname;
