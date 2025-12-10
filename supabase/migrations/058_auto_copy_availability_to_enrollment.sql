-- =============================================
-- Auto-copy availability from application to enrollment
-- =============================================
-- Update create_enrollment function to automatically copy availability data
-- from the application when creating a new enrollment

CREATE OR REPLACE FUNCTION create_enrollment(
  p_student_id UUID,
  p_program TEXT,
  p_payment_type TEXT DEFAULT 'monthly',
  p_application_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_enrollment_id UUID;
  v_total_fees DECIMAL(10,2);
  v_duration_months INTEGER;
  v_graduation_date DATE;
  v_enrolled_date DATE;
  v_preferred_days TEXT[];
  v_preferred_times TEXT[];
  v_timezone TEXT;
  v_availability_notes TEXT;
BEGIN
  v_enrolled_date := CURRENT_DATE;

  -- If application_id is provided, get availability data from application
  IF p_application_id IS NOT NULL THEN
    SELECT preferred_days, preferred_times, timezone, availability_notes
    INTO v_preferred_days, v_preferred_times, v_timezone, v_availability_notes
    FROM applications
    WHERE id = p_application_id;
  END IF;

  -- Set program-specific values
  IF p_program = 'tajweed' THEN
    v_total_fees := 120.00;
    v_duration_months := 6;
    v_graduation_date := v_enrolled_date + INTERVAL '6 months';
    p_payment_type := 'one-time'; -- Override payment type for tajweed

  ELSIF p_program = 'essentials' THEN
    v_duration_months := 24;
    v_graduation_date := v_enrolled_date + INTERVAL '2 years';

    IF p_payment_type = 'annual' THEN
      v_total_fees := 550.00; -- $275 x 2 years
    ELSE
      v_total_fees := 600.00; -- $25 x 24 months
      p_payment_type := 'monthly'; -- Default to monthly
    END IF;

  ELSE
    RAISE EXCEPTION 'Invalid program: %', p_program;
  END IF;

  -- Create enrollment record with availability data
  INSERT INTO enrollments (
    student_id,
    program,
    enrolled_date,
    expected_graduation_date,
    status,
    program_duration_months,
    payment_type,
    total_fees,
    total_paid,
    balance_remaining,
    application_id,
    preferred_days,
    preferred_times,
    timezone,
    availability_notes,
    created_at,
    updated_at
  ) VALUES (
    p_student_id,
    p_program,
    v_enrolled_date,
    v_graduation_date,
    'active',
    v_duration_months,
    p_payment_type,
    v_total_fees,
    0,
    v_total_fees,
    p_application_id,
    v_preferred_days,
    v_preferred_times,
    COALESCE(v_timezone, 'Pacific/Auckland'),
    v_availability_notes,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_enrollment_id;

  -- Generate payments for this enrollment
  PERFORM generate_enrollment_payments(v_enrollment_id);

  RETURN v_enrollment_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- Add comment
-- =============================================
COMMENT ON FUNCTION create_enrollment IS 'Creates a new enrollment and automatically copies availability preferences from the application if application_id is provided';

-- =============================================
-- SUCCESS
-- =============================================
SELECT '✅ create_enrollment function updated to auto-copy availability data!' as message;
