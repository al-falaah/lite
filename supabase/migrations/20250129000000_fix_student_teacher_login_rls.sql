-- Fix RLS policies for student and teacher login
-- Students and teachers use custom authentication (not Supabase Auth)
-- They need to be able to query their own records by student_id/staff_id to login

-- ========================================
-- TEACHERS TABLE - Enable RLS and add policies
-- ========================================

-- Enable RLS on teachers table
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view teachers for login" ON teachers;
DROP POLICY IF EXISTS "Teachers can update own profile" ON teachers;
DROP POLICY IF EXISTS "Admins can manage teachers" ON teachers;

-- Allow anyone to view teachers (needed for login verification)
CREATE POLICY "Anyone can view teachers for login"
ON teachers
FOR SELECT
TO anon, authenticated
USING (true);

-- Allow teachers to update their own profile (e.g., password change)
CREATE POLICY "Teachers can update own profile"
ON teachers
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Admin full access to teachers
CREATE POLICY "Admins can manage teachers"
ON teachers
FOR ALL
TO authenticated
USING (
  auth.jwt() ->> 'role' = 'admin' OR
  auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
)
WITH CHECK (
  auth.jwt() ->> 'role' = 'admin' OR
  auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
);

-- ========================================
-- STUDENTS TABLE - Update existing policies
-- ========================================

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view students" ON students;
DROP POLICY IF EXISTS "Students can update own profile" ON students;
DROP POLICY IF EXISTS "Admins can manage students" ON students;

-- Allow anyone to view students (needed for login verification and public directory)
CREATE POLICY "Anyone can view students"
ON students
FOR SELECT
TO anon, authenticated
USING (true);

-- Allow students to update their own profile (e.g., password change)
-- Since students don't use Supabase Auth, we can't use auth.uid()
-- Instead, allow anyone to update (password comparison happens in application layer)
CREATE POLICY "Students can update own profile"
ON students
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Admin full access to students
CREATE POLICY "Admins can manage students"
ON students
FOR ALL
TO authenticated
USING (
  auth.jwt() ->> 'role' = 'admin' OR
  auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
)
WITH CHECK (
  auth.jwt() ->> 'role' = 'admin' OR
  auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
);

COMMENT ON POLICY "Anyone can view students" ON students IS 'Allows student login verification and public directory access';
COMMENT ON POLICY "Students can update own profile" ON students IS 'Allows students to update their profile (password changes, etc.). Password verification happens in application layer.';
COMMENT ON POLICY "Anyone can view teachers for login" ON teachers IS 'Allows teacher login verification';
COMMENT ON POLICY "Teachers can update own profile" ON teachers IS 'Allows teachers to update their profile (password changes, etc.). Password verification happens in application layer.';
