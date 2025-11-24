-- =============================================
-- Cleanup Applications Schema
-- =============================================
-- Remove unused columns and simplify structure

-- Remove unused location fields
ALTER TABLE applications
DROP COLUMN IF EXISTS address,
DROP COLUMN IF EXISTS city,
DROP COLUMN IF EXISTS country;

-- Remove auto-derived fields that aren't meaningful
ALTER TABLE applications
DROP COLUMN IF EXISTS education_level,
DROP COLUMN IF EXISTS islamic_knowledge_level;

-- Remove goals column (merged into motivation)
ALTER TABLE applications
DROP COLUMN IF EXISTS goals;

-- Rename arabic_proficiency to arabic_level for consistency
ALTER TABLE applications
DROP COLUMN IF EXISTS arabic_proficiency;

-- Add proper columns for what we actually collect
ALTER TABLE applications
ADD COLUMN IF NOT EXISTS can_read_quran BOOLEAN,
ADD COLUMN IF NOT EXISTS tajweed_level TEXT CHECK (tajweed_level IN ('basic', 'intermediate', 'advanced')),
ADD COLUMN IF NOT EXISTS arabic_level TEXT CHECK (arabic_level IN ('basic', 'intermediate', 'advanced'));

-- Update motivation column comment
COMMENT ON COLUMN applications.motivation IS 'Why they want to join and their learning goals (combined)';
COMMENT ON COLUMN applications.can_read_quran IS 'Can the applicant read the Quran';
COMMENT ON COLUMN applications.tajweed_level IS 'Tajweed level if they can read Quran';
COMMENT ON COLUMN applications.has_studied_arabic IS 'Has the applicant studied Arabic';
COMMENT ON COLUMN applications.arabic_level IS 'Arabic proficiency level if studied';

-- =============================================
-- SUCCESS
-- =============================================
SELECT '✅ Applications schema cleaned up!' as message;
