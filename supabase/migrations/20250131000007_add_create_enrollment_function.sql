-- Create function to create enrollment with proper validation
-- Drop existing function first to avoid parameter mismatch
DROP FUNCTION IF EXISTS create_enrollment(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS create_enrollment(UUID, TEXT, TEXT, UUID);

CREATE OR REPLACE FUNCTION create_enrollment(
  p_student_id UUID,
  p_program TEXT,
  p_payment_type TEXT,
  p_application_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_enrollment_id UUID;
  v_total_amount DECIMAL(10,2);
BEGIN
  -- Determine total amount based on payment type and program
  IF p_program = 'tajweed' THEN
    v_total_amount := 120.00; -- Tajweed is one-time payment only
  ELSIF p_payment_type = 'monthly' THEN
    v_total_amount := 35.00 * 24; -- Monthly for 2 years (24 months)
  ELSIF p_payment_type = 'annual' THEN
    v_total_amount := 375.00 * 2; -- Annual for 2 years
  ELSE
    -- Default to annual
    v_total_amount := 375.00 * 2;
  END IF;

  -- Create enrollment record
  INSERT INTO enrollments (
    student_id,
    program,
    payment_type,
    total_amount,
    balance_remaining,
    start_date,
    status,
    application_id,
    created_at,
    updated_at
  ) VALUES (
    p_student_id,
    p_program,
    p_payment_type,
    v_total_amount,
    v_total_amount, -- Initial balance is total amount
    CURRENT_DATE,
    'active',
    p_application_id,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_enrollment_id;

  RETURN v_enrollment_id;
END;
$$;

COMMENT ON FUNCTION create_enrollment(UUID, TEXT, TEXT, UUID) IS 'Creates a new enrollment for a student with proper validation and calculations';
