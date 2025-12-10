-- Update enrollments with availability data for student 159898

UPDATE enrollments
SET 
  preferred_days = '{"Saturday", "Sunday"}'::text[],
  preferred_times = '{"Morning", "Afternoon", "Evening", "Night"}'::text[],
  timezone = 'Pacific/Auckland',
  availability_notes = 'Flexible schedule, prefers weekends'
WHERE program = 'essentials'
AND student_id = (SELECT id FROM students WHERE student_id = '159898');

UPDATE enrollments
SET 
  preferred_days = '{"Sunday", "Wednesday"}'::text[],
  preferred_times = '{"Evening", "Morning"}'::text[],
  timezone = 'Pacific/Auckland',
  availability_notes = 'Prefers evening classes on weekdays'
WHERE program = 'tajweed'
AND student_id = (SELECT id FROM students WHERE student_id = '159898');

-- Verify
SELECT program, preferred_days, preferred_times, availability_notes
FROM enrollments
WHERE student_id = (SELECT id FROM students WHERE student_id = '159898');
