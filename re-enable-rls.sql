-- Re-enable RLS with simple policies

-- Enable RLS on the table
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- 1. PUBLIC READ - Anyone can read published posts
CREATE POLICY "blog_select_published"
ON blog_posts FOR SELECT
USING (status = 'published');

-- 2. ADMIN INSERT - Authenticated users can insert
CREATE POLICY "blog_insert_admin"
ON blog_posts FOR INSERT
TO authenticated
WITH CHECK (true);

-- 3. ADMIN UPDATE - Authenticated users can update
CREATE POLICY "blog_update_admin"
ON blog_posts FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 4. ADMIN DELETE - Authenticated users can delete
CREATE POLICY "blog_delete_admin"
ON blog_posts FOR DELETE
TO authenticated
USING (true);

-- Verify policies are created
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'blog_posts'
ORDER BY cmd, policyname;