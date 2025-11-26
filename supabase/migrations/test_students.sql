-- =============================================
-- Create Test Students (Enrolled Status)
-- =============================================
-- Use this to quickly create test students without going through Stripe

-- Clear existing test data (optional - comment out if you want to keep existing data)
-- DELETE FROM class_schedules;
-- DELETE FROM students WHERE email LIKE '%test@example.com';

-- Insert 5 test students with enrolled status
INSERT INTO students (
  id,
  student_id,
  full_name,
  email,
  phone,
  gender,
  status,
  enrolled_date,
  created_at
) VALUES
  -- Student 1
  (
    gen_random_uuid(),
    CAST(FLOOR(100000 + RANDOM() * 900000) AS TEXT), -- Random 6-digit ID
    'Ahmed Ibrahim',
    'ahmed.test@example.com',
    '+64 21 123 4567',
    'male',
    'enrolled',
    CURRENT_DATE - INTERVAL '30 days', -- Enrolled 30 days ago
    NOW()
  ),

  -- Student 2
  (
    gen_random_uuid(),
    CAST(FLOOR(100000 + RANDOM() * 900000) AS TEXT),
    'Fatima Hassan',
    'fatima.test@example.com',
    '+64 21 234 5678',
    'female',
    'enrolled',
    CURRENT_DATE - INTERVAL '60 days', -- Enrolled 60 days ago
    NOW()
  ),

  -- Student 3
  (
    gen_random_uuid(),
    CAST(FLOOR(100000 + RANDOM() * 900000) AS TEXT),
    'Omar Abdullah',
    'omar.test@example.com',
    '+64 21 345 6789',
    'male',
    'enrolled',
    CURRENT_DATE - INTERVAL '15 days', -- Enrolled 15 days ago
    NOW()
  ),

  -- Student 4
  (
    gen_random_uuid(),
    CAST(FLOOR(100000 + RANDOM() * 900000) AS TEXT),
    'Aisha Rahman',
    'aisha.test@example.com',
    '+64 21 456 7890',
    'female',
    'enrolled',
    CURRENT_DATE - INTERVAL '45 days', -- Enrolled 45 days ago
    NOW()
  ),

  -- Student 5
  (
    gen_random_uuid(),
    CAST(FLOOR(100000 + RANDOM() * 900000) AS TEXT),
    'Yusuf Ali',
    'yusuf.test@example.com',
    '+64 21 567 8901',
    'male',
    'enrolled',
    CURRENT_DATE - INTERVAL '7 days', -- Enrolled 7 days ago
    NOW()
  )

ON CONFLICT (student_id) DO NOTHING; -- Skip if student_id already exists

-- =============================================
-- Verify Test Students Created
-- =============================================
SELECT
  student_id,
  full_name,
  email,
  gender,
  status,
  enrolled_date,
  created_at
FROM students
WHERE email LIKE '%test@example.com'
ORDER BY enrolled_date DESC;

-- =============================================
-- Quick Cleanup Query (if needed later)
-- =============================================
-- To remove all test students and their schedules:
-- DELETE FROM students WHERE email LIKE '%test@example.com';
