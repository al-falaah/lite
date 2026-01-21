-- Update create_enrollment function to support any program
-- This removes hardcoded program values and accepts fees/duration as parameters

DROP FUNCTION IF EXISTS create_enrollment(UUID, TEXT, TEXT, UUID);
DROP FUNCTION IF EXISTS create_enrollment(UUID, TEXT, TEXT, UUID, DECIMAL, INTEGER);

-- New version: accepts fees and duration as parameters for flexibility
CREATE OR REPLACE FUNCTION create_enrollment(
  p_student_id UUID,
  p_program TEXT,
  p_payment_type TEXT,
  p_application_id UUID DEFAULT NULL,
  p_total_fees DECIMAL(10,2) DEFAULT NULL,
  p_program_duration_months INTEGER DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_enrollment_id UUID;
  v_total_fees DECIMAL(10,2);
  v_program_duration_months INTEGER;
BEGIN
  -- Use provided values or fall back to defaults for known programs
  IF p_total_fees IS NOT NULL AND p_program_duration_months IS NOT NULL THEN
    -- Use provided values (for new programs or custom pricing)
    v_total_fees := p_total_fees;
    v_program_duration_months := p_program_duration_months;
  ELSIF p_program = 'tajweed' THEN
    -- Tajweed: $120 one-time, 6 months
    v_total_fees := 120.00;
    v_program_duration_months := 6;
  ELSIF p_program = 'essentials' THEN
    -- Essentials: subscription-based, 24 months
    IF p_payment_type = 'monthly' THEN
      v_total_fees := 35.00 * 24; -- $35/month for 24 months = $840
    ELSE -- annual
      v_total_fees := 375.00 * 2; -- $375/year for 2 years = $750
    END IF;
    v_program_duration_months := 24;
  ELSE
    -- Unknown program - require explicit fees and duration
    IF p_total_fees IS NULL OR p_program_duration_months IS NULL THEN
      RAISE EXCEPTION 'Unknown program: %. Please provide p_total_fees and p_program_duration_months.', p_program;
    END IF;
    v_total_fees := p_total_fees;
    v_program_duration_months := p_program_duration_months;
  END IF;

  -- Create enrollment record
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
    0.00,
    v_total_fees,
    v_program_duration_months,
    'active',
    p_application_id,
    'Pacific/Auckland',
    NOW(),
    NOW()
  )
  RETURNING id INTO v_enrollment_id;

  RETURN v_enrollment_id;
END;
$$;

COMMENT ON FUNCTION create_enrollment(UUID, TEXT, TEXT, UUID, DECIMAL, INTEGER) IS
'Creates a new enrollment. For known programs (tajweed, essentials), fees/duration are auto-calculated.
For new programs, pass p_total_fees and p_program_duration_months explicitly.';
