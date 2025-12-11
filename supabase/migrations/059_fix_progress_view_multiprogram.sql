-- =============================================
-- Fix student_class_progress view for multi-program support
-- =============================================
-- The previous version had hardcoded totals for Essential program only
-- This version:
-- 1. Calculates totals dynamically based on actual schedules
-- 2. Is program-aware (shows progress per program per student)
-- 3. Handles multiple enrollments per student

DROP VIEW IF EXISTS student_class_progress;

CREATE VIEW student_class_progress AS
SELECT
  s.id as student_id,
  s.student_id as student_number,
  s.full_name,
  s.enrolled_date,
  s.status,
  e.program,

  -- Year 1 progress (dynamically calculated from actual schedules)
  COUNT(CASE WHEN cs.academic_year = 1 AND cs.status = 'completed' THEN 1 END) as year1_completed,
  COALESCE(COUNT(CASE WHEN cs.academic_year = 1 THEN 1 END), 0) as year1_total,
  CASE
    WHEN COUNT(CASE WHEN cs.academic_year = 1 THEN 1 END) > 0
    THEN ROUND((COUNT(CASE WHEN cs.academic_year = 1 AND cs.status = 'completed' THEN 1 END)::NUMERIC / COUNT(CASE WHEN cs.academic_year = 1 THEN 1 END)) * 100, 1)
    ELSE 0
  END as year1_progress_pct,

  -- Year 2 progress (dynamically calculated from actual schedules)
  COUNT(CASE WHEN cs.academic_year = 2 AND cs.status = 'completed' THEN 1 END) as year2_completed,
  COALESCE(COUNT(CASE WHEN cs.academic_year = 2 THEN 1 END), 0) as year2_total,
  CASE
    WHEN COUNT(CASE WHEN cs.academic_year = 2 THEN 1 END) > 0
    THEN ROUND((COUNT(CASE WHEN cs.academic_year = 2 AND cs.status = 'completed' THEN 1 END)::NUMERIC / COUNT(CASE WHEN cs.academic_year = 2 THEN 1 END)) * 100, 1)
    ELSE 0
  END as year2_progress_pct,

  -- Overall progress (all years combined)
  COUNT(CASE WHEN cs.status = 'completed' THEN 1 END) as total_completed,
  COALESCE(COUNT(cs.id), 0) as total_classes,
  CASE
    WHEN COUNT(cs.id) > 0
    THEN ROUND((COUNT(CASE WHEN cs.status = 'completed' THEN 1 END)::NUMERIC / COUNT(cs.id)) * 100, 1)
    ELSE 0
  END as overall_progress_pct,

  -- Current week info
  MAX(CASE WHEN cs.status = 'completed' THEN cs.week_number END) as current_week,
  MAX(CASE WHEN cs.status = 'completed' THEN cs.academic_year END) as current_year

FROM students s
INNER JOIN enrollments e ON s.id = e.student_id
LEFT JOIN class_schedules cs ON s.id = cs.student_id AND e.program = cs.program
GROUP BY s.id, s.student_id, s.full_name, s.enrolled_date, s.status, e.program;

COMMENT ON VIEW student_class_progress IS 'Shows class progress per program for each student with dynamic totals';

-- =============================================
-- Add RLS policy for the view
-- =============================================
ALTER VIEW student_class_progress SET (security_invoker = true);

-- =============================================
-- SUCCESS
-- =============================================
SELECT '✅ student_class_progress view updated for multi-program support with dynamic totals!' as message;
