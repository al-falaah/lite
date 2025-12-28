-- Simplify RLS without restrictive policies

-- Drop the restrictive SELECT policy that might be interfering
DROP POLICY IF EXISTS "anon_cannot_select_subscribers" ON blog_subscribers;
DROP POLICY IF EXISTS "anon_can_insert_subscribers" ON blog_subscribers;
DROP POLICY IF EXISTS "anon_can_update_subscribers" ON blog_subscribers;
DROP POLICY IF EXISTS "authenticated_full_access" ON blog_subscribers;

-- Simple permissive policies only
CREATE POLICY "public_insert"
ON blog_subscribers
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "public_update"
ON blog_subscribers
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "authenticated_all"
ON blog_subscribers
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

COMMENT ON TABLE blog_subscribers IS 'Blog subscribers - public can subscribe/unsubscribe, authenticated can view all';
