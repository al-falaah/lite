-- Check recent students
SELECT id, email, full_name, status FROM students ORDER BY created_at DESC LIMIT 3;

-- Check recent enrollments
SELECT e.id, e.student_id, s.email, e.program, e.status, e.enrolled_date
FROM enrollments e
JOIN students s ON e.student_id = s.id
ORDER BY e.created_at DESC LIMIT 3;

-- Check recent class schedules
SELECT cs.id, cs.student_id, s.email, cs.program, cs.academic_year, cs.week_number, cs.day_of_week, cs.class_time, cs.status
FROM class_schedules cs
JOIN students s ON cs.student_id = s.id
ORDER BY cs.created_at DESC LIMIT 5;
