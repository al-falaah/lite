-- =============================================
-- FIX RLS PERFORMANCE ISSUE
-- The EXISTS subquery is causing timeouts
-- Use simpler, faster policies
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "admin_delete" ON blog_posts;
DROP POLICY IF EXISTS "admin_insert" ON blog_posts;
DROP POLICY IF EXISTS "admin_update" ON blog_posts;
DROP POLICY IF EXISTS "anon_read_published" ON blog_posts;
DROP POLICY IF EXISTS "authenticated_read_published" ON blog_posts;

-- =============================================
-- NEW OPTIMIZED POLICIES
-- =============================================

-- 1. PUBLIC READ - Simple, no joins
CREATE POLICY "public_read_published"
ON blog_posts FOR SELECT
USING (status = 'published');

-- 2. ADMIN INSERT - Direct check, no EXISTS
CREATE POLICY "admin_can_insert"
ON blog_posts FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
);

-- 3. ADMIN UPDATE - Direct check, no EXISTS
CREATE POLICY "admin_can_update"
ON blog_posts FOR UPDATE
TO authenticated
USING (
  (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
)
WITH CHECK (
  (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
);

-- 4. ADMIN DELETE - Direct check, no EXISTS
CREATE POLICY "admin_can_delete"
ON blog_posts FOR DELETE
TO authenticated
USING (
  (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
);

-- =============================================
-- CREATE INDEX for faster lookups
-- =============================================
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin
ON profiles(id, is_admin)
WHERE is_admin = true;

-- =============================================
-- VERIFY
-- =============================================
SELECT
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'blog_posts'
ORDER BY cmd, policyname;
