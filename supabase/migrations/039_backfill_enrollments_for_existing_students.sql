-- =============================================
-- Backfill enrollments for existing students
-- =============================================
-- Create enrollment records for students who don't have them yet
-- This handles the migration from single-program to multi-program system

-- Insert enrollments for existing students who have schedules but no enrollment
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
  -- Only for students who have schedules (indicating they were enrolled before)
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
  );

-- =============================================
-- SUCCESS
-- =============================================
SELECT
  COUNT(*) as students_migrated,
  '✅ Existing students migrated to enrollments table!' as message
FROM enrollments
WHERE created_at >= NOW() - INTERVAL '1 minute';
