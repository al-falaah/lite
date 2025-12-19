-- Drop existing policies
DROP POLICY IF EXISTS "Public can view published blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Authenticated users can manage blog posts" ON blog_posts;

-- Public can read published posts only
CREATE POLICY "Public can view published blog posts"
ON blog_posts FOR SELECT
USING (status = 'published');

-- Admins can view all posts (including drafts)
CREATE POLICY "Admins can view all blog posts"
ON blog_posts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Admins can insert posts
CREATE POLICY "Admins can insert blog posts"
ON blog_posts FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Admins can update posts
CREATE POLICY "Admins can update blog posts"
ON blog_posts FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Admins can delete posts
CREATE POLICY "Admins can delete blog posts"
ON blog_posts FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
