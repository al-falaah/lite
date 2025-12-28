-- Completely rebuild RLS policies for blog_subscribers

-- Disable RLS temporarily
ALTER TABLE blog_subscribers DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Anyone can subscribe to blog" ON blog_subscribers;
DROP POLICY IF EXISTS "Admins can view all subscribers" ON blog_subscribers;
DROP POLICY IF EXISTS "Users can unsubscribe with token" ON blog_subscribers;
DROP POLICY IF EXISTS "Anyone can unsubscribe" ON blog_subscribers;

-- Re-enable RLS
ALTER TABLE blog_subscribers ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for anon role
CREATE POLICY "enable_insert_for_anon"
ON blog_subscribers
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "enable_update_for_anon"
ON blog_subscribers
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

-- Create policies for authenticated role
CREATE POLICY "enable_all_for_authenticated"
ON blog_subscribers
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
