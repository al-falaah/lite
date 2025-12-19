-- Add author_bio column to blog_posts table
ALTER TABLE blog_posts
ADD COLUMN IF NOT EXISTS author_bio TEXT;

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'blog_posts'
AND column_name = 'author_bio';
