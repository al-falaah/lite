-- Auto-assign roles to students and teachers when created
-- This ensures profiles table correctly labels students and teachers

-- Function to sync student role to profile
CREATE OR REPLACE FUNCTION sync_student_role_to_profile()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- When a new student is created, update their profile role to 'student'
  UPDATE profiles
  SET
    role = 'student',
    is_admin = false,
    updated_at = NOW()
  WHERE id = NEW.id;

  -- If no profile exists yet, create one
  IF NOT FOUND THEN
    INSERT INTO profiles (id, email, role, is_admin, full_name)
    VALUES (
      NEW.id,
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

  RETURN NEW;
END;
$$;

-- Function to sync teacher role to profile
CREATE OR REPLACE FUNCTION sync_teacher_role_to_profile()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- When a new teacher is created, update their profile role to 'teacher'
  UPDATE profiles
  SET
    role = 'teacher',
    is_admin = false,
    updated_at = NOW()
  WHERE id = NEW.id;

  -- If no profile exists yet, create one
  IF NOT FOUND THEN
    INSERT INTO profiles (id, email, role, is_admin, full_name)
    VALUES (
      NEW.id,
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

  RETURN NEW;
END;
$$;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS sync_student_role_trigger ON students;
DROP TRIGGER IF EXISTS sync_teacher_role_trigger ON teachers;

-- Create trigger for students table
CREATE TRIGGER sync_student_role_trigger
AFTER INSERT OR UPDATE ON students
FOR EACH ROW
EXECUTE FUNCTION sync_student_role_to_profile();

-- Create trigger for teachers table
CREATE TRIGGER sync_teacher_role_trigger
AFTER INSERT OR UPDATE ON teachers
FOR EACH ROW
EXECUTE FUNCTION sync_teacher_role_to_profile();

-- Backfill existing students and teachers with correct roles
-- Update all existing students
UPDATE profiles p
SET
  role = 'student',
  is_admin = false,
  updated_at = NOW()
FROM students s
WHERE p.id = s.id
  AND (p.role IS NULL OR p.role != 'student');

-- Update all existing teachers
UPDATE profiles p
SET
  role = 'teacher',
  is_admin = false,
  updated_at = NOW()
FROM teachers t
WHERE p.id = t.id
  AND (p.role IS NULL OR p.role != 'teacher');

-- Log the results
DO $$
DECLARE
  student_count INTEGER;
  teacher_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO student_count
  FROM profiles
  WHERE role = 'student';

  SELECT COUNT(*) INTO teacher_count
  FROM profiles
  WHERE role = 'teacher';

  RAISE NOTICE 'Student profiles updated: %', student_count;
  RAISE NOTICE 'Teacher profiles updated: %', teacher_count;
END $$;
