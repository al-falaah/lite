-- =============================================
-- Two Program System: Tajweed & Essential Arabic & Islamic Studies
-- =============================================
-- This migration updates the system to support two programs:
-- 1. Tajweed Program (6 months, $120 one-time)
-- 2. Essential Arabic & Islamic Studies Program (2 years, $25/month or $275/year)

-- =============================================
-- 1. Update applications table
-- =============================================

-- Update existing records to use new program value
UPDATE applications
SET program = 'essentials'
WHERE program = '2-year-essentials';

-- Update program field to use new values
ALTER TABLE applications
  DROP CONSTRAINT IF EXISTS applications_program_check;

ALTER TABLE applications
  ALTER COLUMN program SET DEFAULT 'essentials';

ALTER TABLE applications
  ADD CONSTRAINT applications_program_check
  CHECK (program IN ('essentials', 'tajweed'));

COMMENT ON COLUMN applications.program IS 'Program type: essentials (2-year) or tajweed (6-month)';

-- =============================================
-- 2. Update students table
-- =============================================

-- Update existing records to use new program value
UPDATE students
SET program = 'essentials'
WHERE program = '2-year-essentials';

-- Update program field to use new values
ALTER TABLE students
  DROP CONSTRAINT IF EXISTS students_program_check;

ALTER TABLE students
  ALTER COLUMN program SET DEFAULT 'essentials';

ALTER TABLE students
  ADD CONSTRAINT students_program_check
  CHECK (program IN ('essentials', 'tajweed'));

-- Add program-specific duration field
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS program_duration_months INTEGER;

-- Set duration for existing students (essentials = 24 months)
UPDATE students
SET program_duration_months = 24
WHERE program = 'essentials' AND program_duration_months IS NULL;

COMMENT ON COLUMN students.program IS 'Program type: essentials (2-year) or tajweed (6-month)';
COMMENT ON COLUMN students.program_duration_months IS 'Program duration in months: 24 for essentials, 6 for tajweed';

-- =============================================
-- 3. Add program-specific payment type to students
-- =============================================

-- Add payment type field to track monthly vs annual for essentials
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS payment_type TEXT;

ALTER TABLE students
  ADD CONSTRAINT students_payment_type_check
  CHECK (payment_type IS NULL OR payment_type IN ('monthly', 'annual', 'one-time'));

COMMENT ON COLUMN students.payment_type IS 'Payment type: monthly/annual for essentials, one-time for tajweed';

-- =============================================
-- 4. Update payment generation function for two programs
-- =============================================

-- Drop old function
DROP FUNCTION IF EXISTS generate_installment_payments(UUID, INTEGER);

-- Create new program-aware payment generation function
CREATE OR REPLACE FUNCTION generate_program_payments(
  p_student_id UUID,
  p_program TEXT,
  p_payment_type TEXT DEFAULT 'monthly',
  p_installments_per_year INTEGER DEFAULT 5
)
RETURNS void AS $$
DECLARE
  v_amount DECIMAL(10,2);
  v_year INTEGER;
  v_installment INTEGER;
  v_due_date DATE;
  v_enrolled_date DATE;
  v_total_fees DECIMAL(10,2);
BEGIN
  -- Get student's enrolled date
  SELECT enrolled_date INTO v_enrolled_date
  FROM students
  WHERE id = p_student_id;

  -- Delete existing pending payments for this student
  DELETE FROM payments
  WHERE student_id = p_student_id
  AND status = 'pending';

  IF p_program = 'tajweed' THEN
    -- Tajweed: One-time payment of $120
    INSERT INTO payments (
      student_id,
      amount,
      due_date,
      status,
      academic_year,
      installment_number,
      payment_method,
      created_at,
      updated_at
    ) VALUES (
      p_student_id,
      120.00,
      v_enrolled_date,
      'pending',
      1,
      NULL,
      'bank_transfer',
      NOW(),
      NOW()
    );

    -- Update student total fees
    UPDATE students
    SET total_fees = 120.00,
        payment_type = 'one-time',
        balance_remaining = 120.00,
        program_duration_months = 6,
        expected_graduation_date = v_enrolled_date + INTERVAL '6 months'
    WHERE id = p_student_id;

  ELSIF p_program = 'essentials' THEN
    IF p_payment_type = 'annual' THEN
      -- Annual payment: $275/year for 2 years
      FOR v_year IN 1..2 LOOP
        v_due_date := v_enrolled_date + ((v_year - 1) * 365);

        INSERT INTO payments (
          student_id,
          amount,
          due_date,
          status,
          academic_year,
          installment_number,
          payment_method,
          created_at,
          updated_at
        ) VALUES (
          p_student_id,
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

      v_total_fees := 550.00;

    ELSE
      -- Monthly payment: $25/month for 24 months
      FOR v_installment IN 1..24 LOOP
        v_due_date := v_enrolled_date + ((v_installment - 1) * 30);
        v_year := CASE WHEN v_installment <= 12 THEN 1 ELSE 2 END;

        INSERT INTO payments (
          student_id,
          amount,
          due_date,
          status,
          academic_year,
          installment_number,
          payment_method,
          created_at,
          updated_at
        ) VALUES (
          p_student_id,
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

      v_total_fees := 600.00;
    END IF;

    -- Update student total fees
    UPDATE students
    SET total_fees = v_total_fees,
        payment_type = p_payment_type,
        balance_remaining = v_total_fees,
        program_duration_months = 24,
        expected_graduation_date = v_enrolled_date + INTERVAL '2 years'
    WHERE id = p_student_id;

  END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_program_payments IS 'Generates payments based on program type and payment plan';

-- =============================================
-- 5. Add class schedule fields for Tajweed
-- =============================================

-- The class_sessions table already exists and can handle both programs
-- Tajweed will have 2 sessions per week (1 hour + 30 min)
-- Essentials already has the flexible schedule

-- =============================================
-- SUCCESS
-- =============================================
SELECT '✅ Two-program system migration completed!' as message;
