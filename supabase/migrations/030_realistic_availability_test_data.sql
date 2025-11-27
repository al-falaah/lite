-- =============================================
-- REALISTIC AVAILABILITY TEST DATA
-- =============================================
-- This creates a real-life scenario to test the smart availability calendar
-- with partial bookings, conflicts, and various scheduling situations

-- =============================================
-- 1. CLEAN EXISTING DATA
-- =============================================
DELETE FROM class_schedules WHERE student_id IN (
  SELECT id FROM students WHERE email LIKE '%@test.example%'
);
DELETE FROM students WHERE email LIKE '%@test.example%';
DELETE FROM applications WHERE email LIKE '%@test.example%';

-- =============================================
-- 2. CREATE ENROLLED STUDENTS
-- =============================================
-- 10 enrolled students with diverse schedules

INSERT INTO students (id, student_id, full_name, email, phone, date_of_birth, status, enrolled_date, total_fees, total_paid, balance_remaining)
VALUES
  -- Year 1 Students (fully paid)
  (gen_random_uuid(), 'STU-2024-00101', 'Sarah Ahmed', 'sarah.ahmed@test.example', '+64 21 100 0001', '1995-01-15', 'enrolled', '2024-01-10', 600.00, 600.00, 0.00),
  (gen_random_uuid(), 'STU-2024-00102', 'Mohammed Hassan', 'mohammed.hassan@test.example', '+64 22 100 0002', '1993-03-22', 'enrolled', '2024-01-15', 600.00, 600.00, 0.00),
  (gen_random_uuid(), 'STU-2024-00103', 'Aisha Rahman', 'aisha.rahman@test.example', '+64 27 100 0003', '1996-06-08', 'enrolled', '2024-01-20', 600.00, 600.00, 0.00),
  (gen_random_uuid(), 'STU-2024-00104', 'Omar Khalid', 'omar.khalid@test.example', '+64 21 100 0004', '1992-09-14', 'enrolled', '2024-02-01', 600.00, 600.00, 0.00),
  (gen_random_uuid(), 'STU-2024-00105', 'Fatima Yusuf', 'fatima.yusuf@test.example', '+64 22 100 0005', '1997-11-30', 'enrolled', '2024-02-05', 600.00, 600.00, 0.00),

  -- Year 1 Students (partial payment)
  (gen_random_uuid(), 'STU-2024-00106', 'Ibrahim Ali', 'ibrahim.ali@test.example', '+64 27 100 0006', '1994-04-18', 'enrolled', '2024-02-10', 600.00, 300.00, 300.00),
  (gen_random_uuid(), 'STU-2024-00107', 'Zainab Malik', 'zainab.malik@test.example', '+64 21 100 0007', '1998-07-25', 'enrolled', '2024-02-15', 600.00, 300.00, 300.00),
  (gen_random_uuid(), 'STU-2024-00108', 'Hassan Abdullah', 'hassan.abdullah@test.example', '+64 22 100 0008', '1991-12-05', 'enrolled', '2024-03-01', 600.00, 300.00, 300.00),
  (gen_random_uuid(), 'STU-2024-00109', 'Khadija Said', 'khadija.said@test.example', '+64 27 100 0009', '1999-02-28', 'enrolled', '2024-03-05', 600.00, 300.00, 300.00),
  (gen_random_uuid(), 'STU-2024-00110', 'Yusuf Ibrahim', 'yusuf.ibrahim@test.example', '+64 21 100 0010', '1990-08-12', 'enrolled', '2024-03-10', 600.00, 300.00, 300.00);

-- =============================================
-- 3. CREATE REALISTIC CLASS SCHEDULES
-- =============================================
-- Designed to show various scenarios:
-- - Fully booked slots
-- - Partially booked slots (showing partial availability)
-- - Empty slots
-- - Multiple classes in same time block

-- MONDAY MORNING (6-12 PM) - PARTIALLY BOOKED
-- Sarah: 7:00-9:00 AM (2h main class) - leaves 6-7 AM and 9-12 PM free
INSERT INTO class_schedules (student_id, academic_year, week_number, class_type, day_of_week, class_time, status)
SELECT id, 1, 12, 'main', 'Monday', '07:00:00', 'scheduled' FROM students WHERE email = 'sarah.ahmed@test.example';

-- MONDAY AFTERNOON (12-5 PM) - FULLY BOOKED
-- Mohammed: 12:00-2:00 PM (2h main class)
INSERT INTO class_schedules (student_id, academic_year, week_number, class_type, day_of_week, class_time, status)
SELECT id, 1, 12, 'main', 'Monday', '12:00:00', 'scheduled' FROM students WHERE email = 'mohammed.hassan@test.example';
-- Aisha: 2:00-2:30 PM (30min short class)
INSERT INTO class_schedules (student_id, academic_year, week_number, class_type, day_of_week, class_time, status)
SELECT id, 1, 12, 'short', 'Monday', '14:00:00', 'scheduled' FROM students WHERE email = 'aisha.rahman@test.example';
-- Omar: 3:00-5:00 PM (2h main class)
INSERT INTO class_schedules (student_id, academic_year, week_number, class_type, day_of_week, class_time, status)
SELECT id, 1, 12, 'main', 'Monday', '15:00:00', 'scheduled' FROM students WHERE email = 'omar.khalid@test.example';

-- MONDAY EVENING (5-9 PM) - EMPTY (OPPORTUNITY!)

-- TUESDAY MORNING (6-12 PM) - PARTIALLY BOOKED
-- Fatima: 10:00-12:00 PM (2h main) - leaves 6-10 AM free
INSERT INTO class_schedules (student_id, academic_year, week_number, class_type, day_of_week, class_time, status)
SELECT id, 1, 12, 'main', 'Tuesday', '10:00:00', 'scheduled' FROM students WHERE email = 'fatima.yusuf@test.example';

-- TUESDAY AFTERNOON (12-5 PM) - EMPTY (OPPORTUNITY!)

-- TUESDAY EVENING (5-9 PM) - PARTIALLY BOOKED
-- Ibrahim: 7:00-9:00 PM (2h main) - leaves 5-7 PM free
INSERT INTO class_schedules (student_id, academic_year, week_number, class_type, day_of_week, class_time, status)
SELECT id, 1, 12, 'main', 'Tuesday', '19:00:00', 'scheduled' FROM students WHERE email = 'ibrahim.ali@test.example';

-- WEDNESDAY MORNING (6-12 PM) - PARTIALLY BOOKED
-- Zainab: 8:00-10:00 AM (2h main) - leaves 6-8 AM and 10-12 PM free
INSERT INTO class_schedules (student_id, academic_year, week_number, class_type, day_of_week, class_time, status)
SELECT id, 1, 12, 'main', 'Wednesday', '08:00:00', 'scheduled' FROM students WHERE email = 'zainab.malik@test.example';

-- WEDNESDAY AFTERNOON (12-5 PM) - PARTIALLY BOOKED
-- Hassan: 1:30-2:00 PM (30min short) - leaves lots of time free
INSERT INTO class_schedules (student_id, academic_year, week_number, class_type, day_of_week, class_time, status)
SELECT id, 1, 12, 'short', 'Wednesday', '13:30:00', 'scheduled' FROM students WHERE email = 'hassan.abdullah@test.example';

-- WEDNESDAY EVENING (5-9 PM) - FULLY BOOKED
-- Khadija: 5:00-7:00 PM (2h main)
INSERT INTO class_schedules (student_id, academic_year, week_number, class_type, day_of_week, class_time, status)
SELECT id, 1, 12, 'main', 'Wednesday', '17:00:00', 'scheduled' FROM students WHERE email = 'khadija.said@test.example';
-- Yusuf: 7:00-9:00 PM (2h main)
INSERT INTO class_schedules (student_id, academic_year, week_number, class_type, day_of_week, class_time, status)
SELECT id, 1, 12, 'main', 'Wednesday', '19:00:00', 'scheduled' FROM students WHERE email = 'yusuf.ibrahim@test.example';

-- THURSDAY MORNING (6-12 PM) - EMPTY (OPPORTUNITY!)

-- THURSDAY AFTERNOON (12-5 PM) - PARTIALLY BOOKED
-- Sarah (short class): 3:00-3:30 PM
INSERT INTO class_schedules (student_id, academic_year, week_number, class_type, day_of_week, class_time, status)
SELECT id, 1, 12, 'short', 'Thursday', '15:00:00', 'scheduled' FROM students WHERE email = 'sarah.ahmed@test.example';

-- THURSDAY EVENING (5-9 PM) - PARTIALLY BOOKED
-- Mohammed (short class): 6:00-6:30 PM
INSERT INTO class_schedules (student_id, academic_year, week_number, class_type, day_of_week, class_time, status)
SELECT id, 1, 12, 'short', 'Thursday', '18:00:00', 'scheduled' FROM students WHERE email = 'mohammed.hassan@test.example';

-- FRIDAY MORNING (6-12 PM) - FULLY BOOKED
-- Omar (short): 6:00-6:30 AM
INSERT INTO class_schedules (student_id, academic_year, week_number, class_type, day_of_week, class_time, status)
SELECT id, 1, 12, 'short', 'Friday', '06:00:00', 'scheduled' FROM students WHERE email = 'omar.khalid@test.example';
-- Fatima (short): 8:00-8:30 AM
INSERT INTO class_schedules (student_id, academic_year, week_number, class_type, day_of_week, class_time, status)
SELECT id, 1, 12, 'short', 'Friday', '08:00:00', 'scheduled' FROM students WHERE email = 'fatima.yusuf@test.example';
-- Ibrahim (short): 10:00-10:30 AM
INSERT INTO class_schedules (student_id, academic_year, week_number, class_type, day_of_week, class_time, status)
SELECT id, 1, 12, 'short', 'Friday', '10:00:00', 'scheduled' FROM students WHERE email = 'ibrahim.ali@test.example';

-- FRIDAY AFTERNOON (12-5 PM) - EMPTY (OPPORTUNITY!)

-- FRIDAY EVENING (5-9 PM) - PARTIALLY BOOKED
-- Zainab (short): 5:30-6:00 PM
INSERT INTO class_schedules (student_id, academic_year, week_number, class_type, day_of_week, class_time, status)
SELECT id, 1, 12, 'short', 'Friday', '17:30:00', 'scheduled' FROM students WHERE email = 'zainab.malik@test.example';

-- SATURDAY MORNING (6-12 PM) - PARTIALLY BOOKED
-- Hassan: 9:00-11:00 AM (2h main)
INSERT INTO class_schedules (student_id, academic_year, week_number, class_type, day_of_week, class_time, status)
SELECT id, 1, 12, 'main', 'Saturday', '09:00:00', 'scheduled' FROM students WHERE email = 'hassan.abdullah@test.example';

-- SATURDAY AFTERNOON (12-5 PM) - PARTIALLY BOOKED
-- Khadija (short): 2:00-2:30 PM
INSERT INTO class_schedules (student_id, academic_year, week_number, class_type, day_of_week, class_time, status)
SELECT id, 1, 12, 'short', 'Saturday', '14:00:00', 'scheduled' FROM students WHERE email = 'khadija.said@test.example';

-- SATURDAY EVENING (5-9 PM) - EMPTY (OPPORTUNITY!)

-- SUNDAY MORNING (6-12 PM) - PARTIALLY BOOKED
-- Yusuf (short): 7:00-7:30 AM
INSERT INTO class_schedules (student_id, academic_year, week_number, class_type, day_of_week, class_time, status)
SELECT id, 1, 12, 'short', 'Sunday', '07:00:00', 'scheduled' FROM students WHERE email = 'yusuf.ibrahim@test.example';

-- SUNDAY AFTERNOON (12-5 PM) - EMPTY (OPPORTUNITY!)

-- SUNDAY EVENING (5-9 PM) - EMPTY (OPPORTUNITY!)

-- =============================================
-- 4. CREATE PENDING APPLICATIONS WITH VARIOUS SCENARIOS
-- =============================================

-- APPLICANT 1: Perfect fit - wants empty Monday evening
INSERT INTO applications (full_name, email, phone, date_of_birth, gender, can_read_quran, has_studied_arabic, motivation, status, preferred_days, preferred_times, timezone, availability_notes, submitted_at)
VALUES (
  'Layla Ahmed',
  'layla.ahmed@test.example',
  '+64 21 200 0001',
  '1995-05-20',
  'female',
  true,
  false,
  'Want to deepen my Islamic knowledge and improve Quran recitation with tajweed.',
  'pending',
  ARRAY['Monday', 'Wednesday'],
  ARRAY['Evening'],
  'Pacific/Auckland',
  'Prefer Monday evening after work, 5-7 PM is perfect',
  NOW() - INTERVAL '2 days'
);

-- APPLICANT 2: Partial conflict - wants Monday morning (Sarah is 7-9 AM, so 6-7 AM and 9-12 PM are free!)
INSERT INTO applications (full_name, email, phone, date_of_birth, gender, can_read_quran, has_studied_arabic, motivation, status, preferred_days, preferred_times, timezone, availability_notes, submitted_at)
VALUES (
  'Bilal Mansoor',
  'bilal.mansoor@test.example',
  '+64 22 200 0002',
  '1992-08-15',
  'male',
  true,
  true,
  'Seeking to advance my Arabic comprehension and deepen my Islamic studies.',
  'pending',
  ARRAY['Monday', 'Thursday'],
  ARRAY['Morning'],
  'Pacific/Auckland',
  'Early morning works best, prefer 6-9 AM before work',
  NOW() - INTERVAL '3 days'
);

-- APPLICANT 3: Full conflict - wants Monday afternoon (completely booked 12-5 PM!)
INSERT INTO applications (full_name, email, phone, date_of_birth, gender, can_read_quran, has_studied_arabic, motivation, status, preferred_days, preferred_times, timezone, availability_notes, submitted_at)
VALUES (
  'Amina Farooq',
  'amina.farooq@test.example',
  '+64 27 200 0003',
  '1997-03-10',
  'female',
  false,
  false,
  'New Muslim wanting to learn the essentials of Islam and how to read the Quran.',
  'pending',
  ARRAY['Monday', 'Wednesday'],
  ARRAY['Afternoon'],
  'Pacific/Auckland',
  'Only available 12-3 PM on weekdays due to work schedule',
  NOW() - INTERVAL '5 days'
);

-- APPLICANT 4: Partial fit - wants Tuesday morning (Fatima is 10-12 PM, so 6-10 AM free)
INSERT INTO applications (full_name, email, phone, date_of_birth, gender, can_read_quran, has_studied_arabic, motivation, status, preferred_days, preferred_times, timezone, availability_notes, submitted_at)
VALUES (
  'Tariq Hassan',
  'tariq.hassan@test.example',
  '+64 21 200 0004',
  '1994-11-25',
  'male',
  true,
  true,
  'Looking to perfect my tajweed and enhance my understanding of classical Arabic.',
  'pending',
  ARRAY['Tuesday', 'Friday'],
  ARRAY['Morning'],
  'Pacific/Auckland',
  'Free 6-10 AM on weekdays',
  NOW() - INTERVAL '1 day'
);

-- APPLICANT 5: Perfect fit - wants Tuesday afternoon (completely empty!)
INSERT INTO applications (full_name, email, phone, date_of_birth, gender, can_read_quran, has_studied_arabic, motivation, status, preferred_days, preferred_times, timezone, availability_notes, submitted_at)
VALUES (
  'Safiya Omar',
  'safiya.omar@test.example',
  '+64 22 200 0005',
  '1996-07-08',
  'female',
  true,
  false,
  'Want to strengthen my Islamic knowledge and learn to read Quran with proper pronunciation.',
  'pending',
  ARRAY['Tuesday', 'Thursday'],
  ARRAY['Afternoon'],
  'Pacific/Auckland',
  'Most flexible on Tuesday afternoons, 1-4 PM works great',
  NOW() - INTERVAL '4 days'
);

-- APPLICANT 6: International - USA West Coast, wants evening NZ = morning USA
INSERT INTO applications (full_name, email, phone, date_of_birth, gender, can_read_quran, has_studied_arabic, motivation, status, preferred_days, preferred_times, timezone, availability_notes, submitted_at)
VALUES (
  'Noor Karim',
  'noor.karim@test.example',
  '+1 415 200 0006',
  '1993-12-15',
  'female',
  false,
  false,
  'Want to learn Islamic fundamentals and connect with knowledgeable teachers online.',
  'pending',
  ARRAY['Monday', 'Wednesday', 'Friday'],
  ARRAY['Evening', 'Night'],
  'America/Los_Angeles',
  'Your evening/night = my morning, works perfectly with my schedule',
  NOW() - INTERVAL '6 days'
);

-- APPLICANT 7: Partial conflict - wants Wednesday evening (fully booked 5-9 PM!)
INSERT INTO applications (full_name, email, phone, date_of_birth, gender, can_read_quran, has_studied_arabic, motivation, status, preferred_days, preferred_times, timezone, availability_notes, submitted_at)
VALUES (
  'Ahmed Yusuf',
  'ahmed.yusuf@test.example',
  '+64 27 200 0007',
  '1991-04-30',
  'male',
  true,
  false,
  'Seeking systematic Islamic education to strengthen my faith and understanding.',
  'pending',
  ARRAY['Wednesday', 'Saturday'],
  ARRAY['Evening'],
  'Pacific/Auckland',
  'Only free after 6 PM on weekdays',
  NOW() - INTERVAL '7 days'
);

-- APPLICANT 8: Perfect fit - wants Thursday morning (completely empty!)
INSERT INTO applications (full_name, email, phone, date_of_birth, gender, can_read_quran, has_studied_arabic, motivation, status, preferred_days, preferred_times, timezone, availability_notes, submitted_at)
VALUES (
  'Mariam Ali',
  'mariam.ali@test.example',
  '+64 21 200 0008',
  '1998-09-18',
  'female',
  false,
  true,
  'Want to combine my Arabic language skills with comprehensive Islamic knowledge.',
  'pending',
  ARRAY['Thursday', 'Sunday'],
  ARRAY['Morning'],
  'Pacific/Auckland',
  'Thursday mornings 7-10 AM are best for me',
  NOW() - INTERVAL '8 days'
);

-- APPLICANT 9: Weekend warrior - wants Saturday morning (partially booked)
INSERT INTO applications (full_name, email, phone, date_of_birth, gender, can_read_quran, has_studied_arabic, motivation, status, preferred_days, preferred_times, timezone, availability_notes, submitted_at)
VALUES (
  'Rashid Ibrahim',
  'rashid.ibrahim@test.example',
  '+64 22 200 0009',
  '1990-02-28',
  'male',
  true,
  true,
  'Seeking advanced Islamic studies and want to improve my Quranic Arabic proficiency.',
  'pending',
  ARRAY['Saturday', 'Sunday'],
  ARRAY['Morning', 'Afternoon'],
  'Pacific/Auckland',
  'Only free on weekends, prefer Saturday mornings 6-9 AM or 11 AM-2 PM',
  NOW() - INTERVAL '9 days'
);

-- APPLICANT 10: Very flexible - multiple time slots
INSERT INTO applications (full_name, email, phone, date_of_birth, gender, can_read_quran, has_studied_arabic, motivation, status, preferred_days, preferred_times, timezone, availability_notes, submitted_at)
VALUES (
  'Huda Malik',
  'huda.malik@test.example',
  '+64 27 200 0010',
  '1999-06-12',
  'female',
  true,
  false,
  'Recent graduate wanting to dedicate time to deepening my Islamic knowledge.',
  'pending',
  ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  ARRAY['Morning', 'Afternoon', 'Evening'],
  'Pacific/Auckland',
  'Currently between jobs, very flexible with timing',
  NOW() - INTERVAL '10 days'
);

-- APPLICANT 11: International - UK timezone, wants afternoons NZ = mornings UK
INSERT INTO applications (full_name, email, phone, date_of_birth, gender, can_read_quran, has_studied_arabic, motivation, status, preferred_days, preferred_times, timezone, availability_notes, submitted_at)
VALUES (
  'Zayd Rahman',
  'zayd.rahman@test.example',
  '+44 7700 200 011',
  '1987-10-05',
  'male',
  true,
  true,
  'Looking to enhance my Islamic knowledge and Arabic language skills for better Quran understanding.',
  'pending',
  ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday'],
  ARRAY['Afternoon'],
  'Europe/London',
  'Your afternoon = my early morning, 12-2 PM NZ time works perfectly',
  NOW() - INTERVAL '11 days'
);

-- APPLICANT 12: Limited availability - only Sunday morning
INSERT INTO applications (full_name, email, phone, date_of_birth, gender, can_read_quran, has_studied_arabic, motivation, status, preferred_days, preferred_times, timezone, availability_notes, submitted_at)
VALUES (
  'Sumaya Patel',
  'sumaya.patel@test.example',
  '+64 21 200 0012',
  '1994-12-20',
  'female',
  false,
  false,
  'Busy healthcare professional wanting to maintain Islamic studies despite demanding schedule.',
  'pending',
  ARRAY['Sunday'],
  ARRAY['Morning'],
  'Pacific/Auckland',
  'Only Sunday mornings 8-11 AM due to shift work',
  NOW() - INTERVAL '12 days'
);

-- =============================================
-- 5. SUMMARY AND VALIDATION
-- =============================================
SELECT
  '✅ Realistic test data created successfully!' as message,
  (SELECT COUNT(*) FROM students WHERE email LIKE '%@test.example%') as enrolled_students,
  (SELECT COUNT(*) FROM class_schedules WHERE student_id IN (
    SELECT id FROM students WHERE email LIKE '%@test.example%'
  )) as total_schedules,
  (SELECT COUNT(*) FROM applications WHERE status = 'pending' AND email LIKE '%@test.example%') as pending_applications;

-- Show schedule density by day
SELECT
  'SCHEDULE DENSITY BY DAY' as info;

SELECT
  day_of_week,
  COUNT(*) as total_classes,
  STRING_AGG(DISTINCT s.full_name, ', ') as students
FROM class_schedules cs
JOIN students s ON cs.student_id = s.id
WHERE s.email LIKE '%@test.example%'
GROUP BY day_of_week
ORDER BY
  CASE day_of_week
    WHEN 'Monday' THEN 1
    WHEN 'Tuesday' THEN 2
    WHEN 'Wednesday' THEN 3
    WHEN 'Thursday' THEN 4
    WHEN 'Friday' THEN 5
    WHEN 'Saturday' THEN 6
    WHEN 'Sunday' THEN 7
  END;
