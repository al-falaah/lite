-- =============================================
-- Insert Enrolled Students Test Data
-- =============================================
-- This migration creates test enrolled students with:
-- - Random 6-digit numeric student IDs
-- - Availability preferences (days, times, timezone)
-- - Various payment statuses

-- Clean up any existing test students (optional - remove if you want to keep existing data)
DELETE FROM students WHERE email LIKE '%@enrolled-test.example%';

-- Insert enrolled students with availability data
INSERT INTO students (
  id,
  student_id,
  full_name,
  email,
  phone,
  date_of_birth,
  gender,
  status,
  enrolled_date,
  total_fees,
  total_paid,
  balance_remaining,
  preferred_days,
  preferred_times,
  timezone,
  availability_notes
)
VALUES
  -- Student 1: Auckland, NZ - Morning person, weekdays
  (
    gen_random_uuid(),
    '234567',
    'Amina Hassan',
    'amina.hassan@enrolled-test.example',
    '+64 21 234 5601',
    '1995-03-15',
    'female',
    'enrolled',
    '2025-01-15',
    600.00,
    600.00,
    0.00,
    ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    ARRAY['Morning', 'Afternoon'],
    'Pacific/Auckland',
    'Prefer morning classes due to work schedule. Available most weekday mornings.'
  ),

  -- Student 2: Lagos, Nigeria - Evening availability
  (
    gen_random_uuid(),
    '345678',
    'Ibrahim Musa',
    'ibrahim.musa@enrolled-test.example',
    '+234 802 345 6789',
    '1992-07-22',
    'male',
    'enrolled',
    '2025-01-20',
    600.00,
    300.00,
    300.00,
    ARRAY['Monday', 'Wednesday', 'Friday', 'Saturday'],
    ARRAY['Evening', 'Night'],
    'Africa/Lagos',
    'Work during the day. Evenings and weekends work best for me.'
  ),

  -- Student 3: London, UK - Flexible schedule
  (
    gen_random_uuid(),
    '456789',
    'Khadija Ali',
    'khadija.ali@enrolled-test.example',
    '+44 20 7946 0958',
    '1998-11-08',
    'female',
    'enrolled',
    '2025-02-01',
    600.00,
    600.00,
    0.00,
    ARRAY['Tuesday', 'Thursday', 'Saturday', 'Sunday'],
    ARRAY['Morning', 'Afternoon', 'Evening'],
    'Europe/London',
    'Very flexible schedule. Any time works for me on these days.'
  ),

  -- Student 4: Sydney, Australia - Afternoon/Evening
  (
    gen_random_uuid(),
    '567890',
    'Omar Abdullah',
    'omar.abdullah@enrolled-test.example',
    '+61 2 9876 5432',
    '1990-05-30',
    'male',
    'enrolled',
    '2025-02-10',
    600.00,
    300.00,
    300.00,
    ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday'],
    ARRAY['Afternoon', 'Evening'],
    'Australia/Sydney',
    'Prefer afternoon/evening due to morning commitments.'
  ),

  -- Student 5: New York, USA - Weekend warrior
  (
    gen_random_uuid(),
    '678901',
    'Fatima Ahmed',
    'fatima.ahmed@enrolled-test.example',
    '+1 212 555 1234',
    '1996-09-12',
    'female',
    'enrolled',
    '2025-02-15',
    600.00,
    600.00,
    0.00,
    ARRAY['Friday', 'Saturday', 'Sunday'],
    ARRAY['Morning', 'Afternoon', 'Evening'],
    'America/New_York',
    'Full-time student. Weekends work best, but flexible on times.'
  ),

  -- Student 6: Dubai, UAE - Morning person
  (
    gen_random_uuid(),
    '789012',
    'Yusuf Ibrahim',
    'yusuf.ibrahim@enrolled-test.example',
    '+971 50 123 4567',
    '1993-12-25',
    'male',
    'enrolled',
    '2025-03-01',
    600.00,
    300.00,
    300.00,
    ARRAY['Sunday', 'Monday', 'Tuesday', 'Wednesday'],
    ARRAY['Morning'],
    'Asia/Dubai',
    'Early riser. Morning classes are ideal before work starts.'
  ),

  -- Student 7: Toronto, Canada - Evening availability
  (
    gen_random_uuid(),
    '890123',
    'Zainab Malik',
    'zainab.malik@enrolled-test.example',
    '+1 416 555 7890',
    '1997-04-18',
    'female',
    'enrolled',
    '2025-03-05',
    600.00,
    600.00,
    0.00,
    ARRAY['Monday', 'Wednesday', 'Friday'],
    ARRAY['Evening', 'Night'],
    'America/Toronto',
    'Work 9-5. Evening classes after 6 PM work best.'
  ),

  -- Student 8: Kuala Lumpur, Malaysia - Flexible
  (
    gen_random_uuid(),
    '901234',
    'Hassan Rahman',
    'hassan.rahman@enrolled-test.example',
    '+60 12 345 6789',
    '1994-08-07',
    'male',
    'enrolled',
    '2025-03-10',
    600.00,
    300.00,
    300.00,
    ARRAY['Tuesday', 'Thursday', 'Saturday'],
    ARRAY['Afternoon', 'Evening'],
    'Asia/Kuala_Lumpur',
    'Flexible schedule. Prefer afternoon or evening sessions.'
  ),

  -- Student 9: Auckland, NZ - All-rounder
  (
    gen_random_uuid(),
    '012345',
    'Aisha Mohammed',
    'aisha.mohammed@enrolled-test.example',
    '+64 22 345 6789',
    '1991-02-14',
    'female',
    'enrolled',
    '2025-03-15',
    600.00,
    600.00,
    0.00,
    ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    ARRAY['Morning', 'Afternoon', 'Evening'],
    'Pacific/Auckland',
    'Very flexible! Any time on these days works for me.'
  ),

  -- Student 10: Cape Town, South Africa - Weekend focus
  (
    gen_random_uuid(),
    '123450',
    'Bilal Osman',
    'bilal.osman@enrolled-test.example',
    '+27 21 123 4567',
    '1999-06-30',
    'male',
    'enrolled',
    '2025-03-20',
    600.00,
    300.00,
    300.00,
    ARRAY['Friday', 'Saturday', 'Sunday'],
    ARRAY['Afternoon', 'Evening'],
    'Africa/Johannesburg',
    'Busy during weekdays with work. Weekends are best for studying.'
  );

-- =============================================
-- SUCCESS
-- =============================================
SELECT
  '✅ Enrolled students test data created successfully!' as message,
  COUNT(*) as enrolled_students_created
FROM students
WHERE email LIKE '%@enrolled-test.example%';

-- Show summary by timezone
SELECT
  timezone,
  COUNT(*) as student_count,
  STRING_AGG(full_name, ', ') as students
FROM students
WHERE email LIKE '%@enrolled-test.example%'
GROUP BY timezone
ORDER BY student_count DESC;

-- Show summary by availability
SELECT
  '📊 AVAILABILITY SUMMARY' as info;

SELECT
  unnest(preferred_times) as time_slot,
  COUNT(*) as students_available
FROM students
WHERE email LIKE '%@enrolled-test.example%'
GROUP BY time_slot
ORDER BY students_available DESC;
