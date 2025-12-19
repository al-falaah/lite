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
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);

-- Create index for status and published_at for filtering
CREATE INDEX idx_blog_posts_published ON blog_posts(status, published_at DESC);

-- Enable RLS
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Public can read published posts
CREATE POLICY "Public can view published blog posts"
ON blog_posts FOR SELECT
USING (status = 'published');

-- Only authenticated users can insert/update/delete (for admin access)
CREATE POLICY "Authenticated users can manage blog posts"
ON blog_posts FOR ALL
USING (auth.role() = 'authenticated');

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_blog_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER blog_posts_updated_at
BEFORE UPDATE ON blog_posts
FOR EACH ROW
EXECUTE FUNCTION update_blog_posts_updated_at();
