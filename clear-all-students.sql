-- =============================================
-- Clear All Student Data for Fresh Testing
-- =============================================
-- WARNING: This will delete ALL student records, enrollments, and class schedules
-- Run this only when you want to start fresh with real-life testing

-- Step 1: Delete all class schedules
DELETE FROM class_schedules;

-- Step 2: Delete all enrollments
DELETE FROM enrollments;

-- Step 3: Delete all students
DELETE FROM students;

-- Optional: Uncomment below to also clear applications
-- DELETE FROM applications;

-- Verify all tables are empty
SELECT
  'class_schedules' as table_name,
  COUNT(*) as remaining_records
FROM class_schedules
UNION ALL
SELECT
  'enrollments' as table_name,
  COUNT(*) as remaining_records
FROM enrollments
UNION ALL
SELECT
  'students' as table_name,
  COUNT(*) as remaining_records
FROM students;

-- Should show 0 records for each table
SELECT '✅ All student data cleared! Ready for real-life testing.' as message;
