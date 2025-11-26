-- =============================================
-- Insert Realistic Test Data
-- =============================================
-- This script creates realistic test data to demonstrate the availability planning system
-- It creates enrolled students with class schedules and pending applicants with availability

-- Clean existing test data first (be careful in production!)
DELETE FROM class_schedules;
DELETE FROM students WHERE email LIKE '%@test.example%';
DELETE FROM applications WHERE email LIKE '%@test.example%';

-- =============================================
-- 1. INSERT ENROLLED STUDENTS
-- =============================================
INSERT INTO students (id, student_id, full_name, email, phone, date_of_birth, status, enrolled_date, total_fees, total_paid, balance_remaining)
VALUES
  (gen_random_uuid(), 'STU-2024-00001', 'Fatima Ahmed', 'fatima.ahmed@test.example', '+64 21 234 5678', '1995-03-15', 'enrolled', '2024-01-15', 600.00, 600.00, 0.00),
  (gen_random_uuid(), 'STU-2024-00002', 'Hassan Ibrahim', 'hassan.ibrahim@test.example', '+64 22 345 6789', '1992-07-22', 'enrolled', '2024-01-20', 600.00, 600.00, 0.00),
  (gen_random_uuid(), 'STU-2024-00003', 'Aisha Mohammed', 'aisha.mohammed@test.example', '+64 27 456 7890', '1998-11-08', 'enrolled', '2024-02-01', 600.00, 600.00, 0.00),
  (gen_random_uuid(), 'STU-2024-00004', 'Yusuf Ali', 'yusuf.ali@test.example', '+64 21 567 8901', '1990-05-30', 'enrolled', '2024-02-10', 600.00, 600.00, 0.00),
  (gen_random_uuid(), 'STU-2024-00005', 'Zaynab Hassan', 'zaynab.hassan@test.example', '+64 22 678 9012', '1996-09-12', 'enrolled', '2024-02-15', 600.00, 600.00, 0.00),
  (gen_random_uuid(), 'STU-2024-00006', 'Omar Abdullah', 'omar.abdullah@test.example', '+64 27 789 0123', '1993-12-25', 'enrolled', '2024-03-01', 600.00, 300.00, 300.00),
  (gen_random_uuid(), 'STU-2024-00007', 'Mariam Khalid', 'mariam.khalid@test.example', '+64 21 890 1234', '1997-04-18', 'enrolled', '2024-03-05', 600.00, 300.00, 300.00),
  (gen_random_uuid(), 'STU-2024-00008', 'Ibrahim Rashid', 'ibrahim.rashid@test.example', '+64 22 901 2345', '1994-08-07', 'enrolled', '2024-03-10', 600.00, 300.00, 300.00);

-- =============================================
-- 2. INSERT CLASS SCHEDULES FOR ENROLLED STUDENTS
-- =============================================
-- Fatima Ahmed - Monday Morning (Main) & Wednesday Afternoon (Short)
INSERT INTO class_schedules (student_id, academic_year, week_number, class_type, day_of_week, class_time, status)
SELECT id, 1, 10, 'main', 'Monday', '09:00:00', 'scheduled' FROM students WHERE email = 'fatima.ahmed@test.example';

INSERT INTO class_schedules (student_id, academic_year, week_number, class_type, day_of_week, class_time, status)
SELECT id, 1, 10, 'short', 'Wednesday', '14:30:00', 'scheduled' FROM students WHERE email = 'fatima.ahmed@test.example';

-- Hassan Ibrahim - Tuesday Evening (Main) & Friday Morning (Short)
INSERT INTO class_schedules (student_id, academic_year, week_number, class_type, day_of_week, class_time, status)
SELECT id, 1, 10, 'main', 'Tuesday', '18:00:00', 'scheduled' FROM students WHERE email = 'hassan.ibrahim@test.example';

INSERT INTO class_schedules (student_id, academic_year, week_number, class_type, day_of_week, class_time, status)
SELECT id, 1, 10, 'short', 'Friday', '10:00:00', 'scheduled' FROM students WHERE email = 'hassan.ibrahim@test.example';

-- Aisha Mohammed - Wednesday Morning (Main) & Saturday Afternoon (Short)
INSERT INTO class_schedules (student_id, academic_year, week_number, class_type, day_of_week, class_time, status)
SELECT id, 1, 10, 'main', 'Wednesday', '08:00:00', 'scheduled' FROM students WHERE email = 'aisha.mohammed@test.example';

INSERT INTO class_schedules (student_id, academic_year, week_number, class_type, day_of_week, class_time, status)
SELECT id, 1, 10, 'short', 'Saturday', '15:00:00', 'scheduled' FROM students WHERE email = 'aisha.mohammed@test.example';

-- Yusuf Ali - Thursday Evening (Main) & Monday Afternoon (Short)
INSERT INTO class_schedules (student_id, academic_year, week_number, class_type, day_of_week, class_time, status)
SELECT id, 1, 10, 'main', 'Thursday', '19:00:00', 'scheduled' FROM students WHERE email = 'yusuf.ali@test.example';

INSERT INTO class_schedules (student_id, academic_year, week_number, class_type, day_of_week, class_time, status)
SELECT id, 1, 10, 'short', 'Monday', '13:00:00', 'scheduled' FROM students WHERE email = 'yusuf.ali@test.example';

-- Zaynab Hassan - Friday Evening (Main) & Tuesday Morning (Short)
INSERT INTO class_schedules (student_id, academic_year, week_number, class_type, day_of_week, class_time, status)
SELECT id, 1, 10, 'main', 'Friday', '17:30:00', 'scheduled' FROM students WHERE email = 'zaynab.hassan@test.example';

INSERT INTO class_schedules (student_id, academic_year, week_number, class_type, day_of_week, class_time, status)
SELECT id, 1, 10, 'short', 'Tuesday', '11:00:00', 'scheduled' FROM students WHERE email = 'zaynab.hassan@test.example';

-- Omar Abdullah - Saturday Morning (Main) & Thursday Afternoon (Short)
INSERT INTO class_schedules (student_id, academic_year, week_number, class_type, day_of_week, class_time, status)
SELECT id, 1, 10, 'main', 'Saturday', '09:30:00', 'scheduled' FROM students WHERE email = 'omar.abdullah@test.example';

INSERT INTO class_schedules (student_id, academic_year, week_number, class_type, day_of_week, class_time, status)
SELECT id, 1, 10, 'short', 'Thursday', '14:00:00', 'scheduled' FROM students WHERE email = 'omar.abdullah@test.example';

-- Mariam Khalid - Sunday Morning (Main) & Wednesday Evening (Short)
INSERT INTO class_schedules (student_id, academic_year, week_number, class_type, day_of_week, class_time, status)
SELECT id, 1, 10, 'main', 'Sunday', '08:30:00', 'scheduled' FROM students WHERE email = 'mariam.khalid@test.example';

INSERT INTO class_schedules (student_id, academic_year, week_number, class_type, day_of_week, class_time, status)
SELECT id, 1, 10, 'short', 'Wednesday', '18:30:00', 'scheduled' FROM students WHERE email = 'mariam.khalid@test.example';

-- Ibrahim Rashid - Monday Evening (Main) & Saturday Morning (Short)
INSERT INTO class_schedules (student_id, academic_year, week_number, class_type, day_of_week, class_time, status)
SELECT id, 1, 10, 'main', 'Monday', '20:00:00', 'scheduled' FROM students WHERE email = 'ibrahim.rashid@test.example';

INSERT INTO class_schedules (student_id, academic_year, week_number, class_type, day_of_week, class_time, status)
SELECT id, 1, 10, 'short', 'Saturday', '07:00:00', 'scheduled' FROM students WHERE email = 'ibrahim.rashid@test.example';

-- =============================================
-- 3. INSERT PENDING APPLICATIONS WITH AVAILABILITY
-- =============================================

-- Applicant 1: Khadija Rahman - Wants Monday/Wednesday mornings (CONFLICT with Fatima on Monday!)
INSERT INTO applications (full_name, email, phone, date_of_birth, gender, can_read_quran, has_studied_arabic, motivation, status, preferred_days, preferred_times, timezone, availability_notes, submitted_at)
VALUES (
  'Khadija Rahman',
  'khadija.rahman@test.example',
  '+64 21 111 2222',
  '1996-06-15',
  'female',
  true,
  false,
  'I want to deepen my understanding of Islamic knowledge and improve my Arabic reading skills to better connect with the Quran.',
  'pending',
  ARRAY['Monday', 'Wednesday', 'Friday'],
  ARRAY['Morning'],
  'Pacific/Auckland',
  'Prefer early mornings before work (7-9 AM)',
  NOW() - INTERVAL '5 days'
);

-- Applicant 2: Abdullah Mansoor - Evenings only, multiple days
INSERT INTO applications (full_name, email, phone, date_of_birth, gender, can_read_quran, has_studied_arabic, motivation, status, preferred_days, preferred_times, timezone, availability_notes, submitted_at)
VALUES (
  'Abdullah Mansoor',
  'abdullah.mansoor@test.example',
  '+64 22 222 3333',
  '1991-11-20',
  'male',
  true,
  true,
  'Seeking to strengthen my Islamic foundation and advance my Arabic comprehension for deeper Quranic studies.',
  'pending',
  ARRAY['Tuesday', 'Thursday', 'Saturday'],
  ARRAY['Evening', 'Night'],
  'Pacific/Auckland',
  'Available after 6 PM most evenings',
  NOW() - INTERVAL '4 days'
);

-- Applicant 3: Noor Malik - Weekend flexibility
INSERT INTO applications (full_name, email, phone, date_of_birth, gender, can_read_quran, has_studied_arabic, motivation, status, preferred_days, preferred_times, timezone, availability_notes, submitted_at)
VALUES (
  'Noor Malik',
  'noor.malik@test.example',
  '+61 423 456 789',
  '1999-03-08',
  'female',
  false,
  false,
  'New to Islam and eager to learn the essentials from knowledgeable teachers.',
  'pending',
  ARRAY['Saturday', 'Sunday'],
  ARRAY['Morning', 'Afternoon', 'Evening'],
  'Australia/Sydney',
  'Very flexible on weekends, prefer Saturday mornings',
  NOW() - INTERVAL '3 days'
);

-- Applicant 4: Mohammed Tariq - From UK, different timezone, evening NZ = morning UK
INSERT INTO applications (full_name, email, phone, date_of_birth, gender, can_read_quran, has_studied_arabic, motivation, status, preferred_days, preferred_times, timezone, availability_notes, submitted_at)
VALUES (
  'Mohammed Tariq',
  'mohammed.tariq@test.example',
  '+44 7700 900 123',
  '1988-09-14',
  'male',
  true,
  true,
  'Looking to enhance my tajweed and deepen my Arabic language skills for better Quran understanding.',
  'pending',
  ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday'],
  ARRAY['Morning', 'Afternoon'],
  'Europe/London',
  'These times work well with UK mornings (NZ afternoon/evening = UK morning)',
  NOW() - INTERVAL '7 days'
);

-- Applicant 5: Safiya Yusuf - Afternoons only
INSERT INTO applications (full_name, email, phone, date_of_birth, gender, can_read_quran, has_studied_arabic, motivation, status, preferred_days, preferred_times, timezone, availability_notes, submitted_at)
VALUES (
  'Safiya Yusuf',
  'safiya.yusuf@test.example',
  '+64 27 333 4444',
  '1994-12-22',
  'female',
  true,
  false,
  'Want to learn Islamic knowledge systematically and improve my Quran recitation.',
  'pending',
  ARRAY['Monday', 'Wednesday', 'Friday'],
  ARRAY['Afternoon'],
  'Pacific/Auckland',
  'Available 1-4 PM, prefer Wednesday',
  NOW() - INTERVAL '2 days'
);

-- Applicant 6: Ahmed Karim - Flexible, many slots (WILL SHOW CONFLICTS)
INSERT INTO applications (full_name, email, phone, date_of_birth, gender, can_read_quran, has_studied_arabic, motivation, status, preferred_days, preferred_times, timezone, availability_notes, submitted_at)
VALUES (
  'Ahmed Karim',
  'ahmed.karim@test.example',
  '+64 21 444 5555',
  '1992-04-30',
  'male',
  false,
  false,
  'Beginning my Islamic education journey and want a structured learning program.',
  'pending',
  ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  ARRAY['Morning', 'Afternoon', 'Evening'],
  'Pacific/Auckland',
  'Work from home, very flexible schedule',
  NOW() - INTERVAL '6 days'
);

-- Applicant 7: Amina Said - From USA West Coast
INSERT INTO applications (full_name, email, phone, date_of_birth, gender, can_read_quran, has_studied_arabic, motivation, status, preferred_days, preferred_times, timezone, availability_notes, submitted_at)
VALUES (
  'Amina Said',
  'amina.said@test.example',
  '+1 415 555 0123',
  '1997-07-19',
  'female',
  true,
  true,
  'Interested in deepening my knowledge of Islamic theology and perfecting my Arabic pronunciation.',
  'pending',
  ARRAY['Saturday', 'Sunday', 'Monday'],
  ARRAY['Evening', 'Night'],
  'America/Los_Angeles',
  'NZ morning/afternoon = my evening (best time for me)',
  NOW() - INTERVAL '8 days'
);

-- Applicant 8: Bilal Hussein - Night owl
INSERT INTO applications (full_name, email, phone, date_of_birth, gender, can_read_quran, has_studied_arabic, motivation, status, preferred_days, preferred_times, timezone, availability_notes, submitted_at)
VALUES (
  'Bilal Hussein',
  'bilal.hussein@test.example',
  '+64 22 555 6666',
  '1990-10-11',
  'male',
  true,
  false,
  'Seeking comprehensive Islamic education to strengthen my faith and knowledge.',
  'pending',
  ARRAY['Tuesday', 'Thursday', 'Friday', 'Saturday'],
  ARRAY['Night'],
  'Pacific/Auckland',
  'Work late shifts, only available after 9 PM',
  NOW() - INTERVAL '1 day'
);

-- Applicant 9: Huda Mahmoud - From Dubai, prefers mornings
INSERT INTO applications (full_name, email, phone, date_of_birth, gender, can_read_quran, has_studied_arabic, motivation, status, preferred_days, preferred_times, timezone, availability_notes, submitted_at)
VALUES (
  'Huda Mahmoud',
  'huda.mahmoud@test.example',
  '+971 50 123 4567',
  '1995-02-28',
  'female',
  true,
  true,
  'Wanting to enhance my Islamic studies with qualified scholars and improve my Quranic Arabic.',
  'pending',
  ARRAY['Sunday', 'Monday', 'Tuesday'],
  ARRAY['Morning', 'Afternoon'],
  'Asia/Dubai',
  'NZ morning = my evening, works perfectly',
  NOW() - INTERVAL '9 days'
);

-- Applicant 10: Ismail Osman - Weekend warrior
INSERT INTO applications (full_name, email, phone, date_of_birth, gender, can_read_quran, has_studied_arabic, motivation, status, preferred_days, preferred_times, timezone, availability_notes, submitted_at)
VALUES (
  'Ismail Osman',
  'ismail.osman@test.example',
  '+64 27 666 7777',
  '1993-08-05',
  'male',
  false,
  false,
  'New Muslim looking to build a strong foundation in Islamic knowledge and learn to read the Quran.',
  'pending',
  ARRAY['Saturday', 'Sunday'],
  ARRAY['Afternoon', 'Evening'],
  'Pacific/Auckland',
  'Only free on weekends due to full-time work',
  NOW() - INTERVAL '10 days'
);

-- Applicant 11: Layla Aziz - Midweek preference
INSERT INTO applications (full_name, email, phone, date_of_birth, gender, can_read_quran, has_studied_arabic, motivation, status, preferred_days, preferred_times, timezone, availability_notes, submitted_at)
VALUES (
  'Layla Aziz',
  'layla.aziz@test.example',
  '+64 21 777 8888',
  '1998-05-17',
  'female',
  true,
  false,
  'Want to deepen my understanding of Islamic teachings and improve my Quranic recitation.',
  'pending',
  ARRAY['Tuesday', 'Wednesday', 'Thursday'],
  ARRAY['Morning', 'Afternoon'],
  'Pacific/Auckland',
  'Prefer midweek mornings when I have childcare',
  NOW() - INTERVAL '11 days'
);

-- Applicant 12: Rashid Farooq - Evenings + Weekends
INSERT INTO applications (full_name, email, phone, date_of_birth, gender, can_read_quran, has_studied_arabic, motivation, status, preferred_days, preferred_times, timezone, availability_notes, submitted_at)
VALUES (
  'Rashid Farooq',
  'rashid.farooq@test.example',
  '+64 22 888 9999',
  '1989-11-03',
  'male',
  true,
  true,
  'Seeking advanced Islamic studies and Arabic language proficiency for teaching others.',
  'pending',
  ARRAY['Monday', 'Wednesday', 'Saturday', 'Sunday'],
  ARRAY['Evening', 'Night'],
  'Pacific/Auckland',
  'Free after work on weekdays and all day weekends',
  NOW() - INTERVAL '12 days'
);

-- Applicant 13: Sumaya Ali - From Malaysia
INSERT INTO applications (full_name, email, phone, date_of_birth, gender, can_read_quran, has_studied_arabic, motivation, status, preferred_days, preferred_times, timezone, availability_notes, submitted_at)
VALUES (
  'Sumaya Ali',
  'sumaya.ali@test.example',
  '+60 12 345 6789',
  '1996-09-25',
  'female',
  true,
  false,
  'Looking to strengthen my Islamic knowledge and connect with quality teachers online.',
  'pending',
  ARRAY['Monday', 'Tuesday', 'Friday'],
  ARRAY['Afternoon', 'Evening'],
  'Asia/Kuala_Lumpur',
  'NZ afternoon/evening works with my schedule',
  NOW() - INTERVAL '13 days'
);

-- Applicant 14: Tariq Jamil - Super flexible
INSERT INTO applications (full_name, email, phone, date_of_birth, gender, can_read_quran, has_studied_arabic, motivation, status, preferred_days, preferred_times, timezone, availability_notes, submitted_at)
VALUES (
  'Tariq Jamil',
  'tariq.jamil@test.example',
  '+64 27 999 0000',
  '1991-01-12',
  'male',
  false,
  true,
  'Retired and want to dedicate time to comprehensive Islamic studies and Arabic mastery.',
  'pending',
  ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  ARRAY['Morning', 'Afternoon', 'Evening'],
  'Pacific/Auckland',
  'Retired, available any time that works for the teacher',
  NOW() - INTERVAL '14 days'
);

-- Applicant 15: Yasmin Patel - Limited availability
INSERT INTO applications (full_name, email, phone, date_of_birth, gender, can_read_quran, has_studied_arabic, motivation, status, preferred_days, preferred_times, timezone, availability_notes, submitted_at)
VALUES (
  'Yasmin Patel',
  'yasmin.patel@test.example',
  '+64 21 000 1111',
  '1994-07-08',
  'female',
  true,
  false,
  'Busy medical professional wanting to maintain connection with Islamic studies despite demanding schedule.',
  'pending',
  ARRAY['Sunday'],
  ARRAY['Morning'],
  'Pacific/Auckland',
  'Only Sunday mornings free, 8-11 AM',
  NOW() - INTERVAL '15 days'
);

-- =============================================
-- SUCCESS MESSAGE
-- =============================================
SELECT
  'Test data inserted successfully!' as message,
  (SELECT COUNT(*) FROM students WHERE email LIKE '%@test.example%') as enrolled_students,
  (SELECT COUNT(*) FROM class_schedules) as scheduled_classes,
  (SELECT COUNT(*) FROM applications WHERE status = 'pending' AND email LIKE '%@test.example%') as pending_applications;
