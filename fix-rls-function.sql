-- =============================================
-- ULTIMATE RLS FIX - Using Security Definer Function
-- This approach is MUCH faster as it caches the result
-- =============================================

-- Step 1: Create a fast function to check admin status
CREATE OR REPLACE FUNCTION is_user_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM profiles WHERE id = auth.uid() LIMIT 1),
    false
  );
$$;

-- Step 2: Drop existing policies
DROP POLICY IF EXISTS "admin_delete" ON blog_posts;
DROP POLICY IF EXISTS "admin_insert" ON blog_posts;
DROP POLICY IF EXISTS "admin_update" ON blog_posts;
DROP POLICY IF EXISTS "anon_read_published" ON blog_posts;
DROP POLICY IF EXISTS "authenticated_read_published" ON blog_posts;
DROP POLICY IF EXISTS "public_read_published" ON blog_posts;
DROP POLICY IF EXISTS "admin_can_insert" ON blog_posts;
DROP POLICY IF EXISTS "admin_can_update" ON blog_posts;
DROP POLICY IF EXISTS "admin_can_delete" ON blog_posts;

-- Step 3: Create new fast policies using the function
-- 1. PUBLIC READ
CREATE POLICY "public_read_published"
ON blog_posts FOR SELECT
USING (status = 'published');

-- 2. ADMIN INSERT
CREATE POLICY "admin_insert"
ON blog_posts FOR INSERT
TO authenticated
WITH CHECK (is_user_admin() = true);

-- 3. ADMIN UPDATE
CREATE POLICY "admin_update"
ON blog_posts FOR UPDATE
TO authenticated
USING (is_user_admin() = true)
WITH CHECK (is_user_admin() = true);

-- 4. ADMIN DELETE
CREATE POLICY "admin_delete"
ON blog_posts FOR DELETE
TO authenticated
USING (is_user_admin() = true);

-- Step 4: Create index (if not exists)
CREATE INDEX IF NOT EXISTS idx_profiles_user_admin
ON profiles(id) WHERE is_admin = true;

CREATE INDEX IF NOT EXISTS idx_blog_posts_status
ON blog_posts(status) WHERE status = 'published';

-- Step 5: Verify the function works
SELECT is_user_admin() as "Current user is admin?";

-- Step 6: Show policies
SELECT
  policyname as "Policy Name",
  cmd as "Command",
  roles as "Applies To"
FROM pg_policies
WHERE tablename = 'blog_posts'
ORDER BY cmd, policyname;
