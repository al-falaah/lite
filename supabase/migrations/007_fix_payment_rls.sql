-- =============================================
-- Fix Payment RLS Policies
-- =============================================

-- Drop all existing payment policies
DROP POLICY IF EXISTS "Admins can manage payments" ON payments;
DROP POLICY IF EXISTS "Anyone can upload payment proof" ON payments;
DROP POLICY IF EXISTS "Anyone can insert payment proof" ON payments;
DROP POLICY IF EXISTS "Public can insert payments" ON payments;

-- Create new policies with correct permissions

-- 1. Anyone (anon/authenticated) can INSERT payment records
CREATE POLICY "Anyone can insert payments"
ON payments FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 2. Only admins can SELECT all payments
CREATE POLICY "Admins can view payments"
ON payments FOR SELECT
TO authenticated
USING (is_admin());

-- 3. Only admins can UPDATE payments
CREATE POLICY "Admins can update payments"
ON payments FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- 4. Only admins can DELETE payments
CREATE POLICY "Admins can delete payments"
ON payments FOR DELETE
TO authenticated
USING (is_admin());

-- =============================================
-- SUCCESS
-- =============================================
SELECT '✅ Payment RLS policies fixed!' as message;
