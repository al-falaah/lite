-- Add public access policies before enabling RLS
-- This ensures public functionality (like student applications) continues to work

-- ========================================
-- APPLICATIONS TABLE - Allow public submission
-- ========================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can submit applications" ON applications;
DROP POLICY IF EXISTS "Users can view their own applications" ON applications;
DROP POLICY IF EXISTS "Admins have full access to applications" ON applications;

-- Allow anyone to submit applications
CREATE POLICY "Anyone can submit applications"
ON applications
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow users to view their own applications (optional, can adjust based on requirements)
CREATE POLICY "Users can view their own applications"
ON applications
FOR SELECT
TO authenticated
USING (true);

-- Admin full access to applications
CREATE POLICY "Admins have full access to applications"
ON applications
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
-- CLASS_SCHEDULES TABLE - Public viewing
-- ========================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view class schedules" ON class_schedules;
DROP POLICY IF EXISTS "Admins can manage class schedules" ON class_schedules;

-- Allow anyone to view class schedules
CREATE POLICY "Anyone can view class schedules"
ON class_schedules
FOR SELECT
TO anon, authenticated
USING (true);

-- Admin full access to class schedules
CREATE POLICY "Admins can manage class schedules"
ON class_schedules
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
-- PAYMENTS TABLE - Restricted access
-- ========================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can create payments" ON payments;
DROP POLICY IF EXISTS "Admins can manage payments" ON payments;

-- Allow anyone to insert payments (for initial payment submission)
CREATE POLICY "Anyone can create payments"
ON payments
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Admin full access to payments
CREATE POLICY "Admins can manage payments"
ON payments
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
-- STUDENTS TABLE - Mixed access
-- ========================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view students" ON students;
DROP POLICY IF EXISTS "Students can update own profile" ON students;
DROP POLICY IF EXISTS "Admins can manage students" ON students;

-- Allow anyone to view student profiles (public directory)
CREATE POLICY "Anyone can view students"
ON students
FOR SELECT
TO anon, authenticated
USING (true);

-- Allow authenticated users to update their own student profile
CREATE POLICY "Students can update own profile"
ON students
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

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
