-- ===================================================================
-- DISABLE RLS ON ALL TABLES THAT NEED PUBLIC/SERVICE ACCESS
-- ===================================================================
-- This fixes the student creation and notification issues
-- ===================================================================

-- Disable RLS on applications (already done, but included for completeness)
ALTER TABLE applications DISABLE ROW LEVEL SECURITY;

-- Disable RLS on students (this is causing the 500 error)
ALTER TABLE students DISABLE ROW LEVEL SECURITY;

-- Disable RLS on profiles (needed for student creation)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Disable RLS on enrollments (needed for student enrollment)
ALTER TABLE enrollments DISABLE ROW LEVEL SECURITY;

-- Disable RLS on payments (needed for payment records)
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;

-- Keep class_schedules with RLS if you want (or disable it too)
-- ALTER TABLE class_schedules DISABLE ROW LEVEL SECURITY;

-- Drop all policies on these tables
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on applications
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'applications') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON applications';
    END LOOP;

    -- Drop all policies on students
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'students') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON students';
    END LOOP;

    -- Drop all policies on profiles
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON profiles';
    END LOOP;

    -- Drop all policies on enrollments
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'enrollments') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON enrollments';
    END LOOP;

    -- Drop all policies on payments
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'payments') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON payments';
    END LOOP;
END $$;

-- ===================================================================
-- VERIFICATION
-- ===================================================================

-- Check RLS status on all tables
SELECT
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('applications', 'students', 'profiles', 'enrollments', 'payments')
ORDER BY tablename;

-- Check policy count (should be 0 for all)
SELECT
  tablename,
  COUNT(*) as "Policy Count"
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('applications', 'students', 'profiles', 'enrollments', 'payments')
GROUP BY tablename
ORDER BY tablename;
