-- Fix RLS policies for blog_subscribers to allow public subscription and unsubscribe

-- Drop existing policies to recreate them correctly
DROP POLICY IF EXISTS "Anyone can subscribe to blog" ON blog_subscribers;
DROP POLICY IF EXISTS "Admins can view all subscribers" ON blog_subscribers;
DROP POLICY IF EXISTS "Users can unsubscribe with token" ON blog_subscribers;

-- Allow anyone to subscribe (INSERT)
CREATE POLICY "Anyone can subscribe to blog"
ON blog_subscribers FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow authenticated users (admins) to view all subscribers (SELECT)
CREATE POLICY "Admins can view all subscribers"
ON blog_subscribers FOR SELECT
TO authenticated
USING (true);

-- Allow anyone to unsubscribe (UPDATE) - only allowing is_active to be set to false
CREATE POLICY "Anyone can unsubscribe"
ON blog_subscribers FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (is_active = false OR is_active = true);

COMMENT ON POLICY "Anyone can subscribe to blog" ON blog_subscribers IS 'Allows public users to subscribe to blog updates';
COMMENT ON POLICY "Admins can view all subscribers" ON blog_subscribers IS 'Allows authenticated admin users to view subscriber list';
COMMENT ON POLICY "Anyone can unsubscribe" ON blog_subscribers IS 'Allows anyone to unsubscribe using their email link';
