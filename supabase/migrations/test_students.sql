-- =============================================
-- Delete All Students and Create 12 Test Students
-- =============================================
-- This script clears all students and generates 12 random test students

-- Step 1: Delete all existing students (this will cascade to class_schedules)
DELETE FROM students;

-- Step 2: Insert 12 test students with enrolled status
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
    CAST(FLOOR(100000 + RANDOM() * 900000) AS TEXT),
    'Ahmed Ibrahim',
    'ahmed.test@example.com',
    '+64 21 123 4567',
    'male',
    'enrolled',
    CURRENT_DATE - INTERVAL '45 days',
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
    CURRENT_DATE - INTERVAL '30 days',
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
    CURRENT_DATE - INTERVAL '60 days',
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
    CURRENT_DATE - INTERVAL '15 days',
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
    CURRENT_DATE - INTERVAL '90 days',
    NOW()
  ),

  -- Student 6
  (
    gen_random_uuid(),
    CAST(FLOOR(100000 + RANDOM() * 900000) AS TEXT),
    'Mariam Khan',
    'mariam.test@example.com',
    '+64 21 678 9012',
    'female',
    'enrolled',
    CURRENT_DATE - INTERVAL '20 days',
    NOW()
  ),

  -- Student 7
  (
    gen_random_uuid(),
    CAST(FLOOR(100000 + RANDOM() * 900000) AS TEXT),
    'Hassan Mohammed',
    'hassan.test@example.com',
    '+64 21 789 0123',
    'male',
    'enrolled',
    CURRENT_DATE - INTERVAL '75 days',
    NOW()
  ),

  -- Student 8
  (
    gen_random_uuid(),
    CAST(FLOOR(100000 + RANDOM() * 900000) AS TEXT),
    'Zainab Ahmed',
    'zainab.test@example.com',
    '+64 21 890 1234',
    'female',
    'enrolled',
    CURRENT_DATE - INTERVAL '10 days',
    NOW()
  ),

  -- Student 9
  (
    gen_random_uuid(),
    CAST(FLOOR(100000 + RANDOM() * 900000) AS TEXT),
    'Ibrahim Malik',
    'ibrahim.test@example.com',
    '+64 21 901 2345',
    'male',
    'enrolled',
    CURRENT_DATE - INTERVAL '50 days',
    NOW()
  ),

  -- Student 10
  (
    gen_random_uuid(),
    CAST(FLOOR(100000 + RANDOM() * 900000) AS TEXT),
    'Khadija Hussain',
    'khadija.test@example.com',
    '+64 21 012 3456',
    'female',
    'enrolled',
    CURRENT_DATE - INTERVAL '25 days',
    NOW()
  ),

  -- Student 11
  (
    gen_random_uuid(),
    CAST(FLOOR(100000 + RANDOM() * 900000) AS TEXT),
    'Abdullah Farooq',
    'abdullah.test@example.com',
    '+64 21 111 2222',
    'male',
    'enrolled',
    CURRENT_DATE - INTERVAL '5 days',
    NOW()
  ),

  -- Student 12
  (
    gen_random_uuid(),
    CAST(FLOOR(100000 + RANDOM() * 900000) AS TEXT),
    'Sumaya Khalid',
    'sumaya.test@example.com',
    '+64 21 222 3333',
    'female',
    'enrolled',
    CURRENT_DATE - INTERVAL '35 days',
    NOW()
  );

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
-- Notes
-- =============================================
-- * All 12 students have 'enrolled' status
-- * Mix of 6 male and 6 female students
-- * Varied enrollment dates from 5 to 90 days ago
-- * Random 6-digit student IDs
-- * Test email addresses for easy identification
-- * Deleting students will cascade to class_schedules (no orphaned records)
