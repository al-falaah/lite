-- Add views column to blog_posts table to track article reads
ALTER TABLE blog_posts
ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0 NOT NULL;

-- Create index for better performance when sorting by views
CREATE INDEX IF NOT EXISTS idx_blog_posts_views ON blog_posts(views DESC);

-- Add comment to document the column
COMMENT ON COLUMN blog_posts.views IS 'Number of times this blog post has been viewed';
