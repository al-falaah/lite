-- Add oral test support
-- Allows research admin to configure milestones/exams as oral type
-- Teachers can then record oral test scores for their assigned students

-- ============================================================
-- 1. Add milestone_test_modes to program_test_settings
--    JSON object: {"0": "oral", "1": "online", "final_exam": "oral"}
--    Missing keys default to "online"
-- ============================================================
ALTER TABLE program_test_settings
  ADD COLUMN IF NOT EXISTS milestone_test_modes JSONB DEFAULT '{}';

-- ============================================================
-- 2. Add oral columns to test_attempts
-- ============================================================
ALTER TABLE test_attempts
  ADD COLUMN IF NOT EXISTS is_oral BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS graded_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS oral_notes TEXT;

-- ============================================================
-- 3. RLS: Teachers can view attempts for their assigned students
-- ============================================================
DROP POLICY IF EXISTS "Teachers can view assigned student attempts" ON test_attempts;
CREATE POLICY "Teachers can view assigned student attempts"
  ON test_attempts FOR SELECT
  TO authenticated
  USING (
    student_id IN (
      SELECT tsa.student_id FROM teacher_student_assignments tsa
      JOIN teachers t ON t.id = tsa.teacher_id
      WHERE t.auth_user_id = auth.uid()
      AND tsa.status = 'assigned'
    )
  );

-- ============================================================
-- 4. RLS: Teachers can insert oral test attempts for assigned students
-- ============================================================
DROP POLICY IF EXISTS "Teachers can insert oral attempts" ON test_attempts;
CREATE POLICY "Teachers can insert oral attempts"
  ON test_attempts FOR INSERT
  TO authenticated
  WITH CHECK (
    is_oral = true
    AND student_id IN (
      SELECT tsa.student_id FROM teacher_student_assignments tsa
      JOIN teachers t ON t.id = tsa.teacher_id
      WHERE t.auth_user_id = auth.uid()
      AND tsa.status = 'assigned'
    )
  );

-- ============================================================
-- 5. RLS: Teachers can update oral attempts they graded
-- ============================================================
DROP POLICY IF EXISTS "Teachers can update oral attempts" ON test_attempts;
CREATE POLICY "Teachers can update oral attempts"
  ON test_attempts FOR UPDATE
  TO authenticated
  USING (
    is_oral = true
    AND graded_by = auth.uid()
  );

-- ============================================================
-- 6. RLS: Teachers can view results for assigned students
-- ============================================================
DROP POLICY IF EXISTS "Teachers can view assigned student results" ON student_program_results;
CREATE POLICY "Teachers can view assigned student results"
  ON student_program_results FOR SELECT
  TO authenticated
  USING (
    student_id IN (
      SELECT tsa.student_id FROM teacher_student_assignments tsa
      JOIN teachers t ON t.id = tsa.teacher_id
      WHERE t.auth_user_id = auth.uid()
      AND tsa.status = 'assigned'
    )
  );

-- ============================================================
-- 7. RLS: Admins can manage (update/delete) test_attempts
--    (needed so admins can also view oral attempts)
-- ============================================================
DROP POLICY IF EXISTS "Admins can manage all attempts" ON test_attempts;
CREATE POLICY "Admins can manage all attempts"
  ON test_attempts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('director', 'research_admin')
    )
  );
