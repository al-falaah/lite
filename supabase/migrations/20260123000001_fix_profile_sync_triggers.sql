-- Fix sync_student_role_to_profile function to handle null auth_user_id
-- Students without auth accounts (pending payment) should not trigger profile creation

CREATE OR REPLACE FUNCTION sync_student_role_to_profile()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only sync if auth_user_id exists (student has completed payment and has auth account)
  IF NEW.auth_user_id IS NOT NULL THEN
    -- When a student with auth account is created, update their profile role to 'student'
    UPDATE profiles
    SET
      role = 'student',
      is_admin = false,
      updated_at = NOW()
    WHERE id = NEW.auth_user_id;

    -- If no profile exists yet, create one
    IF NOT FOUND THEN
      INSERT INTO profiles (id, email, role, is_admin, full_name)
      VALUES (
        NEW.auth_user_id,
        NEW.email,
        'student',
        false,
        NEW.full_name
      )
      ON CONFLICT (id) DO UPDATE
      SET
        role = 'student',
        is_admin = false,
        updated_at = NOW();
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Fix sync_teacher_role_to_profile function to handle null auth_user_id similarly
CREATE OR REPLACE FUNCTION sync_teacher_role_to_profile()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only sync if auth_user_id exists
  IF NEW.auth_user_id IS NOT NULL THEN
    -- When a teacher with auth account is created, update their profile role to 'teacher'
    UPDATE profiles
    SET
      role = 'teacher',
      is_admin = false,
      updated_at = NOW()
    WHERE id = NEW.auth_user_id;

    -- If no profile exists yet, create one
    IF NOT FOUND THEN
      INSERT INTO profiles (id, email, role, is_admin, full_name)
      VALUES (
        NEW.auth_user_id,
        NEW.email,
        'teacher',
        false,
        NEW.full_name
      )
      ON CONFLICT (id) DO UPDATE
      SET
        role = 'teacher',
        is_admin = false,
        updated_at = NOW();
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION sync_student_role_to_profile IS 
'Automatically syncs student role to profiles table when auth_user_id is set. Skips students pending payment (auth_user_id = null).';

COMMENT ON FUNCTION sync_teacher_role_to_profile IS 
'Automatically syncs teacher role to profiles table when auth_user_id is set.';
