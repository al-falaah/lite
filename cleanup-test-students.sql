-- =============================================
-- Cleanup Test Students
-- Run this in Supabase SQL Editor
-- =============================================

-- Delete test students (this will cascade to enrollments and payments)
DELETE FROM students
WHERE email IN ('fatima.tajweed@test.com', 'hassan.multi@test.com')
OR student_id IN ('100001', '100002', 'STUD-TAJWEED-001', 'STUD-MULTI-002');

SELECT 'Test students cleaned up successfully!' as message;
