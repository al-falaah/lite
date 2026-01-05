-- Add is_pinned column to blog_posts table for pinning posts at the top
ALTER TABLE blog_posts
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;

-- Create index for efficient pinned post queries
CREATE INDEX IF NOT EXISTS idx_blog_posts_pinned ON blog_posts(is_pinned DESC, published_at DESC);

-- Add constraint to ensure only 2 posts can be pinned at a time
-- This will be enforced in the application layer for better UX
COMMENT ON COLUMN blog_posts.is_pinned IS 'Whether this post is pinned at the top. Maximum 2 posts can be pinned at once.';
