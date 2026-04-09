-- Create a server-side function to clean up all FK dependencies before deleting a user
-- This runs as SECURITY DEFINER (superuser) to bypass RLS
CREATE OR REPLACE FUNCTION admin_delete_user_data(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_ids INT[];
  v_teacher_ids INT[];
BEGIN
  -- Collect student/teacher table IDs for this auth user
  SELECT COALESCE(array_agg(id), '{}') INTO v_student_ids
    FROM students WHERE auth_user_id = target_user_id;

  SELECT COALESCE(array_agg(id), '{}') INTO v_teacher_ids
    FROM teachers WHERE auth_user_id = target_user_id;

  -- 1. Delete from tables with NO ACTION FK to auth.users
  DELETE FROM test_attempts WHERE student_id = target_user_id OR graded_by = target_user_id;
  DELETE FROM student_program_results WHERE student_id = target_user_id;
  DELETE FROM certificates WHERE student_id = target_user_id;
  DELETE FROM test_questions WHERE created_by = target_user_id;
  DELETE FROM lesson_quizzes WHERE created_by = target_user_id;
  DELETE FROM lesson_chapters WHERE created_by = target_user_id;
  DELETE FROM lesson_courses WHERE created_by = target_user_id;
  DELETE FROM director_plans WHERE created_by = target_user_id;

  -- 2. Delete from tables referencing students(id) — unknown ON DELETE behavior
  IF array_length(v_student_ids, 1) > 0 THEN
    DELETE FROM recitations WHERE student_id = ANY(v_student_ids);
    DELETE FROM enrollments WHERE student_id = ANY(v_student_ids);
    DELETE FROM class_schedules WHERE student_id = ANY(v_student_ids);
    DELETE FROM payments WHERE student_id = ANY(v_student_ids);
    DELETE FROM teacher_student_assignments WHERE student_id = ANY(v_student_ids);
  END IF;

  -- 3. Delete from tables referencing teachers(id) — unknown ON DELETE behavior
  IF array_length(v_teacher_ids, 1) > 0 THEN
    DELETE FROM recitations WHERE teacher_id = ANY(v_teacher_ids);
    DELETE FROM teacher_student_assignments WHERE teacher_id = ANY(v_teacher_ids);
  END IF;

  -- 4. Delete students/teachers rows (these CASCADE from auth.users, but be safe)
  DELETE FROM students WHERE auth_user_id = target_user_id;
  DELETE FROM teachers WHERE auth_user_id = target_user_id;

  -- 5. Delete profiles row (ON DELETE behavior unknown — created via Dashboard)
  DELETE FROM profiles WHERE id = target_user_id;
END;
$$;

-- Only allow service_role to call this function
REVOKE ALL ON FUNCTION admin_delete_user_data(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION admin_delete_user_data(UUID) FROM anon;
REVOKE ALL ON FUNCTION admin_delete_user_data(UUID) FROM authenticated;
