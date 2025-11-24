-- =============================================
-- FRESH START: Al-Falaah Lite Version Schema
-- =============================================
-- This is a complete fresh start with a clean, simple schema
-- designed specifically for the lite version requirements

-- =============================================
-- 1. Drop all existing tables (fresh start)
-- =============================================
DROP TABLE IF EXISTS class_sessions CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS lesson_notes CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS cohorts CASCADE;
DROP TABLE IF EXISTS applications CASCADE;

-- Drop old functions
DROP FUNCTION IF EXISTS generate_student_payments(UUID, INTEGER);
DROP FUNCTION IF EXISTS update_class_sessions_updated_at();

-- =============================================
-- 2. Create applications table
-- =============================================
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Personal Information
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female')),

  -- Address
  address TEXT,
  city TEXT,
  country TEXT,

  -- Education & Background
  education_level TEXT,
  islamic_knowledge_level TEXT,
  has_studied_arabic BOOLEAN DEFAULT false,
  arabic_proficiency TEXT,

  -- Application Details
  program TEXT NOT NULL DEFAULT '2-year-essentials', -- Only one program now
  motivation TEXT, -- Why they want to join
  goals TEXT, -- What they hope to achieve

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,

  -- Timestamps
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 3. Create students table (approved applicants)
-- =============================================
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to user profile (if they have one)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Student Information (copied from application)
  student_id TEXT UNIQUE NOT NULL, -- Auto-generated: STU-YYYY-XXXXX
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  date_of_birth DATE,

  -- Program Details
  program TEXT NOT NULL DEFAULT '2-year-essentials',
  enrolled_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_graduation_date DATE, -- enrolled_date + 2 years

  -- Status
  status TEXT NOT NULL DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'graduated', 'dropout')),

  -- Payment Plan
  total_fees DECIMAL(10,2) NOT NULL DEFAULT 600.00, -- $300/year x 2 years
  installments_per_year INTEGER NOT NULL DEFAULT 5 CHECK (installments_per_year BETWEEN 1 AND 5),

  -- Payment Tracking
  year1_paid DECIMAL(10,2) DEFAULT 0,
  year2_paid DECIMAL(10,2) DEFAULT 0,
  total_paid DECIMAL(10,2) DEFAULT 0,
  balance_remaining DECIMAL(10,2) DEFAULT 600.00,

  -- Reference to original application
  application_id UUID REFERENCES applications(id) ON DELETE SET NULL,

  -- Notes
  admin_notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 4. Create payments table
-- =============================================
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Student Reference
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,

  -- Payment Details
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL DEFAULT 'bank_transfer' CHECK (payment_method IN ('bank_transfer', 'cash')),

  -- Payment Proof
  proof_url TEXT, -- URL to uploaded proof in Supabase Storage
  proof_uploaded_at TIMESTAMPTZ,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),

  -- Installment Info
  academic_year INTEGER NOT NULL CHECK (academic_year IN (1, 2)), -- Year 1 or Year 2
  installment_number INTEGER, -- 1-5 (or null if paying full year)

  -- Due Dates
  due_date DATE,
  paid_date DATE,

  -- Verification
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  rejection_reason TEXT,

  -- Notes
  student_notes TEXT, -- Notes from student when uploading
  admin_notes TEXT, -- Admin notes after review

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 5. Create class_sessions table
-- =============================================
CREATE TABLE class_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Student Reference
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,

  -- Schedule
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 6=Saturday
  start_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes IN (30, 90)),
  session_type TEXT NOT NULL CHECK (session_type IN ('main', 'short')), -- main=90min, short=30min

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Notes
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(student_id, day_of_week, start_time)
);

-- =============================================
-- 6. Create indexes
-- =============================================
-- Applications
CREATE INDEX idx_applications_email ON applications(email);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_submitted_at ON applications(submitted_at DESC);

-- Students
CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_students_student_id ON students(student_id);
CREATE INDEX idx_students_status ON students(status);
CREATE INDEX idx_students_user_id ON students(user_id);

-- Payments
CREATE INDEX idx_payments_student_id ON payments(student_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_academic_year ON payments(academic_year);
CREATE INDEX idx_payments_due_date ON payments(due_date);

-- Class Sessions
CREATE INDEX idx_class_sessions_student ON class_sessions(student_id) WHERE is_active = true;
CREATE INDEX idx_class_sessions_schedule ON class_sessions(day_of_week, start_time) WHERE is_active = true;

-- =============================================
-- 7. Enable Row Level Security
-- =============================================
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_sessions ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 8. RLS Policies
-- =============================================
-- Applications: Admins only
CREATE POLICY "Admins can manage applications"
ON applications FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Students: Admins only
CREATE POLICY "Admins can manage students"
ON students FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Payments: Admins can manage, anyone can insert (for public upload)
CREATE POLICY "Admins can manage payments"
ON payments FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Anyone can upload payment proof"
ON payments FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Class Sessions: Admins only
CREATE POLICY "Admins can manage class sessions"
ON class_sessions FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- =============================================
-- 9. Helper Functions
-- =============================================

-- Function to generate student ID
CREATE OR REPLACE FUNCTION generate_student_id()
RETURNS TEXT AS $$
DECLARE
  v_year TEXT;
  v_count INTEGER;
  v_student_id TEXT;
BEGIN
  v_year := TO_CHAR(CURRENT_DATE, 'YYYY');

  -- Get count of students this year
  SELECT COUNT(*) INTO v_count
  FROM students
  WHERE student_id LIKE 'STU-' || v_year || '-%';

  -- Generate ID: STU-YYYY-00001
  v_student_id := 'STU-' || v_year || '-' || LPAD((v_count + 1)::TEXT, 5, '0');

  RETURN v_student_id;
END;
$$ LANGUAGE plpgsql;

-- Function to generate installment payments
CREATE OR REPLACE FUNCTION generate_installment_payments(
  p_student_id UUID,
  p_installments_per_year INTEGER DEFAULT 5
)
RETURNS void AS $$
DECLARE
  v_amount_per_installment DECIMAL(10,2);
  v_year INTEGER;
  v_installment INTEGER;
  v_due_date DATE;
  v_enrolled_date DATE;
BEGIN
  -- Get student's enrolled date
  SELECT enrolled_date INTO v_enrolled_date
  FROM students
  WHERE id = p_student_id;

  -- Calculate amount per installment ($300 / installments_per_year)
  v_amount_per_installment := 300.00 / p_installments_per_year;

  -- Delete existing pending payments for this student
  DELETE FROM payments
  WHERE student_id = p_student_id
  AND status = 'pending';

  -- Generate payments for Year 1 and Year 2
  FOR v_year IN 1..2 LOOP
    FOR v_installment IN 1..p_installments_per_year LOOP
      -- Calculate due date based on enrolled date
      v_due_date := v_enrolled_date +
        ((v_year - 1) * 365) + -- Years offset
        ((v_installment - 1) * (365 / p_installments_per_year))::INTEGER; -- Installment offset

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
        v_amount_per_installment,
        v_due_date,
        'pending',
        v_year,
        v_installment,
        'bank_transfer',
        NOW(),
        NOW()
      );
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to update payment totals when payment is verified
CREATE OR REPLACE FUNCTION update_student_payment_totals()
RETURNS TRIGGER AS $$
DECLARE
  v_year1_total DECIMAL(10,2);
  v_year2_total DECIMAL(10,2);
  v_total DECIMAL(10,2);
BEGIN
  -- Only update if payment status changed to 'verified'
  IF NEW.status = 'verified' AND (OLD.status IS NULL OR OLD.status != 'verified') THEN
    -- Calculate totals for each year
    SELECT COALESCE(SUM(amount), 0) INTO v_year1_total
    FROM payments
    WHERE student_id = NEW.student_id
    AND academic_year = 1
    AND status = 'verified';

    SELECT COALESCE(SUM(amount), 0) INTO v_year2_total
    FROM payments
    WHERE student_id = NEW.student_id
    AND academic_year = 2
    AND status = 'verified';

    v_total := v_year1_total + v_year2_total;

    -- Update student record
    UPDATE students
    SET
      year1_paid = v_year1_total,
      year2_paid = v_year2_total,
      total_paid = v_total,
      balance_remaining = total_fees - v_total,
      updated_at = NOW()
    WHERE id = NEW.student_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update student payment totals
CREATE TRIGGER update_payment_totals_trigger
AFTER INSERT OR UPDATE ON payments
FOR EACH ROW
EXECUTE FUNCTION update_student_payment_totals();

-- Function to auto-generate student ID
CREATE OR REPLACE FUNCTION auto_generate_student_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.student_id IS NULL THEN
    NEW.student_id := generate_student_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_student_id_trigger
BEFORE INSERT ON students
FOR EACH ROW
EXECUTE FUNCTION auto_generate_student_id();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_applications_timestamp
BEFORE UPDATE ON applications
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_students_timestamp
BEFORE UPDATE ON students
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_payments_timestamp
BEFORE UPDATE ON payments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_class_sessions_timestamp
BEFORE UPDATE ON class_sessions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- =============================================
-- 10. Comments
-- =============================================
COMMENT ON TABLE applications IS 'Stores student applications before approval';
COMMENT ON TABLE students IS 'Stores enrolled students (approved applications)';
COMMENT ON TABLE payments IS 'Stores all payment records and proofs';
COMMENT ON TABLE class_sessions IS 'Stores personalized class schedules for each student';

COMMENT ON COLUMN students.student_id IS 'Auto-generated unique student ID (STU-YYYY-XXXXX)';
COMMENT ON COLUMN students.total_fees IS 'Total program fees ($300/year x 2 years = $600)';
COMMENT ON COLUMN students.installments_per_year IS 'Number of installments per year (1-5)';

COMMENT ON COLUMN payments.academic_year IS 'Which year of the program (1 or 2)';
COMMENT ON COLUMN payments.installment_number IS 'Which installment in the year (1-5, or NULL for full payment)';

COMMENT ON COLUMN class_sessions.day_of_week IS '0=Sunday, 1=Monday, ..., 6=Saturday';
COMMENT ON COLUMN class_sessions.session_type IS 'main=90min session, short=30min session';

-- =============================================
-- SUCCESS
-- =============================================
SELECT '✅ Fresh lite version schema created!' as message;
