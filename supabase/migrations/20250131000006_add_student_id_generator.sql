-- Create function to generate random 6-digit student ID
-- This ensures unique student IDs are generated
CREATE OR REPLACE FUNCTION generate_random_student_id()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  new_id TEXT;
  id_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate random 6-digit number (100000 to 999999)
    new_id := LPAD(FLOOR(RANDOM() * 900000 + 100000)::TEXT, 6, '0');

    -- Check if this ID already exists
    SELECT EXISTS(SELECT 1 FROM students WHERE student_id = new_id) INTO id_exists;

    -- If it doesn't exist, we've found a unique ID
    EXIT WHEN NOT id_exists;
  END LOOP;

  RETURN new_id;
END;
$$;

COMMENT ON FUNCTION generate_random_student_id() IS 'Generates a unique random 6-digit student ID';
