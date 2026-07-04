-- Add questions_per_student so a student answers N questions in a row before
-- the teacher rotates to the next student. Default = 1 (previous behaviour).
ALTER TABLE public.tajweed_test_sessions
  ADD COLUMN IF NOT EXISTS questions_per_student INTEGER NOT NULL DEFAULT 1
    CHECK (questions_per_student > 0 AND questions_per_student <= 50);
