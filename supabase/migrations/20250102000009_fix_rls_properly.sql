-- Properly configure RLS for blog_subscribers with working policies

-- Re-enable RLS
ALTER TABLE blog_subscribers ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "enable_insert_for_anon" ON blog_subscribers;
DROP POLICY IF EXISTS "enable_update_for_anon" ON blog_subscribers;
DROP POLICY IF EXISTS "enable_all_for_authenticated" ON blog_subscribers;

-- For anon users: Allow INSERT (subscribe) and UPDATE (unsubscribe)
-- Important: For UPDATE to work, we need both USING and WITH CHECK
-- USING determines which rows can be selected for update
-- WITH CHECK determines what values can be written

CREATE POLICY "anon_can_insert_subscribers"
ON blog_subscribers
AS PERMISSIVE
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "anon_can_update_subscribers"
ON blog_subscribers
AS PERMISSIVE
FOR UPDATE
TO anon
USING (true)  -- Can update any row
WITH CHECK (true);  -- Can set any values

CREATE POLICY "anon_cannot_select_subscribers"
ON blog_subscribers
AS RESTRICTIVE
FOR SELECT
TO anon
USING (false);  -- Prevent anon from listing all subscribers

-- For authenticated users: Full access
CREATE POLICY "authenticated_full_access"
ON blog_subscribers
AS PERMISSIVE
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

COMMENT ON TABLE blog_subscribers IS 'Blog subscribers with RLS: anon can subscribe/unsubscribe, authenticated can manage';
