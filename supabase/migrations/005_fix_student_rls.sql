-- =============================================
-- Fix RLS: Allow public to read students for payment lookup
-- =============================================

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Admins can manage students" ON students;

-- Create separate policies for better control
-- 1. Anyone can read student records (for payment lookup)
CREATE POLICY "Anyone can read students"
ON students FOR SELECT
TO anon, authenticated
USING (true);

-- 2. Only admins can insert/update/delete
CREATE POLICY "Admins can insert students"
ON students FOR INSERT
TO authenticated
WITH CHECK (is_admin());

CREATE POLICY "Admins can update students"
ON students FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Admins can delete students"
ON students FOR DELETE
TO authenticated
USING (is_admin());

-- =============================================
-- SUCCESS
-- =============================================
SELECT '✅ Student RLS policies fixed!' as message;
