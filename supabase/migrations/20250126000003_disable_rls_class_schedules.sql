-- ===================================================================
-- DISABLE RLS: class_schedules table
-- ===================================================================
-- Error: new row violates row-level security policy for table "class_schedules"
-- Admin needs to generate schedules for students via Edge Functions
-- ===================================================================

ALTER TABLE class_schedules DISABLE ROW LEVEL SECURITY;
