-- Update student ID trigger to use random 6-digit IDs instead of STU- prefix
-- This migration updates the auto_generate_student_id trigger function
-- to use generate_random_student_id() instead of generate_student_id()

-- Drop and recreate the trigger function to use the new random ID generator
CREATE OR REPLACE FUNCTION auto_generate_student_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.student_id IS NULL THEN
    NEW.student_id := generate_random_student_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION auto_generate_student_id() IS 'Automatically generates a random 6-digit student ID when a new student is inserted without an ID';
