-- =============================================
-- Debug and Create Missing Enrollments
-- =============================================

-- First, let's see what students have schedules but no enrollments
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(DISTINCT s.id) INTO v_count
  FROM students s
  WHERE EXISTS (
    SELECT 1 FROM class_schedules cs WHERE cs.student_id = s.id
  )
  AND NOT EXISTS (
    SELECT 1 FROM enrollments e WHERE e.student_id = s.id
  );

  RAISE NOTICE 'Students with schedules but no enrollments: %', v_count;
END $$;

-- Now insert enrollments for ALL students with class schedules
INSERT INTO enrollments (
  student_id,
  program,
  payment_type,
  enrolled_date,
  status,
  total_fees,
  total_paid,
  balance_remaining,
  program_duration_months,
  expected_graduation_date
)
SELECT DISTINCT
  s.id as student_id,
  'essentials' as program,
  'monthly' as payment_type,
  COALESCE(s.enrolled_date, CURRENT_DATE) as enrolled_date,
  CASE
    WHEN s.status = 'enrolled' THEN 'active'
    WHEN s.status = 'graduated' THEN 'completed'
    WHEN s.status = 'withdrawn' THEN 'withdrawn'
    ELSE 'active'
  END as status,
  600.00 as total_fees,
  COALESCE(
    (SELECT SUM(amount) FROM payments WHERE student_id = s.id AND status = 'verified'),
    0
  ) as total_paid,
  600.00 - COALESCE(
    (SELECT SUM(amount) FROM payments WHERE student_id = s.id AND status = 'verified'),
    0
  ) as balance_remaining,
  24 as program_duration_months,
  (COALESCE(s.enrolled_date, CURRENT_DATE)::date + INTERVAL '24 months')::date as expected_graduation_date
FROM students s
WHERE EXISTS (
  SELECT 1 FROM class_schedules cs WHERE cs.student_id = s.id
)
AND NOT EXISTS (
  SELECT 1 FROM enrollments e WHERE e.student_id = s.id
);

-- Show results
DO $$
DECLARE
  v_total_enrollments INTEGER;
  v_total_students INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total_enrollments FROM enrollments;
  SELECT COUNT(DISTINCT student_id) INTO v_total_students FROM enrollments;

  RAISE NOTICE '==============================';
  RAISE NOTICE 'Total enrollments created: %', v_total_enrollments;
  RAISE NOTICE 'Total students with enrollments: %', v_total_students;
  RAISE NOTICE '==============================';
END $$;

-- Verify Yesirat specifically
SELECT
  s.student_id,
  s.full_name,
  COUNT(e.id) as enrollment_count,
  COUNT(cs.id) as schedule_count
FROM students s
LEFT JOIN enrollments e ON e.student_id = s.id
LEFT JOIN class_schedules cs ON cs.student_id = s.id
WHERE s.student_id = '621370'
GROUP BY s.id, s.student_id, s.full_name;
