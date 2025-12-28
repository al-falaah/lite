-- Grant necessary permissions to anon and authenticated roles for blog_subscribers table

-- Grant table-level permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON blog_subscribers TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

COMMENT ON TABLE blog_subscribers IS 'Stores blog subscription information with public insert and update access for subscription management';
