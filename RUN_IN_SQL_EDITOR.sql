-- ===================================================================
-- RUN THIS IN SUPABASE SQL EDITOR
-- ===================================================================
-- Go to: https://supabase.com/dashboard/project/rkcdamqaptapsrhejdzm/sql/new
-- Paste this SQL and click "Run"
-- ===================================================================

-- Disable RLS on class_schedules table
ALTER TABLE class_schedules DISABLE ROW LEVEL SECURITY;

-- Verify it's disabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'class_schedules';

-- Expected result: rowsecurity should be 'f' (false)
