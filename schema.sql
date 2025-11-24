-- Al-Falaah Islamic Institute Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- DROP EXISTING OBJECTS (for clean reinstall)
-- =============================================

-- Drop tables (CASCADE removes dependent objects including triggers)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS lesson_notes CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS cohorts CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop storage policies
DROP POLICY IF EXISTS "Students can upload payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Students can view own payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload lesson materials" ON storage.objects;
DROP POLICY IF EXISTS "Anyone authenticated can view lesson materials" ON storage.objects;

-- Drop functions (will also drop triggers that use them)
DROP FUNCTION IF EXISTS is_admin() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS set_student_number() CASCADE;
DROP FUNCTION IF EXISTS generate_student_number() CASCADE;
DROP FUNCTION IF EXISTS handle_student_withdrawal() CASCADE;
DROP FUNCTION IF EXISTS update_overdue_payments() CASCADE;
DROP FUNCTION IF EXISTS calculate_refund(UUID, DATE) CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Drop enums
DROP TYPE IF EXISTS attendance_status CASCADE;
DROP TYPE IF EXISTS program_type CASCADE;
DROP TYPE IF EXISTS class_format CASCADE;
DROP TYPE IF EXISTS payment_method CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS application_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- =============================================
-- ENUMS
-- =============================================

CREATE TYPE user_role AS ENUM ('student', 'admin');
CREATE TYPE application_status AS ENUM ('pending', 'under_review', 'approved', 'rejected', 'enrolled');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'overdue', 'cancelled', 'pending_verification');
CREATE TYPE payment_method AS ENUM ('stripe', 'bank_deposit');
CREATE TYPE class_format AS ENUM ('one-on-one', 'cohort');
CREATE TYPE program_type AS ENUM ('foundational', 'essentials');
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late', 'excused');

-- =============================================
-- TABLES
-- =============================================

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'student',
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  date_of_birth DATE,
  address TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Students table
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_number TEXT UNIQUE NOT NULL,
  program_type program_type,
  class_format class_format,
  cohort_id UUID,
  enrollment_date DATE,
  status TEXT DEFAULT 'active', -- active, suspended, graduated, withdrawn

  -- Withdrawal tracking
  withdrawal_date DATE,
  withdrawal_reason TEXT,
  withdrawal_type TEXT, -- 'voluntary', 'academic', 'financial', 'disciplinary', 'other'
  eligible_for_refund BOOLEAN DEFAULT false,
  refund_amount DECIMAL(10, 2),
  refund_processed BOOLEAN DEFAULT false,
  can_reapply BOOLEAN DEFAULT true,

  can_read_quran BOOLEAN DEFAULT false,
  tajweed_level TEXT, -- basic, intermediate, advanced
  islamic_knowledge_level TEXT, -- beginner, intermediate, advanced
  preferred_learning_style TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Cohorts table (for group-based classes)
CREATE TABLE cohorts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  program_type program_type NOT NULL,
  academic_year INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  max_students INTEGER DEFAULT 20,
  current_students INTEGER DEFAULT 0,
  instructor_name TEXT,
  meeting_schedule TEXT, -- e.g., "Sundays 10:00 AM - 12:00 PM"
  status TEXT DEFAULT 'active', -- active, completed, cancelled
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Applications table
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE, -- Nullable: filled after account creation

  -- Applicant information (required for public applications)
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),

  program_type program_type NOT NULL,
  class_format class_format NOT NULL,
  preferred_cohort_id UUID REFERENCES cohorts(id),

  -- Application responses
  motivation TEXT NOT NULL,
  islamic_background TEXT,
  can_read_quran BOOLEAN NOT NULL,
  tajweed_level TEXT,
  learning_goals TEXT,
  time_commitment TEXT,
  previous_islamic_education TEXT,

  -- Payment plan selection
  payment_plan_id TEXT NOT NULL, -- 'full', 'two', 'three', 'five'

  -- Application status
  status application_status DEFAULT 'pending',
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  admin_notes TEXT,
  rejection_reason TEXT,

  -- Invite system (for approved applications)
  invite_token TEXT UNIQUE,
  invite_sent_at TIMESTAMPTZ,
  invite_expires_at TIMESTAMPTZ,
  account_created_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  application_id UUID REFERENCES applications(id),

  -- Payment details
  amount DECIMAL(10, 2) NOT NULL,
  installment_number INTEGER NOT NULL,
  total_installments INTEGER NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE,

  -- Payment method
  payment_method payment_method,
  payment_reference TEXT, -- For bank deposits or Stripe payment ID

  -- Status
  status payment_status DEFAULT 'pending',

  -- Bank deposit verification
  deposit_proof_url TEXT, -- URL to uploaded receipt/proof
  verified_by UUID REFERENCES profiles(id),
  verified_at TIMESTAMPTZ,
  verification_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lesson notes table (for cohort classes)
CREATE TABLE lesson_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  lesson_number INTEGER NOT NULL,
  lesson_date DATE NOT NULL,
  title TEXT NOT NULL,
  topics_covered TEXT[],
  materials_url TEXT, -- Link to shared materials (Google Drive, etc.)
  homework TEXT,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cohort_id, lesson_number)
);

-- Attendance table
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  cohort_id UUID REFERENCES cohorts(id),
  date DATE NOT NULL,
  status attendance_status NOT NULL,
  notes TEXT,
  marked_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, date)
);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL, -- 'application', 'payment', 'general', 'announcement'
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  action_url TEXT, -- Optional link for the notification
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES for Performance
-- =============================================

CREATE INDEX idx_students_user_id ON students(user_id);
CREATE INDEX idx_students_cohort_id ON students(cohort_id);
CREATE INDEX idx_applications_student_id ON applications(student_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_email ON applications(email); -- For invite token lookups
CREATE INDEX idx_applications_invite_token ON applications(invite_token); -- For invite verification
CREATE INDEX idx_payments_student_id ON payments(student_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_due_date ON payments(due_date);
CREATE INDEX idx_attendance_student_id ON attendance(student_id);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_lesson_notes_cohort_id ON lesson_notes(cohort_id);

-- =============================================
-- TRIGGERS for updated_at
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cohorts_updated_at BEFORE UPDATE ON cohorts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lesson_notes_updated_at BEFORE UPDATE ON lesson_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON attendance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- FUNCTION to generate student number
-- =============================================

CREATE OR REPLACE FUNCTION generate_student_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  year TEXT;
  sequence_num INTEGER;
BEGIN
  year := TO_CHAR(NOW(), 'YY');

  -- Get the next sequence number for this year
  SELECT COALESCE(MAX(CAST(SUBSTRING(student_number FROM 4) AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM students
  WHERE student_number LIKE 'AF' || year || '%';

  new_number := 'AF' || year || LPAD(sequence_num::TEXT, 4, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGER to auto-generate student number
-- =============================================

CREATE OR REPLACE FUNCTION set_student_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.student_number IS NULL THEN
    NEW.student_number := generate_student_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_student_number
  BEFORE INSERT ON students
  FOR EACH ROW
  EXECUTE FUNCTION set_student_number();

-- =============================================
-- TRIGGER to auto-create profile when user signs up
-- =============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name, email)
  VALUES (
    NEW.id,
    'student',
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================
-- TRIGGER to update payment status to overdue
-- =============================================

CREATE OR REPLACE FUNCTION update_overdue_payments()
RETURNS void AS $$
BEGIN
  UPDATE payments
  SET status = 'overdue'
  WHERE status = 'pending'
    AND due_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FUNCTION to handle student withdrawal
-- =============================================

CREATE OR REPLACE FUNCTION handle_student_withdrawal()
RETURNS TRIGGER AS $$
DECLARE
  student_cohort_id UUID;
BEGIN
  -- Only proceed if status changed to 'withdrawn'
  IF NEW.status = 'withdrawn' AND OLD.status != 'withdrawn' THEN

    -- Set withdrawal date if not already set
    IF NEW.withdrawal_date IS NULL THEN
      NEW.withdrawal_date := CURRENT_DATE;
    END IF;

    -- Get the student's cohort
    student_cohort_id := NEW.cohort_id;

    -- Decrement cohort student count
    IF student_cohort_id IS NOT NULL THEN
      UPDATE cohorts
      SET current_students = GREATEST(current_students - 1, 0)
      WHERE id = student_cohort_id;
    END IF;

    -- Cancel all future pending payments
    UPDATE payments
    SET status = 'cancelled',
        updated_at = NOW()
    WHERE student_id = NEW.id
      AND status IN ('pending', 'overdue')
      AND due_date > CURRENT_DATE;

    -- Create notification for admin
    INSERT INTO notifications (user_id, title, message, type)
    SELECT
      id,
      'Student Withdrawal',
      'Student ' || NEW.student_number || ' has withdrawn from the program.',
      'general'
    FROM profiles
    WHERE role = 'admin';

    -- Create notification for student
    INSERT INTO notifications (user_id, title, message, type)
    VALUES (
      NEW.user_id,
      'Withdrawal Confirmed',
      'Your withdrawal from the ' || NEW.program_type || ' program has been processed.',
      'general'
    );

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_student_withdrawal
  BEFORE UPDATE ON students
  FOR EACH ROW
  EXECUTE FUNCTION handle_student_withdrawal();

-- =============================================
-- FUNCTION to calculate refund eligibility
-- =============================================

CREATE OR REPLACE FUNCTION calculate_refund(
  p_student_id UUID,
  p_withdrawal_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  eligible BOOLEAN,
  refund_amount DECIMAL(10, 2),
  reason TEXT
) AS $$
DECLARE
  v_enrollment_date DATE;
  v_total_paid DECIMAL(10, 2);
  v_days_enrolled INTEGER;
  v_program_fee DECIMAL(10, 2) := 300.00;
  v_refund_percentage DECIMAL(5, 2);
BEGIN
  -- Get student enrollment date
  SELECT enrollment_date INTO v_enrollment_date
  FROM students
  WHERE id = p_student_id;

  -- Calculate days enrolled
  v_days_enrolled := p_withdrawal_date - v_enrollment_date;

  -- Calculate total amount paid
  SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
  FROM payments
  WHERE student_id = p_student_id
    AND status = 'paid';

  -- Determine refund policy
  -- Within 7 days: 100% refund
  -- 8-30 days: 75% refund
  -- 31-60 days: 50% refund
  -- 61-90 days: 25% refund
  -- After 90 days: No refund

  IF v_days_enrolled <= 7 THEN
    v_refund_percentage := 1.00;
    reason := 'Within 7 days - 100% refund policy';
  ELSIF v_days_enrolled <= 30 THEN
    v_refund_percentage := 0.75;
    reason := '8-30 days - 75% refund policy';
  ELSIF v_days_enrolled <= 60 THEN
    v_refund_percentage := 0.50;
    reason := '31-60 days - 50% refund policy';
  ELSIF v_days_enrolled <= 90 THEN
    v_refund_percentage := 0.25;
    reason := '61-90 days - 25% refund policy';
  ELSE
    v_refund_percentage := 0.00;
    reason := 'After 90 days - No refund';
  END IF;

  -- Calculate refund amount
  refund_amount := LEAST(v_total_paid, v_program_fee * v_refund_percentage);
  eligible := refund_amount > 0;

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- HELPER FUNCTION to check if user is admin (bypasses RLS)
-- =============================================

-- is_admin() function - RLS-safe version using SECURITY DEFINER
-- SECURITY DEFINER makes this function execute with elevated privileges,
-- bypassing RLS entirely and preventing circular dependency issues
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Query the profiles table directly
  -- Because of SECURITY DEFINER, this bypasses all RLS policies
  SELECT role INTO user_role
  FROM profiles
  WHERE id = auth.uid();

  -- Return true if role is admin, false otherwise
  RETURN COALESCE(user_role = 'admin', false);
EXCEPTION
  WHEN OTHERS THEN
    -- If any error occurs, return false (user is not admin)
    RETURN false;
END;
$$;

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Service role policy (allows backend admin operations)
CREATE POLICY "Service role can manage all profiles" ON profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Admin policy for viewing all profiles
-- This is safe now because is_admin() uses SECURITY DEFINER which bypasses RLS
-- No circular dependency because the function's query doesn't trigger RLS evaluation
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (is_admin());

-- Students policies
CREATE POLICY "Students can view own data" ON students
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own student record" ON students
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Students can update own data" ON students
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all students" ON students
  FOR ALL USING (is_admin());

-- Applications policies
CREATE POLICY "Anyone can submit applications" ON applications
  FOR INSERT TO anon, authenticated
  WITH CHECK (true); -- Public applications don't require authentication

CREATE POLICY "Anon can view unlinked applications" ON applications
  FOR SELECT TO anon
  USING (student_id IS NULL); -- Allow anon to see applications not yet linked to students

CREATE POLICY "Students can view own applications" ON applications
  FOR SELECT TO authenticated
  USING (
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can manage all applications" ON applications
  FOR ALL USING (is_admin());

-- Payments policies
CREATE POLICY "Students can view own payments" ON payments
  FOR SELECT USING (
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
  );

CREATE POLICY "Students can update own payments" ON payments
  FOR UPDATE USING (
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can manage all payments" ON payments
  FOR ALL USING (is_admin());

-- Cohorts policies
CREATE POLICY "Anyone can view active cohorts" ON cohorts
  FOR SELECT TO anon, authenticated
  USING (status = 'active');

CREATE POLICY "Admins can manage cohorts" ON cohorts
  FOR ALL USING (is_admin());

-- Lesson notes policies
CREATE POLICY "Students can view lesson notes for their cohort" ON lesson_notes
  FOR SELECT USING (
    cohort_id IN (SELECT cohort_id FROM students WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can manage lesson notes" ON lesson_notes
  FOR ALL USING (is_admin());

-- Attendance policies
CREATE POLICY "Students can view own attendance" ON attendance
  FOR SELECT USING (
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can manage attendance" ON attendance
  FOR ALL USING (is_admin());

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can create notifications" ON notifications
  FOR INSERT WITH CHECK (is_admin());

-- =============================================
-- GRANT PERMISSIONS TO ROLES
-- =============================================

-- Grant schema usage to anon role
GRANT USAGE ON SCHEMA public TO anon;

-- Allow anonymous users to insert applications (public application form)
GRANT INSERT ON applications TO anon;
GRANT SELECT ON applications TO anon; -- Needed to return the inserted row

-- Allow anonymous users to read active cohorts (for application form dropdown)
GRANT SELECT ON cohorts TO anon;

-- Grant sequence usage for auto-generated IDs
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- =============================================
-- STORAGE BUCKETS (for file uploads)
-- =============================================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('payment-proofs', 'payment-proofs', false),
  ('lesson-materials', 'lesson-materials', true)
ON CONFLICT DO NOTHING;

-- Storage policies for payment proofs
CREATE POLICY "Students can upload payment proofs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'payment-proofs' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Students can view own payment proofs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'payment-proofs' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all payment proofs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'payment-proofs' AND
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Storage policies for lesson materials
CREATE POLICY "Admins can upload lesson materials"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'lesson-materials' AND
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Anyone authenticated can view lesson materials"
ON storage.objects FOR SELECT
USING (bucket_id = 'lesson-materials' AND auth.role() = 'authenticated');

-- =============================================
-- INITIAL DATA / SEED DATA
-- =============================================

-- Create first admin user profile (update the UUID with your actual admin user ID after signup)
-- INSERT INTO profiles (id, role, full_name, email)
-- VALUES ('your-admin-user-uuid', 'admin', 'Admin User', 'admin@alfalaah.co.nz');
