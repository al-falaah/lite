-- Add category column to blog_posts table
ALTER TABLE blog_posts
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'General'
CHECK (category IN (
  'Quran & Tafsir',
  'Hadith & Sunnah',
  'Aqeedah',
  'Fiqh',
  'Arabic Language',
  'Seerah',
  'Akhlaq & Adab',
  'Ramadan & Seasons',
  'General'
));

-- Create index for category filtering
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);

-- Update existing posts to have 'General' category if null
UPDATE blog_posts SET category = 'General' WHERE category IS NULL;
