-- Migration: Backfill program field for existing class_schedules
-- This sets program to 'essentials' for all schedules where program is NULL
-- We default to 'essentials' as it was the original program before multi-program support

-- Update all existing schedules with NULL program to 'essentials'
UPDATE class_schedules
SET program = 'essentials'
WHERE program IS NULL;

-- Verify the update
SELECT
  'Before migration' as status,
  COUNT(*) as total_schedules,
  COUNT(CASE WHEN program IS NULL THEN 1 END) as null_programs,
  COUNT(CASE WHEN program = 'essentials' THEN 1 END) as essentials_programs,
  COUNT(CASE WHEN program = 'tajweed' THEN 1 END) as tajweed_programs
FROM class_schedules;

-- Note: Going forward, all new schedules MUST have a program specified
-- The frontend now enforces program selection when creating schedules
