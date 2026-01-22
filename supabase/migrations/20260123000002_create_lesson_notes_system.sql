-- Create lesson courses table
CREATE TABLE IF NOT EXISTS lesson_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  program_id TEXT NOT NULL CHECK (program_id IN ('qari', 'tajweed', 'essentials')),
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create lesson chapters table
CREATE TABLE IF NOT EXISTS lesson_chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES lesson_courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  chapter_number INTEGER NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(course_id, chapter_number),
  UNIQUE(course_id, slug)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_lesson_courses_program ON lesson_courses(program_id);
CREATE INDEX IF NOT EXISTS idx_lesson_courses_slug ON lesson_courses(slug);
CREATE INDEX IF NOT EXISTS idx_lesson_chapters_course ON lesson_chapters(course_id);
CREATE INDEX IF NOT EXISTS idx_lesson_chapters_published ON lesson_chapters(is_published);

-- Enable RLS
ALTER TABLE lesson_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_chapters ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lesson_courses
-- Public can read all courses
DROP POLICY IF EXISTS "Anyone can view courses" ON lesson_courses;
CREATE POLICY "Anyone can view courses"
  ON lesson_courses FOR SELECT
  USING (true);

-- Only director and research_admin can create/update/delete courses
DROP POLICY IF EXISTS "Admins can manage courses" ON lesson_courses;
CREATE POLICY "Admins can manage courses"
  ON lesson_courses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('director', 'research_admin')
    )
  );

-- RLS Policies for lesson_chapters
-- Public can read published chapters
DROP POLICY IF EXISTS "Anyone can view published chapters" ON lesson_chapters;
CREATE POLICY "Anyone can view published chapters"
  ON lesson_chapters FOR SELECT
  USING (is_published = true);

-- Director and research_admin can view all chapters
DROP POLICY IF EXISTS "Admins can view all chapters" ON lesson_chapters;
CREATE POLICY "Admins can view all chapters"
  ON lesson_chapters FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('director', 'research_admin')
    )
  );

-- Only director and research_admin can create/update/delete chapters
DROP POLICY IF EXISTS "Admins can manage chapters" ON lesson_chapters;
CREATE POLICY "Admins can manage chapters"
  ON lesson_chapters FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('director', 'research_admin')
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_lesson_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS update_lesson_courses_updated_at ON lesson_courses;
CREATE TRIGGER update_lesson_courses_updated_at
  BEFORE UPDATE ON lesson_courses
  FOR EACH ROW
  EXECUTE FUNCTION update_lesson_updated_at();

DROP TRIGGER IF EXISTS update_lesson_chapters_updated_at ON lesson_chapters;
CREATE TRIGGER update_lesson_chapters_updated_at
  BEFORE UPDATE ON lesson_chapters
  FOR EACH ROW
  EXECUTE FUNCTION update_lesson_updated_at();

-- Set published_at when chapter is published
CREATE OR REPLACE FUNCTION set_chapter_published_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_published = true AND OLD.is_published = false THEN
    NEW.published_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_chapter_published_at_trigger ON lesson_chapters;
CREATE TRIGGER set_chapter_published_at_trigger
  BEFORE UPDATE ON lesson_chapters
  FOR EACH ROW
  EXECUTE FUNCTION set_chapter_published_at();
