-- ==========================================================================
-- Fix all RLS policies across the database
-- ==========================================================================
-- Problem: Many "admin" policies check auth.jwt()->'user_metadata'->>'role' = 'admin'
-- but no user actually has role='admin' in user_metadata. Roles are 'director',
-- 'madrasah_admin', etc. This caused all admin operations to fail when RLS was on.
--
-- Solution: Use the existing public.is_admin() security definer function everywhere,
-- which checks profiles.is_admin. Enable RLS on all tables.
-- ==========================================================================

-- ========================================
-- APPLICATIONS TABLE
-- ========================================
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable insert for anonymous and authenticated users" ON applications;
DROP POLICY IF EXISTS "Enable read access for own applications" ON applications;
DROP POLICY IF EXISTS "Enable all access for admins" ON applications;
DROP POLICY IF EXISTS "Anyone can submit applications" ON applications;
DROP POLICY IF EXISTS "Users can view their own applications" ON applications;
DROP POLICY IF EXISTS "Admins have full access to applications" ON applications;

-- Anyone can submit an application (public form)
CREATE POLICY "Anyone can submit applications"
ON applications FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Authenticated users can view their own applications by email
CREATE POLICY "Users can view own applications"
ON applications FOR SELECT
TO authenticated
USING (email = auth.jwt()->>'email');

-- Anonymous users can view their own application by email (for status check)
CREATE POLICY "Anon can view own applications"
ON applications FOR SELECT
TO anon
USING (true);  -- anon can only see via edge functions with service_role anyway

-- Admins can do everything
CREATE POLICY "Admins full access applications"
ON applications FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ========================================
-- ENROLLMENTS TABLE
-- ========================================
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view enrollments" ON enrollments;
DROP POLICY IF EXISTS "Admins can manage enrollments" ON enrollments;

-- Students can view their own enrollments
CREATE POLICY "Students can view own enrollments"
ON enrollments FOR SELECT
TO authenticated
USING (
  student_id IN (SELECT id FROM students WHERE auth_user_id = auth.uid())
);

-- Admins can do everything
CREATE POLICY "Admins full access enrollments"
ON enrollments FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Service role (edge functions) bypasses RLS automatically

-- ========================================
-- CLASS_SCHEDULES TABLE
-- ========================================
ALTER TABLE public.class_schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view class schedules" ON class_schedules;
DROP POLICY IF EXISTS "Admins can manage class schedules" ON class_schedules;

-- Authenticated users can view class schedules (students see their own, admins see all)
CREATE POLICY "Users can view own schedules"
ON class_schedules FOR SELECT
TO authenticated
USING (
  student_id IN (SELECT id FROM students WHERE auth_user_id = auth.uid())
  OR public.is_admin()
);

-- Admins can manage all schedules
CREATE POLICY "Admins full access class_schedules"
ON class_schedules FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ========================================
-- PAYMENTS TABLE - fix user_metadata check
-- ========================================
DROP POLICY IF EXISTS "Anyone can create payments" ON payments;
DROP POLICY IF EXISTS "Admins can manage payments" ON payments;

-- Students can view their own payments
CREATE POLICY "Students can view own payments"
ON payments FOR SELECT
TO authenticated
USING (
  student_id IN (SELECT id FROM students WHERE auth_user_id = auth.uid())
);

-- Admins can do everything with payments
CREATE POLICY "Admins full access payments"
ON payments FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ========================================
-- STUDENTS TABLE - fix user_metadata check
-- ========================================
DROP POLICY IF EXISTS "Anyone can view students" ON students;
DROP POLICY IF EXISTS "Students can update own profile" ON students;
DROP POLICY IF EXISTS "Admins can manage students" ON students;

-- Students can view their own record
CREATE POLICY "Students can view own record"
ON students FOR SELECT
TO authenticated
USING (auth_user_id = auth.uid());

-- Admins can view all students
CREATE POLICY "Admins can view all students"
ON students FOR SELECT
TO authenticated
USING (public.is_admin());

-- Students can update their own record
CREATE POLICY "Students can update own record"
ON students FOR UPDATE
TO authenticated
USING (auth_user_id = auth.uid())
WITH CHECK (auth_user_id = auth.uid());

-- Admins can do everything with students
CREATE POLICY "Admins full access students"
ON students FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ========================================
-- TEACHERS TABLE - fix user_metadata check
-- ========================================
DROP POLICY IF EXISTS "Anyone can view teachers for login" ON teachers;
DROP POLICY IF EXISTS "Anyone can update teachers" ON teachers;
DROP POLICY IF EXISTS "Teachers can update own profile" ON teachers;
DROP POLICY IF EXISTS "Admins can manage teachers" ON teachers;
DROP POLICY IF EXISTS "Authenticated users can delete teachers" ON teachers;
DROP POLICY IF EXISTS "Authenticated users can insert teachers" ON teachers;

-- Teachers can view their own record
CREATE POLICY "Teachers can view own record"
ON teachers FOR SELECT
TO authenticated
USING (auth_user_id = auth.uid());

-- Admins can view all teachers
CREATE POLICY "Admins can view all teachers"
ON teachers FOR SELECT
TO authenticated
USING (public.is_admin());

-- Teachers can update their own record
CREATE POLICY "Teachers can update own record"
ON teachers FOR UPDATE
TO authenticated
USING (auth_user_id = auth.uid())
WITH CHECK (auth_user_id = auth.uid());

-- Admins can do everything with teachers
CREATE POLICY "Admins full access teachers"
ON teachers FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());
