-- Add 'qari' program to the students table program check constraint
-- This allows the QARI (Quranic Arabic & Recitation Intensive) program to be assigned to students

-- First, drop the existing check constraint
ALTER TABLE students DROP CONSTRAINT IF EXISTS students_program_check;

-- Add the updated check constraint with all programs including 'qari'
ALTER TABLE students ADD CONSTRAINT students_program_check
  CHECK (program IN ('tajweed', 'essentials', 'qari'));

-- Add comment for documentation
COMMENT ON CONSTRAINT students_program_check ON students IS
'Valid programs: tajweed (TMP), essentials (EASI), qari (QARI)';
