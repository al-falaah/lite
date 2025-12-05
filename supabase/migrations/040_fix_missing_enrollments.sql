-- =============================================
-- Fix missing enrollments for students with schedules
-- =============================================
-- Some students have class schedules but no enrollments
-- This migration ensures ALL students with schedules have enrollments

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
  'essentials' as program, -- Default to essentials for existing students
  'monthly' as payment_type, -- Default payment type
  s.enrolled_date,
  CASE
    WHEN s.status = 'enrolled' THEN 'active'
    WHEN s.status = 'graduated' THEN 'completed'
    WHEN s.status = 'withdrawn' THEN 'withdrawn'
    ELSE 'active'
  END as status,
  600.00 as total_fees, -- 2-year essentials program fee
  COALESCE(
    (SELECT SUM(amount)
     FROM payments
     WHERE student_id = s.id AND status = 'verified'),
    0
  ) as total_paid,
  600.00 - COALESCE(
    (SELECT SUM(amount)
     FROM payments
     WHERE student_id = s.id AND status = 'verified'),
    0
  ) as balance_remaining,
  24 as program_duration_months, -- 2 years
  (s.enrolled_date::date + INTERVAL '24 months')::date as expected_graduation_date
FROM students s
WHERE
  -- Only for students who have schedules
  EXISTS (
    SELECT 1
    FROM class_schedules cs
    WHERE cs.student_id = s.id
  )
  -- But don't have an enrollment record yet
  AND NOT EXISTS (
    SELECT 1
    FROM enrollments e
    WHERE e.student_id = s.id
  )
ON CONFLICT DO NOTHING;

-- =============================================
-- SUCCESS
-- =============================================
SELECT
  COUNT(*) as students_with_missing_enrollments,
  '✅ Missing enrollments fixed!' as message
FROM enrollments
WHERE created_at >= NOW() - INTERVAL '1 minute';
