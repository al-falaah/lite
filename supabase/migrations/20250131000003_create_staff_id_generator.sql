-- Create function to generate random 5-digit staff IDs
CREATE OR REPLACE FUNCTION generate_random_staff_id()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_staff_id TEXT;
  v_exists BOOLEAN;
  v_attempts INTEGER := 0;
  v_max_attempts INTEGER := 100;
BEGIN
  LOOP
    -- Generate random 5-digit number (10000 to 99999)
    v_staff_id := LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0');

    -- Check if this ID already exists
    SELECT EXISTS(SELECT 1 FROM teachers WHERE staff_id = v_staff_id) INTO v_exists;

    -- If ID is unique, exit loop
    EXIT WHEN NOT v_exists;

    -- Increment attempts and check if we've exceeded max
    v_attempts := v_attempts + 1;
    IF v_attempts >= v_max_attempts THEN
      RAISE EXCEPTION 'Unable to generate unique staff ID after % attempts', v_max_attempts;
    END IF;
  END LOOP;

  RETURN v_staff_id;
END;
$$;

-- Create trigger function to auto-generate staff_id on insert
CREATE OR REPLACE FUNCTION auto_generate_staff_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.staff_id IS NULL OR NEW.staff_id = '' THEN
    NEW.staff_id := generate_random_staff_id();
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger on teachers table
DROP TRIGGER IF EXISTS auto_generate_staff_id_trigger ON teachers;
CREATE TRIGGER auto_generate_staff_id_trigger
  BEFORE INSERT ON teachers
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_staff_id();

-- Grant permissions
GRANT EXECUTE ON FUNCTION generate_random_staff_id() TO anon;
GRANT EXECUTE ON FUNCTION generate_random_staff_id() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_random_staff_id() TO service_role;

GRANT EXECUTE ON FUNCTION auto_generate_staff_id() TO anon;
GRANT EXECUTE ON FUNCTION auto_generate_staff_id() TO authenticated;
GRANT EXECUTE ON FUNCTION auto_generate_staff_id() TO service_role;

-- Add comments
COMMENT ON FUNCTION generate_random_staff_id IS 'Generates a random 5-digit numeric staff ID that is unique and memorable';
COMMENT ON FUNCTION auto_generate_staff_id IS 'Automatically generates a random 5-digit staff ID when a new teacher is inserted without an ID';
