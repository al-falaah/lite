-- =============================================
-- Fix Class Schedules Unique Constraint
-- =============================================
-- The old constraint prevents students from having schedules in multiple programs
-- We need to drop it and rely on the enrollment_id based constraint

-- Drop the old constraint (it was truncated by PostgreSQL)
ALTER TABLE class_schedules
DROP CONSTRAINT IF EXISTS class_schedules_student_id_academic_year_week_number_class__key;

-- Ensure the new enrollment-based constraint exists
-- (This should already exist from migration 053, but we'll make sure)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'class_schedules_enrollment_year_week_type_unique'
  ) THEN
    ALTER TABLE class_schedules
    ADD CONSTRAINT class_schedules_enrollment_year_week_type_unique
    UNIQUE(enrollment_id, academic_year, week_number, class_type);
  END IF;
END $$;

-- =============================================
-- SUCCESS
-- =============================================
SELECT '✅ Fixed class_schedules constraint for multi-program support!' as message;
