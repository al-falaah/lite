-- =============================================
-- Multi-Program Enrollment Testing Script
-- =============================================
-- Run this to set up test scenarios for multi-program enrollment

-- =============================================
-- SCENARIO 1: New student enrolled in Tajweed only
-- =============================================

-- Create student (Tajweed only)
INSERT INTO students (
  student_id,
  full_name,
  email,
  phone,
  date_of_birth,
  gender,
  address,
  city,
  country,
  status
) VALUES (
  'STUD-TAJWEED-001',
  'Fatima Ahmed',
  'fatima.tajweed@test.com',
  '+64 21 123 4567',
  '1995-03-15',
  'female',
  '123 Test Street',
  'Auckland',
  'New Zealand',
  'enrolled'
) ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  status = 'enrolled';

-- Get the student ID
DO $$
DECLARE
  v_student_id UUID;
BEGIN
  -- Get student ID
  SELECT id INTO v_student_id
  FROM students
  WHERE email = 'fatima.tajweed@test.com';

  -- Create Tajweed enrollment
  INSERT INTO enrollments (
    student_id,
    program,
    status,
    enrollment_date
  ) VALUES (
    v_student_id,
    'tajweed',
    'active',
    NOW()
  ) ON CONFLICT (student_id, program) DO UPDATE SET
    status = 'active';

  RAISE NOTICE 'Scenario 1: Created Fatima (Tajweed only) - Student ID: %', v_student_id;
END $$;

-- =============================================
-- SCENARIO 2: Existing Essentials student to enroll in Tajweed
-- =============================================

-- Find an existing essentials student or create one
INSERT INTO students (
  student_id,
  full_name,
  email,
  phone,
  date_of_birth,
  gender,
  address,
  city,
  country,
  status
) VALUES (
  'STUD-MULTI-002',
  'Hassan Ibrahim',
  'hassan.multi@test.com',
  '+64 21 234 5678',
  '1998-07-22',
  'male',
  '456 Test Avenue',
  'Wellington',
  'New Zealand',
  'enrolled'
) ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  status = 'enrolled';

DO $$
DECLARE
  v_student_id UUID;
BEGIN
  -- Get student ID
  SELECT id INTO v_student_id
  FROM students
  WHERE email = 'hassan.multi@test.com';

  -- Create Essentials enrollment
  INSERT INTO enrollments (
    student_id,
    program,
    status,
    enrollment_date
  ) VALUES (
    v_student_id,
    'essentials',
    'active',
    NOW()
  ) ON CONFLICT (student_id, program) DO UPDATE SET
    status = 'active';

  -- Add Tajweed enrollment (this tests multi-program)
  INSERT INTO enrollments (
    student_id,
    program,
    status,
    enrollment_date
  ) VALUES (
    v_student_id,
    'tajweed',
    'active',
    NOW()
  ) ON CONFLICT (student_id, program) DO UPDATE SET
    status = 'active';

  RAISE NOTICE 'Scenario 2: Created Hassan (Essentials + Tajweed) - Student ID: %', v_student_id;
END $$;

-- =============================================
-- SCENARIO 3: Enroll Tajweed student (Fatima) in Essentials
-- =============================================

DO $$
DECLARE
  v_student_id UUID;
BEGIN
  -- Get Fatima's student ID
  SELECT id INTO v_student_id
  FROM students
  WHERE email = 'fatima.tajweed@test.com';

  -- Add Essentials enrollment to Fatima
  INSERT INTO enrollments (
    student_id,
    program,
    status,
    enrollment_date
  ) VALUES (
    v_student_id,
    'essentials',
    'active',
    NOW()
  ) ON CONFLICT (student_id, program) DO UPDATE SET
    status = 'active';

  RAISE NOTICE 'Scenario 3: Enrolled Fatima in Essentials (now has both programs) - Student ID: %', v_student_id;
END $$;

-- =============================================
-- Verification: Show all test students and their enrollments
-- =============================================

SELECT
  s.student_id,
  s.full_name,
  s.email,
  s.status as student_status,
  e.program,
  e.status as enrollment_status,
  e.enrollment_date
FROM students s
LEFT JOIN enrollments e ON e.student_id = s.id
WHERE s.email IN (
  'fatima.tajweed@test.com',
  'hassan.multi@test.com'
)
ORDER BY s.student_id, e.program;

-- =============================================
-- Summary
-- =============================================

SELECT '✅ Test data created!' as message;
SELECT '📋 Scenario 1: Fatima Ahmed - Tajweed only (initially)' as test_case;
SELECT '📋 Scenario 2: Hassan Ibrahim - Essentials + Tajweed (both programs)' as test_case;
SELECT '📋 Scenario 3: Fatima Ahmed - Now enrolled in both Tajweed + Essentials' as test_case;
SELECT '🔍 Check the admin dashboard to schedule classes for these students!' as action;
