-- Add content_type column to lesson_chapters
-- Allows chapters to be either 'rich_text' (default, existing behavior) or 'full_html' (uploaded HTML file)
ALTER TABLE lesson_chapters
  ADD COLUMN IF NOT EXISTS content_type TEXT NOT NULL DEFAULT 'rich_text';