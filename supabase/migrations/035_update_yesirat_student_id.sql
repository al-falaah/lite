-- Update Yesirat's student ID from STU- format to random 6-digit number
-- This is a one-time fix for existing students with old format IDs

DO $$
DECLARE
  v_new_student_id TEXT;
BEGIN
  -- Generate a new random 6-digit student ID for Yesirat
  v_new_student_id := generate_random_student_id();

  -- Update Yesirat's student ID
  UPDATE students
  SET student_id = v_new_student_id
  WHERE full_name ILIKE '%yesirat%'
    AND student_id LIKE 'STU-%';

  -- Log the change
  RAISE NOTICE 'Updated student ID for Yesirat to: %', v_new_student_id;
END $$;
