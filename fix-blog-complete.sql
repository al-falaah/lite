-- =============================================
-- COMPLETE BLOG FIX - RLS + Data Issues
-- Run this in Supabase Dashboard > SQL Editor
-- =============================================

-- STEP 1: Fix published_at for existing published posts
-- =============================================
UPDATE blog_posts
SET published_at = COALESCE(published_at, created_at, NOW())
WHERE status = 'published' AND published_at IS NULL;

-- STEP 2: Drop all existing RLS policies
-- =============================================
DROP POLICY IF EXISTS "Public can view published blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Admins can view all blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Authenticated users can manage blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Admins can insert blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Admins can update blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Admins can delete blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Allow public read of published posts" ON blog_posts;
DROP POLICY IF EXISTS "Allow admins to read all posts" ON blog_posts;
DROP POLICY IF EXISTS "Allow admins to insert posts" ON blog_posts;
DROP POLICY IF EXISTS "Allow admins to update posts" ON blog_posts;
DROP POLICY IF EXISTS "Allow admins to delete posts" ON blog_posts;

-- STEP 3: Create optimized RLS policies
-- =============================================

-- Policy 1: PUBLIC READ (anon users) - Only published posts
CREATE POLICY "anon_read_published"
ON blog_posts FOR SELECT
TO anon
USING (status = 'published');

-- Policy 2: AUTHENTICATED READ (logged in, non-admin) - Only published posts
CREATE POLICY "authenticated_read_published"
ON blog_posts FOR SELECT
TO authenticated
USING (
  status = 'published'
  OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Policy 3: ADMIN INSERT
CREATE POLICY "admin_insert"
ON blog_posts FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Policy 4: ADMIN UPDATE
CREATE POLICY "admin_update"
ON blog_posts FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Policy 5: ADMIN DELETE
CREATE POLICY "admin_delete"
ON blog_posts FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- STEP 4: Verify the fix worked
-- =============================================
DO $$
DECLARE
  null_count INTEGER;
  policy_count INTEGER;
BEGIN
  -- Check for posts with null published_at
  SELECT COUNT(*) INTO null_count
  FROM blog_posts
  WHERE status = 'published' AND published_at IS NULL;

  IF null_count > 0 THEN
    RAISE WARNING 'Still have % published posts with null published_at!', null_count;
  ELSE
    RAISE NOTICE 'All published posts have published_at set';
  END IF;

  -- Check policy count
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'blog_posts';

  RAISE NOTICE 'Total RLS policies on blog_posts: %', policy_count;
END $$;

-- STEP 5: Show current policies for verification
-- =============================================
SELECT
  policyname as "Policy Name",
  cmd as "Command",
  roles as "Roles",
  CASE
    WHEN LENGTH(qual::text) > 60 THEN LEFT(qual::text, 60) || '...'
    ELSE qual::text
  END as "USING Expression"
FROM pg_policies
WHERE tablename = 'blog_posts'
ORDER BY cmd, policyname;

-- Show sample posts
SELECT
  id,
  title,
  status,
  published_at,
  created_at
FROM blog_posts
ORDER BY created_at DESC
LIMIT 5;
