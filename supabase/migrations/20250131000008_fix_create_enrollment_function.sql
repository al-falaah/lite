-- Fix create_enrollment function to use correct column names
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
  v_total_fees DECIMAL(10,2);
  v_program_duration_months INTEGER;
BEGIN
  -- Determine total fees and duration based on program
  IF p_program = 'tajweed' THEN
    v_total_fees := 120.00;
    v_program_duration_months := 6; -- 6 months
  ELSE -- essentials program
    IF p_payment_type = 'monthly' THEN
      v_total_fees := 35.00 * 24; -- $35/month for 24 months = $840
    ELSE -- annual
      v_total_fees := 375.00 * 2; -- $375/year for 2 years = $750
    END IF;
    v_program_duration_months := 24; -- 2 years
  END IF;

  -- Create enrollment record with correct column names
  INSERT INTO enrollments (
    student_id,
    program,
    payment_type,
    total_fees,
    total_paid,
    balance_remaining,
    program_duration_months,
    status,
    application_id,
    timezone,
    created_at,
    updated_at
  ) VALUES (
    p_student_id,
    p_program,
    p_payment_type,
    v_total_fees,
    0.00, -- No payments yet (will be updated by payment records)
    v_total_fees, -- Initial balance is total fees
    v_program_duration_months,
    'active',
    p_application_id,
    'Pacific/Auckland', -- Default timezone
    NOW(),
    NOW()
  )
  RETURNING id INTO v_enrollment_id;

  RETURN v_enrollment_id;
END;
$$;

COMMENT ON FUNCTION create_enrollment(UUID, TEXT, TEXT, UUID) IS 'Creates a new enrollment with correct column names (total_fees, not total_amount)';
