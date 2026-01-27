-- Add 'qari' program to the class_schedules table program check constraint
-- This allows QARI program schedules to be created

-- First, drop the existing check constraint
ALTER TABLE class_schedules DROP CONSTRAINT IF EXISTS class_schedules_program_check;

-- Add the updated check constraint with all programs including 'qari'
ALTER TABLE class_schedules ADD CONSTRAINT class_schedules_program_check
  CHECK (program IN ('tajweed', 'essentials', 'qari'));

-- Add comment for documentation
COMMENT ON CONSTRAINT class_schedules_program_check ON class_schedules IS
'Valid programs: tajweed (TMP), essentials (EASI), qari (QARI)';
