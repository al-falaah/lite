-- Tajweed Test Runner tool (/tools/tajweed-test)
-- A teacher configures a live quiz session on tajweed topics, students take
-- turns answering by picking a number from a randomised pool, and the teacher
-- scores each answer live. Anonymous / open access (no login required for the
-- tool page), so RLS is permissive on both tables.

-- ============================================================================
-- Sessions: one row per live test session the teacher runs
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tajweed_test_sessions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_name          TEXT,                                     -- optional label
  class_name            TEXT NOT NULL,
  topic_ids             JSONB NOT NULL DEFAULT '[]'::jsonb,       -- array of topic id strings from TAJWEED_CATEGORIES
  student_names         JSONB NOT NULL DEFAULT '[]'::jsonb,       -- array of strings, ordered as they arrived
  question_count        INTEGER NOT NULL CHECK (question_count > 0 AND question_count <= 200),
  max_points_per_q      INTEGER NOT NULL DEFAULT 3 CHECK (max_points_per_q > 0 AND max_points_per_q <= 10),
  -- The drawn pool of ayat that make up this session's numbered questions.
  -- Each entry: { number, sura_number, aya_number, topic_id, aya_text }
  question_pool         JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at              TIMESTAMPTZ                                 -- null while live, set when teacher ends session
);

CREATE INDEX IF NOT EXISTS idx_tajweed_test_sessions_created ON public.tajweed_test_sessions(created_at DESC);

-- ============================================================================
-- Answers: one row per (session, student, question the student attempted)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tajweed_test_answers (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id            UUID NOT NULL REFERENCES public.tajweed_test_sessions(id) ON DELETE CASCADE,
  student_name          TEXT NOT NULL,
  question_index        INTEGER NOT NULL,                          -- 1..N, the number the student picked
  sura_number           INTEGER,
  aya_number            INTEGER,
  topic_id              TEXT,
  points_awarded        INTEGER NOT NULL DEFAULT 0,
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (session_id, question_index)                              -- each number is used at most once per session
);

CREATE INDEX IF NOT EXISTS idx_tajweed_test_answers_session ON public.tajweed_test_answers(session_id);

-- ============================================================================
-- RLS: tool is open to anyone. Full read/write allowed on both tables.
-- If we later want teacher-only access, tighten these policies.
-- ============================================================================
ALTER TABLE public.tajweed_test_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tajweed_test_answers  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read sessions"   ON public.tajweed_test_sessions;
DROP POLICY IF EXISTS "public write sessions"  ON public.tajweed_test_sessions;
DROP POLICY IF EXISTS "public update sessions" ON public.tajweed_test_sessions;
DROP POLICY IF EXISTS "public delete sessions" ON public.tajweed_test_sessions;

CREATE POLICY "public read sessions"   ON public.tajweed_test_sessions FOR SELECT USING (true);
CREATE POLICY "public write sessions"  ON public.tajweed_test_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "public update sessions" ON public.tajweed_test_sessions FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "public delete sessions" ON public.tajweed_test_sessions FOR DELETE USING (true);

DROP POLICY IF EXISTS "public read answers"    ON public.tajweed_test_answers;
DROP POLICY IF EXISTS "public write answers"   ON public.tajweed_test_answers;
DROP POLICY IF EXISTS "public update answers"  ON public.tajweed_test_answers;
DROP POLICY IF EXISTS "public delete answers"  ON public.tajweed_test_answers;

CREATE POLICY "public read answers"    ON public.tajweed_test_answers FOR SELECT USING (true);
CREATE POLICY "public write answers"   ON public.tajweed_test_answers FOR INSERT WITH CHECK (true);
CREATE POLICY "public update answers"  ON public.tajweed_test_answers FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "public delete answers"  ON public.tajweed_test_answers FOR DELETE USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tajweed_test_sessions TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tajweed_test_answers  TO anon, authenticated;
