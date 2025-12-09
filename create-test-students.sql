-- =============================================
-- Create Multi-Program Test Students
-- Run this in Supabase SQL Editor
-- =============================================

-- Clean up existing test students
DELETE FROM students WHERE email IN ('fatima.tajweed@test.com', 'hassan.multi@test.com');

-- =============================================
-- Scenario 1: Fatima Ahmed - Tajweed only (initially)
-- =============================================
WITH new_student AS (
  INSERT INTO students (
    student_id,
    full_name,
    email,
    phone,
    date_of_birth,
    enrolled_date,
    status,
    program
  ) VALUES (
    '100001',
    'Fatima Ahmed',
    'fatima.tajweed@test.com',
    '+64 21 123 4567',
    '1995-03-15',
    CURRENT_DATE,
    'enrolled',
    'tajweed'
  )
  RETURNING id, full_name
)
INSERT INTO enrollments (
  student_id,
  program,
  status,
  enrolled_date,
  program_duration_months,
  total_fees,
  payment_type
)
SELECT
  id,
  'tajweed',
  'active',
  CURRENT_DATE,
  6,
  120,
  'one-time'
FROM new_student;

SELECT 'Created Fatima Ahmed (Tajweed only)' as status;

-- =============================================
-- Scenario 2: Hassan Ibrahim - Essentials + Tajweed
-- =============================================
WITH new_student AS (
  INSERT INTO students (
    student_id,
    full_name,
    email,
    phone,
    date_of_birth,
    enrolled_date,
    status,
    program
  ) VALUES (
    '100002',
    'Hassan Ibrahim',
    'hassan.multi@test.com',
    '+64 21 234 5678',
    '1998-07-22',
    CURRENT_DATE,
    'enrolled',
    'essentials'
  )
  RETURNING id, full_name
)
INSERT INTO enrollments (
  student_id,
  program,
  status,
  enrolled_date,
  program_duration_months,
  total_fees,
  payment_type
)
SELECT
  id,
  program,
  'active',
  CURRENT_DATE,
  CASE WHEN program = 'tajweed' THEN 6 ELSE 24 END,
  CASE WHEN program = 'tajweed' THEN 120 ELSE 550 END,
  CASE WHEN program = 'tajweed' THEN 'one-time' ELSE 'annual' END
FROM new_student
CROSS JOIN (VALUES ('essentials'), ('tajweed')) AS programs(program);

SELECT 'Created Hassan Ibrahim (Essentials + Tajweed)' as status;

-- =============================================
-- Scenario 3: Enroll Fatima in Essentials too
-- =============================================
INSERT INTO enrollments (
  student_id,
  program,
  status,
  enrolled_date,
  program_duration_months,
  total_fees,
  payment_type
)
SELECT
  id,
  'essentials',
  'active',
  CURRENT_DATE,
  24,
  550,
  'annual'
FROM students
WHERE email = 'fatima.tajweed@test.com';

SELECT 'Enrolled Fatima in Essentials (now has both programs)' as status;

-- =============================================
-- Scenario 4: Mark enrollments as paid for testing
-- =============================================
UPDATE enrollments
SET
  total_paid = total_fees,
  balance_remaining = 0,
  updated_at = NOW()
WHERE student_id IN (
  SELECT id FROM students
  WHERE email IN ('fatima.tajweed@test.com', 'hassan.multi@test.com')
);

SELECT 'Marked all enrollments as fully paid for testing' as status;

-- =============================================
-- Verification
-- =============================================
SELECT
  s.student_id,
  s.full_name,
  s.email,
  s.status as student_status,
  e.program,
  e.status as enrollment_status,
  e.total_fees,
  e.total_paid,
  e.balance_remaining
FROM students s
LEFT JOIN enrollments e ON e.student_id = s.id
WHERE s.email IN ('fatima.tajweed@test.com', 'hassan.multi@test.com')
ORDER BY s.student_id, e.program;

SELECT '===== Test Data Created Successfully! =====' as message;
SELECT 'Fatima Ahmed: Tajweed + Essentials' as scenario_1;
SELECT 'Hassan Ibrahim: Essentials + Tajweed' as scenario_2;
SELECT 'Go to Admin Dashboard > Class Availability & Scheduling > Students tab' as next_step;
