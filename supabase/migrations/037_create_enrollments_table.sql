-- =============================================
-- Multi-Program Enrollment System
-- =============================================
-- This migration creates an enrollments table to support students
-- enrolling in multiple programs while maintaining one student ID

-- =============================================
-- 1. Create enrollments table
-- =============================================
CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Student Reference (one student can have multiple enrollments)
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,

  -- Program Details
  program TEXT NOT NULL CHECK (program IN ('essentials', 'tajweed')),

  -- Enrollment Dates
  enrolled_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_graduation_date DATE,
  actual_graduation_date DATE,

  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'withdrawn')),

  -- Program-specific settings
  program_duration_months INTEGER NOT NULL,
  payment_type TEXT CHECK (payment_type IN ('monthly', 'annual', 'one-time')),

  -- Payment Tracking
  total_fees DECIMAL(10,2) NOT NULL,
  total_paid DECIMAL(10,2) DEFAULT 0,
  balance_remaining DECIMAL(10,2),

  -- Reference to original application
  application_id UUID REFERENCES applications(id) ON DELETE SET NULL,

  -- Notes
  admin_notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(student_id, program, enrolled_date) -- Prevent duplicate enrollments in same program on same date
);

-- =============================================
-- 2. Create indexes
-- =============================================
CREATE INDEX idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX idx_enrollments_program ON enrollments(program);
CREATE INDEX idx_enrollments_status ON enrollments(status);
CREATE INDEX idx_enrollments_student_program ON enrollments(student_id, program);

-- =============================================
-- 3. Update payments table to link to enrollments
-- =============================================
-- Add enrollment_id to payments table
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE;

-- Create index for enrollment_id
CREATE INDEX IF NOT EXISTS idx_payments_enrollment_id ON payments(enrollment_id);

-- =============================================
-- 4. Enable Row Level Security
-- =============================================
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for enrollments
CREATE POLICY "Admins can manage enrollments"
ON enrollments FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Students can view their own enrollments
CREATE POLICY "Students can view their own enrollments"
ON enrollments FOR SELECT
TO authenticated
USING (student_id IN (
  SELECT id FROM students WHERE user_id = auth.uid()
));

-- =============================================
-- 5. Create helper function to create enrollment
-- =============================================
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
BEGIN
  v_enrolled_date := CURRENT_DATE;

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

  -- Create enrollment record
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
-- 6. Update payment generation function
-- =============================================
DROP FUNCTION IF EXISTS generate_program_payments(UUID, TEXT, TEXT, INTEGER);

CREATE OR REPLACE FUNCTION generate_enrollment_payments(
  p_enrollment_id UUID
)
RETURNS void AS $$
DECLARE
  v_enrollment RECORD;
  v_amount DECIMAL(10,2);
  v_year INTEGER;
  v_installment INTEGER;
  v_due_date DATE;
BEGIN
  -- Get enrollment details
  SELECT * INTO v_enrollment
  FROM enrollments
  WHERE id = p_enrollment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Enrollment not found: %', p_enrollment_id;
  END IF;

  -- Delete existing pending payments for this enrollment
  DELETE FROM payments
  WHERE enrollment_id = p_enrollment_id
  AND status = 'pending';

  IF v_enrollment.program = 'tajweed' THEN
    -- Tajweed: One-time payment of $120
    INSERT INTO payments (
      student_id,
      enrollment_id,
      amount,
      due_date,
      status,
      academic_year,
      installment_number,
      payment_method,
      created_at,
      updated_at
    ) VALUES (
      v_enrollment.student_id,
      p_enrollment_id,
      120.00,
      v_enrollment.enrolled_date,
      'pending',
      1,
      NULL,
      'bank_transfer',
      NOW(),
      NOW()
    );

  ELSIF v_enrollment.program = 'essentials' THEN
    IF v_enrollment.payment_type = 'annual' THEN
      -- Annual payment: $275/year for 2 years
      FOR v_year IN 1..2 LOOP
        v_due_date := v_enrollment.enrolled_date + ((v_year - 1) * 365);

        INSERT INTO payments (
          student_id,
          enrollment_id,
          amount,
          due_date,
          status,
          academic_year,
          installment_number,
          payment_method,
          created_at,
          updated_at
        ) VALUES (
          v_enrollment.student_id,
          p_enrollment_id,
          275.00,
          v_due_date,
          'pending',
          v_year,
          NULL,
          'bank_transfer',
          NOW(),
          NOW()
        );
      END LOOP;

    ELSE
      -- Monthly payment: $25/month for 24 months
      FOR v_installment IN 1..24 LOOP
        v_due_date := v_enrollment.enrolled_date + ((v_installment - 1) * 30);
        v_year := CASE WHEN v_installment <= 12 THEN 1 ELSE 2 END;

        INSERT INTO payments (
          student_id,
          enrollment_id,
          amount,
          due_date,
          status,
          academic_year,
          installment_number,
          payment_method,
          created_at,
          updated_at
        ) VALUES (
          v_enrollment.student_id,
          p_enrollment_id,
          25.00,
          v_due_date,
          'pending',
          v_year,
          v_installment,
          'bank_transfer',
          NOW(),
          NOW()
        );
      END LOOP;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 7. Update payment totals trigger
-- =============================================
DROP TRIGGER IF EXISTS update_payment_totals_trigger ON payments;
DROP FUNCTION IF EXISTS update_student_payment_totals();

CREATE OR REPLACE FUNCTION update_enrollment_payment_totals()
RETURNS TRIGGER AS $$
DECLARE
  v_total_paid DECIMAL(10,2);
BEGIN
  -- Only update if payment status changed to 'verified'
  IF NEW.status = 'verified' AND NEW.enrollment_id IS NOT NULL AND
     (OLD.status IS NULL OR OLD.status != 'verified') THEN

    -- Calculate total paid for this enrollment
    SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
    FROM payments
    WHERE enrollment_id = NEW.enrollment_id
    AND status = 'verified';

    -- Update enrollment record
    UPDATE enrollments
    SET
      total_paid = v_total_paid,
      balance_remaining = total_fees - v_total_paid,
      updated_at = NOW()
    WHERE id = NEW.enrollment_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create new trigger
CREATE TRIGGER update_enrollment_payment_totals_trigger
AFTER INSERT OR UPDATE ON payments
FOR EACH ROW
EXECUTE FUNCTION update_enrollment_payment_totals();

-- =============================================
-- 8. Create trigger for updated_at
-- =============================================
CREATE TRIGGER update_enrollments_timestamp
BEFORE UPDATE ON enrollments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- =============================================
-- 9. Comments
-- =============================================
COMMENT ON TABLE enrollments IS 'Stores student enrollments in programs - one student can have multiple enrollments';
COMMENT ON COLUMN enrollments.program IS 'Program type: essentials or tajweed';
COMMENT ON COLUMN enrollments.payment_type IS 'Payment plan: monthly/annual for essentials, one-time for tajweed';
COMMENT ON COLUMN enrollments.program_duration_months IS 'Program duration: 24 for essentials, 6 for tajweed';
COMMENT ON COLUMN enrollments.status IS 'Enrollment status: active, completed, or withdrawn';

COMMENT ON FUNCTION create_enrollment IS 'Creates a new enrollment and generates payment schedule';
COMMENT ON FUNCTION generate_enrollment_payments IS 'Generates payment records for an enrollment based on program and payment type';

-- =============================================
-- SUCCESS
-- =============================================
SELECT '✅ Enrollments table created! Students can now enroll in multiple programs.' as message;
