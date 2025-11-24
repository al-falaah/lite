-- =============================================
-- Lite Version Database Cleanup & Restructure
-- =============================================
-- This migration simplifies the schema for the lite version

-- =============================================
-- 1. Remove Stripe columns from payments table
-- =============================================
ALTER TABLE payments
DROP COLUMN IF EXISTS stripe_checkout_session_id,
DROP COLUMN IF EXISTS stripe_payment_intent_id,
DROP COLUMN IF EXISTS stripe_payment_method_id,
DROP COLUMN IF EXISTS last_four,
DROP COLUMN IF EXISTS card_brand,
DROP COLUMN IF EXISTS receipt_url;

-- =============================================
-- 2. Simplify students table
-- =============================================
ALTER TABLE students
DROP COLUMN IF EXISTS cohort_id,
DROP COLUMN IF EXISTS program_type,
DROP COLUMN IF EXISTS class_format;

-- Add new columns for payment plan
ALTER TABLE students
ADD COLUMN IF NOT EXISTS total_fees DECIMAL(10,2) DEFAULT 600.00, -- $300/year x 2 years
ADD COLUMN IF NOT EXISTS payment_plan TEXT DEFAULT 'installments', -- 'full' or 'installments'
ADD COLUMN IF NOT EXISTS installments_per_year INTEGER DEFAULT 5, -- Max 5 installments per year
ADD COLUMN IF NOT EXISTS year1_paid DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS year2_paid DECIMAL(10,2) DEFAULT 0;

-- =============================================
-- 3. Create class_sessions table
-- =============================================
CREATE TABLE IF NOT EXISTS class_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 6=Saturday
  start_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes IN (30, 90)), -- 30 or 90 minutes
  session_type TEXT NOT NULL CHECK (session_type IN ('main', 'short')), -- 'main' = 90min, 'short' = 30min
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Each student should have exactly 2 sessions: 1 main (90min) and 1 short (30min)
  UNIQUE(student_id, day_of_week, start_time)
);

-- Create index for querying by student
CREATE INDEX IF NOT EXISTS idx_class_sessions_student
ON class_sessions(student_id) WHERE is_active = true;

-- Create index for querying by day/time
CREATE INDEX IF NOT EXISTS idx_class_sessions_schedule
ON class_sessions(day_of_week, start_time) WHERE is_active = true;

-- =============================================
-- 4. Update student status enum
-- =============================================
-- Add new status values if they don't exist
DO $$
BEGIN
  -- Check if we need to update the status column
  -- For simplicity, we'll use TEXT instead of enum
  ALTER TABLE students
  ALTER COLUMN status TYPE TEXT;

  -- Add constraint for valid statuses
  ALTER TABLE students
  DROP CONSTRAINT IF EXISTS students_status_check;

  ALTER TABLE students
  ADD CONSTRAINT students_status_check
  CHECK (status IN ('applicant', 'enrolled', 'graduated', 'dropout'));
END $$;

-- =============================================
-- 5. Update payment_method enum
-- =============================================
-- Convert payment_method to TEXT if it's still an enum
DO $$
BEGIN
  ALTER TABLE payments
  ALTER COLUMN payment_method TYPE TEXT;

  -- Add constraint for valid payment methods
  ALTER TABLE payments
  DROP CONSTRAINT IF EXISTS payments_payment_method_check;

  ALTER TABLE payments
  ADD CONSTRAINT payments_payment_method_check
  CHECK (payment_method IN ('bank_transfer', 'cash', 'pending') OR payment_method IS NULL);
END $$;

-- =============================================
-- 6. RLS Policies for class_sessions
-- =============================================
ALTER TABLE class_sessions ENABLE ROW LEVEL SECURITY;

-- Admins can manage all sessions
CREATE POLICY "Admins can manage all class sessions"
ON class_sessions FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- =============================================
-- 7. Update triggers
-- =============================================
-- Add trigger to update updated_at on class_sessions
CREATE OR REPLACE FUNCTION update_class_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_class_sessions_timestamp ON class_sessions;

CREATE TRIGGER update_class_sessions_timestamp
    BEFORE UPDATE ON class_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_class_sessions_updated_at();

-- =============================================
-- 8. Helper function to generate installment payments
-- =============================================
CREATE OR REPLACE FUNCTION generate_student_payments(
  p_student_id UUID,
  p_installments_per_year INTEGER DEFAULT 5
)
RETURNS void AS $$
DECLARE
  v_amount_per_installment DECIMAL(10,2);
  v_year INTEGER;
  v_installment INTEGER;
  v_due_date DATE;
BEGIN
  -- Calculate amount per installment ($300 / installments_per_year)
  v_amount_per_installment := 300.00 / p_installments_per_year;

  -- Delete existing pending payments for this student
  DELETE FROM payments
  WHERE student_id = p_student_id
  AND status = 'pending';

  -- Generate payments for Year 1 and Year 2
  FOR v_year IN 1..2 LOOP
    FOR v_installment IN 1..p_installments_per_year LOOP
      -- Calculate due date (spread evenly throughout the year)
      v_due_date := CURRENT_DATE +
        ((v_year - 1) * 365) + -- Years
        ((v_installment - 1) * (365 / p_installments_per_year))::INTEGER; -- Installments

      INSERT INTO payments (
        student_id,
        amount,
        due_date,
        status,
        installment_number,
        total_installments,
        created_at,
        updated_at
      ) VALUES (
        p_student_id,
        v_amount_per_installment,
        v_due_date,
        'pending',
        ((v_year - 1) * p_installments_per_year) + v_installment,
        p_installments_per_year * 2, -- Total for both years
        NOW(),
        NOW()
      );
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 9. Comments for documentation
-- =============================================
COMMENT ON TABLE class_sessions IS 'Stores individual class session schedules for each student';
COMMENT ON COLUMN class_sessions.day_of_week IS '0=Sunday, 1=Monday, ..., 6=Saturday';
COMMENT ON COLUMN class_sessions.session_type IS 'main=90min session, short=30min session';
COMMENT ON COLUMN students.total_fees IS 'Total program fees ($300/year x 2 years = $600)';
COMMENT ON COLUMN students.installments_per_year IS 'Number of installments per year (max 5)';
COMMENT ON COLUMN students.year1_paid IS 'Amount paid for year 1';
COMMENT ON COLUMN students.year2_paid IS 'Amount paid for year 2';

-- =============================================
-- SUCCESS
-- =============================================
SELECT '✅ Lite version migration complete!' as message;
