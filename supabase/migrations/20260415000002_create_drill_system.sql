-- =====================================================
-- Interactive Drill / Flashcard System
-- Gamified quizzes the Academic Dean creates for any
-- program. Students earn XP, combos, streaks, levels.
-- =====================================================

-- Decks (a collection of cards on a topic)
CREATE TABLE drill_decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  program TEXT NOT NULL,           -- 'tajweed', 'qari', 'essentials'
  topic TEXT NOT NULL,             -- free-text category e.g. "Noon Sakinah"
  cover_emoji TEXT DEFAULT '📚',
  is_published BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Cards (individual questions inside a deck)
CREATE TABLE drill_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id UUID NOT NULL REFERENCES drill_decks(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  question_type TEXT NOT NULL DEFAULT 'multiple_choice'
    CHECK (question_type IN ('multiple_choice', 'true_false')),
  arabic_text TEXT,                          -- optional verse / phrase
  highlight_ranges JSONB DEFAULT '[]',       -- [{start, end}]
  question TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]',       -- ["opt1","opt2",…]
  correct_index INTEGER NOT NULL DEFAULT 0,
  explanation TEXT,
  hint TEXT,
  points INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Attempts (one row per completed drill session)
CREATE TABLE drill_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  deck_id UUID NOT NULL REFERENCES drill_decks(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0,
  total_cards INTEGER NOT NULL DEFAULT 0,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  max_combo INTEGER DEFAULT 0,
  time_seconds INTEGER,
  completed_at TIMESTAMPTZ DEFAULT now()
);

-- Aggregate stats per student × program (XP, streaks, level)
CREATE TABLE student_drill_stats (
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  program TEXT NOT NULL,
  total_xp INTEGER DEFAULT 0,
  drills_completed INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  last_drill_date DATE,
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (student_id, program)
);

-- Indexes
CREATE INDEX idx_drill_cards_deck ON drill_cards(deck_id, sort_order);
CREATE INDEX idx_drill_attempts_student ON drill_attempts(student_id, completed_at DESC);
CREATE INDEX idx_drill_stats_leaderboard ON student_drill_stats(program, total_xp DESC);

-- =====================================================
-- RLS
-- =====================================================
ALTER TABLE drill_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE drill_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE drill_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_drill_stats ENABLE ROW LEVEL SECURITY;

-- Decks: admins full access, everyone reads published
CREATE POLICY "Admins manage decks"
  ON drill_decks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('director', 'academic_dean')
    )
  );

CREATE POLICY "Anyone reads published decks"
  ON drill_decks FOR SELECT
  USING (is_published = true);

-- Cards: admins full access, everyone reads cards of published decks
CREATE POLICY "Admins manage cards"
  ON drill_cards FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('director', 'academic_dean')
    )
  );

CREATE POLICY "Anyone reads published deck cards"
  ON drill_cards FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM drill_decks
      WHERE drill_decks.id = drill_cards.deck_id
      AND drill_decks.is_published = true
    )
  );

-- Attempts: students insert & read own
CREATE POLICY "Students insert own attempts"
  ON drill_attempts FOR INSERT
  WITH CHECK (
    student_id IN (SELECT id FROM students WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Students read own attempts"
  ON drill_attempts FOR SELECT
  USING (
    student_id IN (SELECT id FROM students WHERE auth_user_id = auth.uid())
  );

-- Stats: students read all (leaderboard), system manages via function
CREATE POLICY "Anyone reads drill stats"
  ON student_drill_stats FOR SELECT
  USING (true);

-- =====================================================
-- record_drill_attempt — atomic insert + stats upsert
-- =====================================================
CREATE OR REPLACE FUNCTION record_drill_attempt(
  p_student_id UUID,
  p_deck_id UUID,
  p_program TEXT,
  p_score INTEGER,
  p_total_cards INTEGER,
  p_xp_earned INTEGER,
  p_max_combo INTEGER,
  p_time_seconds INTEGER
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_existing RECORD;
BEGIN
  -- Insert attempt
  INSERT INTO drill_attempts
    (student_id, deck_id, score, total_cards, xp_earned, max_combo, time_seconds)
  VALUES
    (p_student_id, p_deck_id, p_score, p_total_cards, p_xp_earned, p_max_combo, p_time_seconds);

  -- Upsert stats
  SELECT * INTO v_existing
  FROM student_drill_stats
  WHERE student_id = p_student_id AND program = p_program;

  IF v_existing IS NULL THEN
    INSERT INTO student_drill_stats
      (student_id, program, total_xp, drills_completed, current_streak, best_streak, last_drill_date)
    VALUES
      (p_student_id, p_program, p_xp_earned, 1, 1, 1, v_today);
  ELSE
    UPDATE student_drill_stats SET
      total_xp = total_xp + p_xp_earned,
      drills_completed = drills_completed + 1,
      current_streak = CASE
        WHEN last_drill_date = v_today THEN current_streak
        WHEN last_drill_date = v_today - 1 THEN current_streak + 1
        ELSE 1
      END,
      best_streak = GREATEST(best_streak, CASE
        WHEN last_drill_date = v_today THEN current_streak
        WHEN last_drill_date = v_today - 1 THEN current_streak + 1
        ELSE 1
      END),
      last_drill_date = v_today,
      updated_at = now()
    WHERE student_id = p_student_id AND program = p_program;
  END IF;
END;
$$;
