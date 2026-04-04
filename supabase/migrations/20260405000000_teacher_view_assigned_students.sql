-- Add RLS policy for teachers to view their assigned students
-- Teachers can see students they are assigned to via teacher_student_assignments

-- Allow teachers to view students they are assigned to
CREATE POLICY "Teachers can view assigned students"
ON students FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT student_id FROM teacher_student_assignments
    WHERE teacher_id IN (
      SELECT id FROM teachers WHERE auth_user_id = auth.uid()
    )
    AND status = 'assigned'
  )
);
