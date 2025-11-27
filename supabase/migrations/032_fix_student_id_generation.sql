-- =============================================
-- Fix Student ID Generation
-- =============================================
-- This migration changes student ID from sequential alphanumeric (STU-2025-00001)
-- to random 6-digit numeric IDs that are only assigned AFTER payment

-- Drop the existing trigger that auto-assigns student_id on insert
DROP TRIGGER IF EXISTS auto_student_id_trigger ON students;

-- Drop the old function
DROP FUNCTION IF EXISTS auto_generate_student_id();
DROP FUNCTION IF EXISTS generate_student_id();

-- Create new function to generate random 6-digit numeric student ID
CREATE OR REPLACE FUNCTION generate_random_student_id()
RETURNS TEXT AS $$
DECLARE
  v_student_id TEXT;
  v_exists BOOLEAN;
  v_attempts INTEGER := 0;
  v_max_attempts INTEGER := 100;
BEGIN
  LOOP
    -- Generate random 6-digit number (100000 to 999999)
    v_student_id := LPAD(FLOOR(RANDOM() * 900000 + 100000)::TEXT, 6, '0');

    -- Check if it already exists
    SELECT EXISTS(SELECT 1 FROM students WHERE student_id = v_student_id) INTO v_exists;

    -- Exit loop if unique
    EXIT WHEN NOT v_exists;

    -- Prevent infinite loop
    v_attempts := v_attempts + 1;
    IF v_attempts >= v_max_attempts THEN
      RAISE EXCEPTION 'Could not generate unique student ID after % attempts', v_max_attempts;
    END IF;
  END LOOP;

  RETURN v_student_id;
END;
$$ LANGUAGE plpgsql;

-- Add comment for documentation
COMMENT ON FUNCTION generate_random_student_id() IS 'Generates a random 6-digit numeric student ID that is unique and not guessable. Should only be called after first payment is verified.';

-- =============================================
-- IMPORTANT: Student IDs are now assigned AFTER payment
-- =============================================
-- The stripe-webhook Edge Function will call generate_random_student_id()
-- when the first payment is verified.
-- DO NOT create a trigger to auto-assign student_id on insert.
-- Student records should have student_id = NULL until payment is confirmed.

-- =============================================
-- SUCCESS
-- =============================================
SELECT '✅ Student ID generation fixed! Now using random 6-digit numeric IDs assigned after payment.' as message;
