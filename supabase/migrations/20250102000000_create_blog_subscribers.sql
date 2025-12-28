-- Create blog_subscribers table
CREATE TABLE IF NOT EXISTS blog_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  unsubscribe_token UUID DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_blog_subscribers_email ON blog_subscribers(email);

-- Create index for active subscribers
CREATE INDEX IF NOT EXISTS idx_blog_subscribers_active ON blog_subscribers(is_active, subscribed_at DESC);

-- Enable RLS
ALTER TABLE blog_subscribers ENABLE ROW LEVEL SECURITY;

-- Public can subscribe (insert only)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'blog_subscribers' AND policyname = 'Anyone can subscribe to blog'
  ) THEN
    CREATE POLICY "Anyone can subscribe to blog"
    ON blog_subscribers FOR INSERT
    WITH CHECK (true);
  END IF;
END $$;

-- Only authenticated users (admins) can view all subscribers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'blog_subscribers' AND policyname = 'Admins can view all subscribers'
  ) THEN
    CREATE POLICY "Admins can view all subscribers"
    ON blog_subscribers FOR SELECT
    USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- Users can unsubscribe themselves using their token
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'blog_subscribers' AND policyname = 'Users can unsubscribe with token'
  ) THEN
    CREATE POLICY "Users can unsubscribe with token"
    ON blog_subscribers FOR UPDATE
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_blog_subscribers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'blog_subscribers_updated_at'
  ) THEN
    CREATE TRIGGER blog_subscribers_updated_at
    BEFORE UPDATE ON blog_subscribers
    FOR EACH ROW
    EXECUTE FUNCTION update_blog_subscribers_updated_at();
  END IF;
END $$;
