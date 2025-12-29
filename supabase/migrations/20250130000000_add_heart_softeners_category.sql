-- Drop the existing constraint
ALTER TABLE blog_posts DROP CONSTRAINT IF EXISTS blog_posts_category_check;

-- Add new constraint with "Heart Softeners" category
ALTER TABLE blog_posts
ADD CONSTRAINT blog_posts_category_check
CHECK (category IN (
  'Quran & Tafsir',
  'Hadith & Sunnah',
  'Aqeedah',
  'Fiqh',
  'Arabic Language',
  'Seerah',
  'Akhlaq & Adab',
  'Heart Softeners',
  'Ramadan & Seasons',
  'General'
));
