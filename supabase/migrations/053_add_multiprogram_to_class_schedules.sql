-- =============================================
-- Add Multi-Program Support to Class Schedules
-- =============================================
-- Add enrollment_id and program columns to support students enrolled in multiple programs

-- Add enrollment_id column to link schedules to specific enrollments
ALTER TABLE class_schedules
ADD COLUMN IF NOT EXISTS enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE;

-- Add program column to distinguish between programs
ALTER TABLE class_schedules
ADD COLUMN IF NOT EXISTS program TEXT CHECK (program IN ('essentials', 'tajweed'));

-- Create index for enrollment lookups
CREATE INDEX IF NOT EXISTS idx_schedules_enrollment ON class_schedules(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_schedules_program ON class_schedules(program);

-- Drop the old unique constraint that didn't account for multiple programs
ALTER TABLE class_schedules
DROP CONSTRAINT IF EXISTS class_schedules_student_id_academic_year_week_number_class_type_key;

-- Add new unique constraint that includes program
-- This ensures a student can have one class per week per type PER PROGRAM
ALTER TABLE class_schedules
ADD CONSTRAINT class_schedules_enrollment_year_week_type_unique
UNIQUE(enrollment_id, academic_year, week_number, class_type);

-- Update the student_class_progress view to account for programs
DROP VIEW IF EXISTS student_class_progress;
CREATE VIEW student_class_progress AS
SELECT
  s.id as student_id,
  s.student_id as student_number,
  s.full_name,
  s.enrolled_date,
  e.program,
  e.id as enrollment_id,

  -- Year 1 progress (for Essentials program - 2 year course)
  COUNT(CASE WHEN cs.academic_year = 1 AND cs.status = 'completed' AND cs.program = 'essentials' THEN 1 END) as year1_completed,
  CASE WHEN e.program = 'essentials' THEN 52 * 2 ELSE 0 END as year1_total,
  CASE
    WHEN e.program = 'essentials' THEN ROUND((COUNT(CASE WHEN cs.academic_year = 1 AND cs.status = 'completed' AND cs.program = 'essentials' THEN 1 END)::NUMERIC / (52 * 2)) * 100, 1)
    ELSE 0
  END as year1_progress_pct,

  -- Year 2 progress (for Essentials program only)
  COUNT(CASE WHEN cs.academic_year = 2 AND cs.status = 'completed' AND cs.program = 'essentials' THEN 1 END) as year2_completed,
  CASE WHEN e.program = 'essentials' THEN 52 * 2 ELSE 0 END as year2_total,
  CASE
    WHEN e.program = 'essentials' THEN ROUND((COUNT(CASE WHEN cs.academic_year = 2 AND cs.status = 'completed' AND cs.program = 'essentials' THEN 1 END)::NUMERIC / (52 * 2)) * 100, 1)
    ELSE 0
  END as year2_progress_pct,

  -- Tajweed progress (6 months - 26 weeks)
  COUNT(CASE WHEN cs.status = 'completed' AND cs.program = 'tajweed' THEN 1 END) as tajweed_completed,
  CASE WHEN e.program = 'tajweed' THEN 26 * 2 ELSE 0 END as tajweed_total,
  CASE
    WHEN e.program = 'tajweed' THEN ROUND((COUNT(CASE WHEN cs.status = 'completed' AND cs.program = 'tajweed' THEN 1 END)::NUMERIC / (26 * 2)) * 100, 1)
    ELSE 0
  END as tajweed_progress_pct,

  -- Overall progress for this enrollment
  COUNT(CASE WHEN cs.status = 'completed' AND cs.enrollment_id = e.id THEN 1 END) as total_completed,
  CASE
    WHEN e.program = 'essentials' THEN 104 * 2 -- 104 weeks (2 years) × 2 classes
    WHEN e.program = 'tajweed' THEN 26 * 2    -- 26 weeks (6 months) × 2 classes
    ELSE 0
  END as total_classes,
  CASE
    WHEN e.program = 'essentials' THEN ROUND((COUNT(CASE WHEN cs.status = 'completed' AND cs.enrollment_id = e.id THEN 1 END)::NUMERIC / (104 * 2)) * 100, 1)
    WHEN e.program = 'tajweed' THEN ROUND((COUNT(CASE WHEN cs.status = 'completed' AND cs.enrollment_id = e.id THEN 1 END)::NUMERIC / (26 * 2)) * 100, 1)
    ELSE 0
  END as overall_progress_pct,

  -- Current week info
  MAX(CASE WHEN cs.status = 'completed' AND cs.enrollment_id = e.id THEN cs.week_number END) as current_week,
  MAX(CASE WHEN cs.status = 'completed' AND cs.enrollment_id = e.id THEN cs.academic_year END) as current_year

FROM students s
JOIN enrollments e ON s.id = e.student_id AND e.status = 'active'
LEFT JOIN class_schedules cs ON e.id = cs.enrollment_id
GROUP BY s.id, s.student_id, s.full_name, s.enrolled_date, e.program, e.id;

-- =============================================
-- SUCCESS
-- =============================================
SELECT '✅ Multi-program support added to class_schedules table!' as message;
