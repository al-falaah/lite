-- Check enrolled students and their schedule status
-- This will help diagnose why Week 1 isn't progressing to Week 2

-- 1. Check all enrolled students
SELECT
  id,
  student_id,
  full_name,
  email,
  status,
  enrolled_date
FROM students
WHERE status = 'enrolled'
ORDER BY enrolled_date DESC;

-- 2. Check total schedules for each enrolled student
SELECT
  s.student_id,
  s.full_name,
  s.email,
  COUNT(cs.id) as total_schedules,
  COUNT(CASE WHEN cs.status = 'completed' THEN 1 END) as completed_schedules,
  COUNT(CASE WHEN cs.status = 'scheduled' THEN 1 END) as scheduled_schedules
FROM students s
LEFT JOIN class_schedules cs ON s.id = cs.student_id
WHERE s.status = 'enrolled'
GROUP BY s.id, s.student_id, s.full_name, s.email
ORDER BY s.enrolled_date DESC;

-- 3. Check Week 1 schedules specifically for enrolled students
SELECT
  s.full_name,
  s.email,
  cs.academic_year,
  cs.week_number,
  cs.class_type,
  cs.day_of_week,
  cs.class_time,
  cs.status,
  cs.completed_at
FROM class_schedules cs
JOIN students s ON cs.student_id = s.id
WHERE s.status = 'enrolled'
  AND cs.academic_year = 1
  AND cs.week_number = 1
ORDER BY s.full_name, cs.class_type;

-- 4. Check Week 2 schedules to verify they exist
SELECT
  s.full_name,
  s.email,
  cs.academic_year,
  cs.week_number,
  cs.class_type,
  cs.day_of_week,
  cs.class_time,
  cs.status
FROM class_schedules cs
JOIN students s ON cs.student_id = s.id
WHERE s.status = 'enrolled'
  AND cs.academic_year = 1
  AND cs.week_number = 2
ORDER BY s.full_name, cs.class_type;

-- 5. Get the current active week for each student
-- This simulates what getCurrentActiveWeekAndYear() should return
WITH student_weeks AS (
  SELECT
    s.id,
    s.full_name,
    s.email,
    cs.academic_year,
    cs.week_number,
    cs.class_type,
    cs.status
  FROM students s
  JOIN class_schedules cs ON s.id = cs.student_id
  WHERE s.status = 'enrolled'
)
SELECT
  full_name,
  email,
  MIN(CASE WHEN status = 'scheduled' THEN (academic_year - 1) * 52 + week_number ELSE NULL END) as first_incomplete_week_num,
  MIN(CASE WHEN status = 'scheduled' THEN academic_year ELSE NULL END) as current_year,
  MIN(CASE WHEN status = 'scheduled' THEN week_number ELSE NULL END) as current_week
FROM student_weeks
GROUP BY id, full_name, email
ORDER BY full_name;
