-- Grant explicit permissions to public role (which includes anon)

GRANT ALL ON blog_subscribers TO public;
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO public;

-- Verify RLS is enabled
ALTER TABLE blog_subscribers ENABLE ROW LEVEL SECURITY;
