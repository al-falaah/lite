-- Add password and first_login columns to students table
-- IMPORTANT: Run ONLY this section first (Steps 1-4), then run the export query separately

-- STEP 1: Add columns
ALTER TABLE students ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS first_login BOOLEAN DEFAULT true;

-- STEP 2: Generate random passwords for existing students (8 characters)
-- You'll need to send these to students via email manually or through a script
UPDATE students
SET password =
  CASE
    WHEN password IS NULL THEN
      substring(md5(random()::text || clock_timestamp()::text) from 1 for 8)
    ELSE password
  END,
  first_login = COALESCE(first_login, true)
WHERE password IS NULL;

-- STEP 3: Make password NOT NULL after setting values
ALTER TABLE students ALTER COLUMN password SET NOT NULL;

-- STEP 4: Update RLS policy to allow public UPDATE (for password changes)
DROP POLICY IF EXISTS "Authenticated users can update students" ON students;

CREATE POLICY "Anyone can update students"
  ON students FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- ============================================
-- AFTER running steps 1-4 above successfully,
-- run this EXPORT QUERY in a SEPARATE query:
-- ============================================
--
-- SELECT student_id, full_name, email, password, 'first_login' as status
-- FROM students
-- WHERE first_login = true
-- ORDER BY student_id;
