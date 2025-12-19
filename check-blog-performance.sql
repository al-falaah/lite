-- Check current RLS policies on blog_posts
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'blog_posts'
ORDER BY cmd, policyname;

-- Check if there are any slow queries or missing indexes
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'blog_posts'
ORDER BY indexname;

-- Suggest adding an index on status and published_at for faster queries
-- Run this if the index doesn't exist:
-- CREATE INDEX IF NOT EXISTS idx_blog_posts_status_published
-- ON blog_posts(status, published_at DESC);

-- Test query performance
EXPLAIN ANALYZE
SELECT *
FROM blog_posts
WHERE status = 'published'
ORDER BY published_at DESC;