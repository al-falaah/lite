-- Allow admin users to view all blog posts and store orders
-- This enables admin dashboards to show correct statistics

-- Blog Posts: Allow admins and blog_admins to view all posts
DROP POLICY IF EXISTS "Anyone can view published posts" ON blog_posts;
DROP POLICY IF EXISTS "Admins can view all posts" ON blog_posts;

-- Public can view published posts
CREATE POLICY "Anyone can view published posts"
ON blog_posts
FOR SELECT
TO public
USING (status = 'published');

-- Admins can view all posts (including drafts)
CREATE POLICY "Admins can view all posts"
ON blog_posts
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND (is_admin = true OR role IN ('blog_admin', 'director'))
  )
);

-- Store Orders: Admins can view all orders
DROP POLICY IF EXISTS "Admins can view all orders" ON store_orders;

CREATE POLICY "Admins can view all orders"
ON store_orders
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND (is_admin = true OR role IN ('store_admin', 'director'))
  )
);

-- Ensure RLS is enabled on both tables
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_orders ENABLE ROW LEVEL SECURITY;
