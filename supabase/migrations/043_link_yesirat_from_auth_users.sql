-- =============================================
-- Link Yesirat directly from auth.users
-- =============================================
-- The auth user exists but profile might not, so link directly

-- First, check if Yesirat's auth user exists
DO $$
DECLARE
  v_auth_user_id UUID;
  v_student_id UUID;
BEGIN
  -- Find Yesirat's auth user by email
  SELECT id INTO v_auth_user_id
  FROM auth.users
  WHERE email = 'ganiyuyesirat@gmail.com';

  IF v_auth_user_id IS NOT NULL THEN
    RAISE NOTICE 'Found auth user for Yesirat: %', v_auth_user_id;

    -- Get Yesirat's student ID
    SELECT id INTO v_student_id
    FROM students
    WHERE student_id = '621370';

    -- Link them
    IF v_student_id IS NOT NULL THEN
      UPDATE students
      SET user_id = v_auth_user_id,
          updated_at = NOW()
      WHERE id = v_student_id;

      RAISE NOTICE '✅ Successfully linked Yesirat!';
    ELSE
      RAISE NOTICE '❌ Student record not found';
    END IF;
  ELSE
    RAISE NOTICE '❌ Auth user not found for ganiyuyesirat@gmail.com';
    RAISE NOTICE 'Yesirat needs to create an account through the invitation link';
  END IF;
END $$;

-- Verify the link
SELECT
  s.student_id,
  s.full_name,
  s.email,
  s.user_id,
  CASE
    WHEN s.user_id IS NOT NULL THEN '✅ Linked to auth'
    ELSE '❌ Not linked'
  END as link_status,
  (SELECT COUNT(*) FROM enrollments e WHERE e.student_id = s.id) as enrollment_count
FROM students s
WHERE s.student_id = '621370';
