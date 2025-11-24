-- Add gender column to students table
-- This stores gender information from applications

ALTER TABLE students
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female'));

COMMENT ON COLUMN students.gender IS 'Student gender (male/female)';
