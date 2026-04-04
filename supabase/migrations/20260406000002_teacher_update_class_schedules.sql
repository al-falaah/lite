-- Allow teachers to update class schedules for their assigned students
-- (e.g., marking classes as complete)

CREATE POLICY "Teachers can update assigned student schedules"
ON class_schedules FOR UPDATE
TO authenticated
USING (
  student_id IN (
    SELECT student_id FROM teacher_student_assignments
    WHERE teacher_id IN (
      SELECT id FROM teachers WHERE auth_user_id = auth.uid()
    )
    AND status = 'assigned'
  )
)
WITH CHECK (
  student_id IN (
    SELECT student_id FROM teacher_student_assignments
    WHERE teacher_id IN (
      SELECT id FROM teachers WHERE auth_user_id = auth.uid()
    )
    AND status = 'assigned'
  )
);
