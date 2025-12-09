-- Clean up existing test schedules for Fatima and Hassan
-- Run this before running test-multi-program-schedules.sql

DELETE FROM class_schedules
WHERE student_id IN (
  SELECT id FROM students WHERE student_id IN ('100001', '100002')
);

-- Verify cleanup
SELECT
  COUNT(*) as deleted_schedules
FROM class_schedules cs
JOIN students s ON cs.student_id = s.id
WHERE s.student_id IN ('100001', '100002');

-- Should return 0 if cleanup was successful
