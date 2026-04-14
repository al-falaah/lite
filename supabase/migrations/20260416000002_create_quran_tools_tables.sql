-- Quran Tools: raw data tables for Surah App API datasets
-- Used by public learning tools (tajweed, nahw, sarf examples finder)

-- Tajweed analysis per ayah
CREATE TABLE IF NOT EXISTS quran_tajweed_aya (
  id BIGSERIAL PRIMARY KEY,
  sura_number INTEGER NOT NULL,
  sura_name TEXT NOT NULL,
  aya_number INTEGER NOT NULL,
  aya_text TEXT NOT NULL,
  content TEXT NOT NULL,
  UNIQUE(sura_number, aya_number)
);

-- I'rab (grammatical parsing) per ayah
CREATE TABLE IF NOT EXISTS quran_eerab_aya (
  id BIGSERIAL PRIMARY KEY,
  sura_number INTEGER NOT NULL,
  sura_name TEXT NOT NULL,
  aya_number INTEGER NOT NULL,
  aya_text TEXT NOT NULL,
  content TEXT NOT NULL,
  UNIQUE(sura_number, aya_number)
);

-- I'rab (grammatical parsing) per word
CREATE TABLE IF NOT EXISTS quran_eerab_word (
  id BIGSERIAL PRIMARY KEY,
  sura_number INTEGER NOT NULL,
  sura_name TEXT NOT NULL,
  aya_number INTEGER NOT NULL,
  word_number INTEGER NOT NULL,
  word TEXT NOT NULL,
  content TEXT NOT NULL,
  UNIQUE(sura_number, aya_number, word_number)
);

-- Tasreef (morphological analysis) per word
CREATE TABLE IF NOT EXISTS quran_word_tasreef (
  id BIGSERIAL PRIMARY KEY,
  sura_number INTEGER NOT NULL,
  sura_name TEXT NOT NULL,
  aya_number INTEGER NOT NULL,
  word_number INTEGER NOT NULL,
  word TEXT NOT NULL,
  content TEXT NOT NULL,
  UNIQUE(sura_number, aya_number, word_number)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_tajweed_aya_sura ON quran_tajweed_aya(sura_number);
CREATE INDEX IF NOT EXISTS idx_eerab_aya_sura ON quran_eerab_aya(sura_number);
CREATE INDEX IF NOT EXISTS idx_eerab_word_sura_aya ON quran_eerab_word(sura_number, aya_number);
CREATE INDEX IF NOT EXISTS idx_word_tasreef_sura_aya ON quran_word_tasreef(sura_number, aya_number);

-- Enable trigram extension for fuzzy text search on Arabic content
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_tajweed_aya_content_trgm ON quran_tajweed_aya USING gin(content gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_eerab_aya_content_trgm ON quran_eerab_aya USING gin(content gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_eerab_word_content_trgm ON quran_eerab_word USING gin(content gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_word_tasreef_content_trgm ON quran_word_tasreef USING gin(content gin_trgm_ops);

-- Public read access (these are public learning tools, no auth required)
ALTER TABLE quran_tajweed_aya ENABLE ROW LEVEL SECURITY;
ALTER TABLE quran_eerab_aya ENABLE ROW LEVEL SECURITY;
ALTER TABLE quran_eerab_word ENABLE ROW LEVEL SECURITY;
ALTER TABLE quran_word_tasreef ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON quran_tajweed_aya FOR SELECT USING (true);
CREATE POLICY "Public read access" ON quran_eerab_aya FOR SELECT USING (true);
CREATE POLICY "Public read access" ON quran_eerab_word FOR SELECT USING (true);
CREATE POLICY "Public read access" ON quran_word_tasreef FOR SELECT USING (true);

-- Only service role can insert/update (used by download script)
CREATE POLICY "Service role write" ON quran_tajweed_aya FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role write" ON quran_eerab_aya FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role write" ON quran_eerab_word FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role write" ON quran_word_tasreef FOR ALL USING (auth.role() = 'service_role');
