-- Add unique constraints to students table to prevent duplicate emails and student_ids
-- Email must be unique: one student record per email, regardless of name used
-- Student_id must be unique: each assigned ID is one-to-one with a student

-- Unique constraint on email (only one student per email)
ALTER TABLE students ADD CONSTRAINT students_email_unique UNIQUE (email);

-- Unique constraint on student_id (where not null, since pending_payment students have null)
CREATE UNIQUE INDEX students_student_id_unique ON students (student_id) WHERE student_id IS NOT NULL;
