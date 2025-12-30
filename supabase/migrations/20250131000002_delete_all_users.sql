-- Delete all existing student and teacher records
-- This is a one-time migration to prepare for Supabase Auth migration

DELETE FROM students;
DELETE FROM teachers;

-- Add comment
COMMENT ON TABLE students IS 'Student records - cleared for Supabase Auth migration';
COMMENT ON TABLE teachers IS 'Teacher (Staff) records - cleared for Supabase Auth migration';
