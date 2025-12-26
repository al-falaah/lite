-- ===================================================================
-- DISABLE RLS: class_schedules table
-- ===================================================================
-- Error: new row violates row-level security policy for table "class_schedules"
-- Admin needs to generate schedules for students via Edge Functions
-- ===================================================================

ALTER TABLE class_schedules DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'class_schedules';
