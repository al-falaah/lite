-- =============================================
-- Link Yesirat if auth account exists
-- =============================================
-- Simple check and link - if no auth exists, admin needs to send invite

DO $$
DECLARE
  v_student_id UUID;
  v_student_email TEXT;
  v_auth_user_id UUID;
BEGIN
  -- Get Yesirat's student record
  SELECT id, email INTO v_student_id, v_student_email
  FROM students
  WHERE student_id = '621370';

  IF v_student_id IS NULL THEN
    RAISE NOTICE '❌ Student 621370 not found';
    RETURN;
  END IF;

  RAISE NOTICE 'Student found: ID=%, Email=%', v_student_id, v_student_email;

  -- Check if auth user exists
  SELECT id INTO v_auth_user_id
  FROM auth.users
  WHERE email = v_student_email;

  IF v_auth_user_id IS NOT NULL THEN
    -- Link existing auth user to student
    UPDATE students
    SET user_id = v_auth_user_id,
        updated_at = NOW()
    WHERE id = v_student_id;

    RAISE NOTICE '✅ Linked auth user % to student', v_auth_user_id;
  ELSE
    RAISE NOTICE '❌ No auth user found for %', v_student_email;
    RAISE NOTICE 'ACTION REQUIRED: Admin must send invitation email to this student';
    RAISE NOTICE 'Or student needs to complete signup via their invitation link';
  END IF;
END $$;

-- Show current status
SELECT
  s.student_id,
  s.full_name,
  s.email,
  s.user_id,
  CASE
    WHEN s.user_id IS NOT NULL THEN '✅ Has auth account'
    ELSE '❌ No auth account - needs invitation'
  END as auth_status,
  (SELECT COUNT(*) FROM enrollments e WHERE e.student_id = s.id) as enrollments,
  (SELECT COUNT(*) FROM class_schedules cs WHERE cs.student_id = s.id) as schedules
FROM students s
WHERE s.student_id = '621370';
