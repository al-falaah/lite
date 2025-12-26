-- ===================================================================
-- HYBRID SOLUTION: Enable RLS but grant service role full access
-- ===================================================================
-- This removes security warnings while keeping functionality
-- Service role (used by Edge Functions) bypasses RLS anyway
-- ===================================================================

-- Enable RLS on all tables
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- For applications: Allow anonymous INSERT, service role gets full access
CREATE POLICY "service_role_full_access_applications"
ON applications
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "anon_insert_applications"
ON applications
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- For students: Service role only
CREATE POLICY "service_role_full_access_students"
ON students
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- For profiles: Service role only
CREATE POLICY "service_role_full_access_profiles"
ON profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- For enrollments: Service role only
CREATE POLICY "service_role_full_access_enrollments"
ON enrollments
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- For payments: Service role only
CREATE POLICY "service_role_full_access_payments"
ON payments
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ===================================================================
-- VERIFICATION
-- ===================================================================

SELECT tablename, rowsecurity FROM pg_tables
WHERE tablename IN ('applications', 'students', 'profiles', 'enrollments', 'payments')
ORDER BY tablename;

SELECT tablename, policyname, roles FROM pg_policies
WHERE tablename IN ('applications', 'students', 'profiles', 'enrollments', 'payments')
ORDER BY tablename, policyname;
