-- Allow students to delete their own recitations
CREATE POLICY "Students can delete own recitations"
  ON recitations FOR DELETE
  TO authenticated
  USING (
    student_id IN (
      SELECT id FROM students WHERE auth_user_id = auth.uid()
    )
  );

-- Increase storage file size limit to 10MB for 15-min voice notes
UPDATE storage.buckets SET file_size_limit = 10485760 WHERE id = 'recitations';

-- Allow teachers to view/manage recitations where teacher_id is NULL
-- (student self-initiated without assigned teacher)
CREATE POLICY "Teachers can view unassigned program recitations"
  ON recitations FOR SELECT
  TO authenticated
  USING (
    teacher_id IS NULL
    AND EXISTS (
      SELECT 1 FROM teacher_student_assignments tsa
      JOIN teachers t ON t.id = tsa.teacher_id
      WHERE t.auth_user_id = auth.uid()
      AND tsa.student_id = recitations.student_id
      AND tsa.program = recitations.program_id
      AND tsa.status = 'assigned'
    )
  );

CREATE POLICY "Teachers can update unassigned program recitations"
  ON recitations FOR UPDATE
  TO authenticated
  USING (
    teacher_id IS NULL
    AND EXISTS (
      SELECT 1 FROM teacher_student_assignments tsa
      JOIN teachers t ON t.id = tsa.teacher_id
      WHERE t.auth_user_id = auth.uid()
      AND tsa.student_id = recitations.student_id
      AND tsa.program = recitations.program_id
      AND tsa.status = 'assigned'
    )
  );
