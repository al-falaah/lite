-- Temporarily disable RLS on blog_subscribers to diagnose subscription issues
-- This allows us to verify if the subscription exists and can be updated

ALTER TABLE blog_subscribers DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE blog_subscribers IS 'RLS temporarily disabled for debugging subscription/unsubscribe issues';
