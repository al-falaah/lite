-- Fix teacher RLS policies on test_attempts
-- The teacher_student_assignments.student_id references students.id (table PK),
-- but test_attempts.student_id references auth.users(id).
-- Must join through students table to resolve auth_user_id.

-- ============================================================
-- 1. Fix: Teachers can view assigned student attempts
-- ============================================================
DROP POLICY IF EXISTS "Teachers can view assigned student attempts" ON test_attempts;
CREATE POLICY "Teachers can view assigned student attempts"
  ON test_attempts FOR SELECT
  TO authenticated
  USING (
    student_id IN (
      SELECT s.auth_user_id FROM teacher_student_assignments tsa
      JOIN teachers t ON t.id = tsa.teacher_id
      JOIN students s ON s.id = tsa.student_id
      WHERE t.auth_user_id = auth.uid()
      AND tsa.status = 'assigned'
      AND s.auth_user_id IS NOT NULL
    )
  );

-- ============================================================
-- 2. Fix: Teachers can insert oral test attempts for assigned students
-- ============================================================
DROP POLICY IF EXISTS "Teachers can insert oral attempts" ON test_attempts;
CREATE POLICY "Teachers can insert oral attempts"
  ON test_attempts FOR INSERT
  TO authenticated
  WITH CHECK (
    is_oral = true
    AND student_id IN (
      SELECT s.auth_user_id FROM teacher_student_assignments tsa
      JOIN teachers t ON t.id = tsa.teacher_id
      JOIN students s ON s.id = tsa.student_id
      WHERE t.auth_user_id = auth.uid()
      AND tsa.status = 'assigned'
      AND s.auth_user_id IS NOT NULL
    )
  );

-- ============================================================
-- 3. Fix: Teachers can view assigned student results
-- ============================================================
DROP POLICY IF EXISTS "Teachers can view assigned student results" ON student_program_results;
CREATE POLICY "Teachers can view assigned student results"
  ON student_program_results FOR SELECT
  TO authenticated
  USING (
    student_id IN (
      SELECT s.auth_user_id FROM teacher_student_assignments tsa
      JOIN teachers t ON t.id = tsa.teacher_id
      JOIN students s ON s.id = tsa.student_id
      WHERE t.auth_user_id = auth.uid()
      AND tsa.status = 'assigned'
      AND s.auth_user_id IS NOT NULL
    )
  );
