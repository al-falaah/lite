-- =============================================
-- Make student_id nullable until payment
-- =============================================
-- Student IDs should only be assigned after enrollment (after payment)
-- Pending payment students don't have IDs yet

-- Drop the NOT NULL constraint and UNIQUE constraint temporarily
ALTER TABLE students
ALTER COLUMN student_id DROP NOT NULL;

-- Drop the unique constraint if it exists
ALTER TABLE students
DROP CONSTRAINT IF EXISTS students_student_id_key;

-- Add a new unique constraint that allows NULLs
-- (multiple students can have NULL student_id, but non-NULL values must be unique)
CREATE UNIQUE INDEX students_student_id_unique
ON students(student_id)
WHERE student_id IS NOT NULL;

-- =============================================
-- SUCCESS
-- =============================================
SELECT '✅ student_id can now be NULL for pending payment students!' as message;
