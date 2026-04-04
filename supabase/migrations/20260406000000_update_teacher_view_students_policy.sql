-- Update the teacher RLS policy on students to cover both assigned and removed statuses
-- Previously only allowed teachers to see students with status = 'assigned'
-- Teachers also need to see removed students in their portal

DROP POLICY IF EXISTS "Teachers can view assigned students" ON students;

CREATE POLICY "Teachers can view assigned students"
ON students FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT student_id FROM teacher_student_assignments
    WHERE teacher_id IN (
      SELECT id FROM teachers WHERE auth_user_id = auth.uid()
    )
  )
);
