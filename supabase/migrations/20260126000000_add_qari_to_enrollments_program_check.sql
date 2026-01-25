-- Add 'qari' to enrollments program check constraint
-- This allows the QARI program to be used in enrollments

ALTER TABLE enrollments DROP CONSTRAINT IF EXISTS enrollments_program_check;
ALTER TABLE enrollments ADD CONSTRAINT enrollments_program_check
  CHECK (program IN ('tajweed', 'essentials', 'qari'));
