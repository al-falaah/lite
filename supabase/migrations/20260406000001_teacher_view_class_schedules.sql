-- Allow teachers to view class schedules for their assigned students
-- Currently only students (own) and admins can view schedules

DROP POLICY IF EXISTS "Users can view own schedules" ON class_schedules;

CREATE POLICY "Users can view own schedules"
ON class_schedules FOR SELECT
TO authenticated
USING (
  -- Students can see their own schedules
  student_id IN (SELECT id FROM students WHERE auth_user_id = auth.uid())
  -- Admins can see all schedules
  OR public.is_admin()
  -- Teachers can see schedules for their assigned students
  OR student_id IN (
    SELECT student_id FROM teacher_student_assignments
    WHERE teacher_id IN (
      SELECT id FROM teachers WHERE auth_user_id = auth.uid()
    )
  )
);

-- Also allow teachers to view enrollments for their assigned students
DROP POLICY IF EXISTS "Students can view own enrollments" ON enrollments;

CREATE POLICY "Students can view own enrollments"
ON enrollments FOR SELECT
TO authenticated
USING (
  -- Students can see their own enrollments
  student_id IN (SELECT id FROM students WHERE auth_user_id = auth.uid())
  -- Teachers can see enrollments for their assigned students
  OR student_id IN (
    SELECT student_id FROM teacher_student_assignments
    WHERE teacher_id IN (
      SELECT id FROM teachers WHERE auth_user_id = auth.uid()
    )
  )
);
