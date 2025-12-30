-- Create RPC function to increment blog post views atomically
CREATE OR REPLACE FUNCTION increment_blog_views(post_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE blog_posts
  SET views = COALESCE(views, 0) + 1
  WHERE id = post_id;
END;
$$;

-- Grant execute permission to anon and authenticated users
GRANT EXECUTE ON FUNCTION increment_blog_views(UUID) TO anon;
GRANT EXECUTE ON FUNCTION increment_blog_views(UUID) TO authenticated;

-- Add comment to document the function
COMMENT ON FUNCTION increment_blog_views IS 'Atomically increments the view count for a blog post';
