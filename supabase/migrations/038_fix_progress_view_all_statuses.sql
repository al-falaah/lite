-- =============================================
-- Fix student_class_progress view to show all students
-- =============================================
-- The previous version filtered by status='enrolled' only,
-- which caused students with other statuses to not appear
-- even though they have schedules

DROP VIEW IF EXISTS student_class_progress;

CREATE VIEW student_class_progress AS
SELECT
  s.id as student_id,
  s.student_id as student_number,
  s.full_name,
  s.enrolled_date,
  s.status,

  -- Year 1 progress
  COUNT(CASE WHEN cs.academic_year = 1 AND cs.status = 'completed' THEN 1 END) as year1_completed,
  52 * 2 as year1_total, -- 52 weeks × 2 classes
  ROUND((COUNT(CASE WHEN cs.academic_year = 1 AND cs.status = 'completed' THEN 1 END)::NUMERIC / (52 * 2)) * 100, 1) as year1_progress_pct,

  -- Year 2 progress
  COUNT(CASE WHEN cs.academic_year = 2 AND cs.status = 'completed' THEN 1 END) as year2_completed,
  52 * 2 as year2_total,
  ROUND((COUNT(CASE WHEN cs.academic_year = 2 AND cs.status = 'completed' THEN 1 END)::NUMERIC / (52 * 2)) * 100, 1) as year2_progress_pct,

  -- Overall progress
  COUNT(CASE WHEN cs.status = 'completed' THEN 1 END) as total_completed,
  104 * 2 as total_classes, -- 104 weeks × 2 classes
  ROUND((COUNT(CASE WHEN cs.status = 'completed' THEN 1 END)::NUMERIC / (104 * 2)) * 100, 1) as overall_progress_pct,

  -- Current week info
  MAX(CASE WHEN cs.status = 'completed' THEN cs.week_number END) as current_week,
  MAX(CASE WHEN cs.status = 'completed' THEN cs.academic_year END) as current_year

FROM students s
LEFT JOIN class_schedules cs ON s.id = cs.student_id
-- REMOVED: WHERE s.status = 'enrolled'
-- Now showing all students regardless of status
GROUP BY s.id, s.student_id, s.full_name, s.enrolled_date, s.status;

COMMENT ON VIEW student_class_progress IS 'Shows class progress for all students regardless of status';

-- =============================================
-- SUCCESS
-- =============================================
SELECT '✅ student_class_progress view updated to show all students!' as message;
