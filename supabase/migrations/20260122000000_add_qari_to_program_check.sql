-- Add 'qari' program to the applications table program check constraint
-- This allows the QARI (Quranic Arabic & Recitation Intensive) program to be submitted via applications

-- First, drop the existing check constraint
ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_program_check;

-- Add the updated check constraint with all programs including 'qari'
ALTER TABLE applications ADD CONSTRAINT applications_program_check
  CHECK (program IN ('tajweed', 'essentials', 'qari'));

-- Add comment for documentation
COMMENT ON CONSTRAINT applications_program_check ON applications IS
'Valid programs: tajweed (TMP), essentials (EASI), qari (QARI)';
