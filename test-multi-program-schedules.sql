-- Test Multi-Program Class Scheduling
-- This script creates test class schedules for Fatima and Hassan to verify the multi-program enrollment system works

-- Get student IDs for our test students
DO $$
DECLARE
  fatima_id UUID;
  hassan_id UUID;
  fatima_tajweed_enrollment_id UUID;
  fatima_essentials_enrollment_id UUID;
  hassan_essentials_enrollment_id UUID;
  hassan_tajweed_enrollment_id UUID;
BEGIN
  -- Get Fatima's ID and enrollment IDs
  SELECT id INTO fatima_id FROM students WHERE student_id = '100001';
  SELECT id INTO fatima_tajweed_enrollment_id FROM enrollments WHERE student_id = fatima_id AND program = 'tajweed';
  SELECT id INTO fatima_essentials_enrollment_id FROM enrollments WHERE student_id = fatima_id AND program = 'essentials';

  -- Get Hassan's ID and enrollment IDs
  SELECT id INTO hassan_id FROM students WHERE student_id = '100002';
  SELECT id INTO hassan_essentials_enrollment_id FROM enrollments WHERE student_id = hassan_id AND program = 'essentials';
  SELECT id INTO hassan_tajweed_enrollment_id FROM enrollments WHERE student_id = hassan_id AND program = 'tajweed';

  RAISE NOTICE 'Fatima ID: %, Enrollments: Tajweed=%, Essentials=%', fatima_id, fatima_tajweed_enrollment_id, fatima_essentials_enrollment_id;
  RAISE NOTICE 'Hassan ID: %, Enrollments: Essentials=%, Tajweed=%', hassan_id, hassan_essentials_enrollment_id, hassan_tajweed_enrollment_id;

  -- Create test class schedules for Fatima (Tajweed - Week 1)
  INSERT INTO class_schedules (
    student_id,
    enrollment_id,
    program,
    academic_year,
    week_number,
    class_type,
    day_of_week,
    class_time,
    status,
    meeting_link,
    notes
  ) VALUES
  (
    fatima_id,
    fatima_tajweed_enrollment_id,
    'tajweed',
    1,
    1,
    'main',
    'Monday',
    '10:00',
    'scheduled',
    'https://zoom.us/j/tajweed-fatima-main',
    'Tajweed Program - Main Class (2 hours)'
  ),
  (
    fatima_id,
    fatima_tajweed_enrollment_id,
    'tajweed',
    1,
    1,
    'short',
    'Wednesday',
    '10:00',
    'scheduled',
    'https://zoom.us/j/tajweed-fatima-short',
    'Tajweed Program - Short Class (30 min)'
  );

  -- Create test class schedules for Fatima (Essentials - Week 1)
  INSERT INTO class_schedules (
    student_id,
    enrollment_id,
    program,
    academic_year,
    week_number,
    class_type,
    day_of_week,
    class_time,
    status,
    meeting_link,
    notes
  ) VALUES
  (
    fatima_id,
    fatima_essentials_enrollment_id,
    'essentials',
    1,
    1,
    'main',
    'Tuesday',
    '14:00',
    'scheduled',
    'https://zoom.us/j/essentials-fatima-main',
    'Essentials Program - Main Class (2 hours)'
  ),
  (
    fatima_id,
    fatima_essentials_enrollment_id,
    'essentials',
    1,
    1,
    'short',
    'Thursday',
    '14:00',
    'scheduled',
    'https://zoom.us/j/essentials-fatima-short',
    'Essentials Program - Short Class (30 min)'
  );

  -- Create test class schedules for Hassan (Essentials - Week 1)
  INSERT INTO class_schedules (
    student_id,
    enrollment_id,
    program,
    academic_year,
    week_number,
    class_type,
    day_of_week,
    class_time,
    status,
    meeting_link,
    notes
  ) VALUES
  (
    hassan_id,
    hassan_essentials_enrollment_id,
    'essentials',
    1,
    1,
    'main',
    'Monday',
    '15:00',
    'scheduled',
    'https://zoom.us/j/essentials-hassan-main',
    'Essentials Program - Main Class (2 hours)'
  ),
  (
    hassan_id,
    hassan_essentials_enrollment_id,
    'essentials',
    1,
    1,
    'short',
    'Wednesday',
    '15:00',
    'scheduled',
    'https://zoom.us/j/essentials-hassan-short',
    'Essentials Program - Short Class (30 min)'
  );

  -- Create test class schedules for Hassan (Tajweed - Week 1)
  INSERT INTO class_schedules (
    student_id,
    enrollment_id,
    program,
    academic_year,
    week_number,
    class_type,
    day_of_week,
    class_time,
    status,
    meeting_link,
    notes
  ) VALUES
  (
    hassan_id,
    hassan_tajweed_enrollment_id,
    'tajweed',
    1,
    1,
    'main',
    'Tuesday',
    '11:00',
    'scheduled',
    'https://zoom.us/j/tajweed-hassan-main',
    'Tajweed Program - Main Class (2 hours)'
  ),
  (
    hassan_id,
    hassan_tajweed_enrollment_id,
    'tajweed',
    1,
    1,
    'short',
    'Thursday',
    '11:00',
    'scheduled',
    'https://zoom.us/j/tajweed-hassan-short',
    'Tajweed Program - Short Class (30 min)'
  );

  RAISE NOTICE 'Successfully created test class schedules for multi-program testing';
  RAISE NOTICE 'Fatima Ahmed (100001): 2 Tajweed classes + 2 Essentials classes';
  RAISE NOTICE 'Hassan Ibrahim (100002): 2 Essentials classes + 2 Tajweed classes';

END $$;

-- Verify the schedules were created
SELECT
  s.student_id,
  s.full_name,
  cs.program,
  cs.academic_year,
  cs.week_number,
  cs.class_type,
  cs.day_of_week,
  cs.class_time,
  cs.status,
  cs.notes
FROM class_schedules cs
JOIN students s ON cs.student_id = s.id
WHERE s.student_id IN ('100001', '100002')
ORDER BY s.student_id, cs.program, cs.academic_year, cs.week_number, cs.class_type;
