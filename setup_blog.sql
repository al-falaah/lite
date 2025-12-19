-- =============================================
-- BLOG POSTS TABLE SETUP
-- Run this in Supabase Dashboard > SQL Editor
-- =============================================

-- Create blog_posts table
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  featured_image TEXT,
  author_name TEXT DEFAULT 'Ustadh Abdulquadri Alaka, PhD',
  author_id UUID REFERENCES students(id),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for slug lookups
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);

-- Create index for status and published_at for filtering
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(status, published_at DESC);

-- Enable RLS
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view published blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Authenticated users can manage blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Admins can view all blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Admins can insert blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Admins can update blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Admins can delete blog posts" ON blog_posts;

-- Public can read published posts only
CREATE POLICY "Public can view published blog posts"
ON blog_posts FOR SELECT
USING (status = 'published');

-- Admins can view all posts (including drafts)
CREATE POLICY "Admins can view all blog posts"
ON blog_posts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Admins can insert posts
CREATE POLICY "Admins can insert blog posts"
ON blog_posts FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Admins can update posts
CREATE POLICY "Admins can update blog posts"
ON blog_posts FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Admins can delete posts
CREATE POLICY "Admins can delete blog posts"
ON blog_posts FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_blog_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS blog_posts_updated_at ON blog_posts;

CREATE TRIGGER blog_posts_updated_at
BEFORE UPDATE ON blog_posts
FOR EACH ROW
EXECUTE FUNCTION update_blog_posts_updated_at();

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Blog posts table setup complete!';
  RAISE NOTICE 'RLS policies configured for admin-only write access.';
END $$;
