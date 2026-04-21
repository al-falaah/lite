-- Referral program schema.
--
-- Every enrolled student gets a unique referral_code. When a new student uses
-- that code at Stripe checkout, the webhook logs the redemption in `referrals`
-- and links referrer -> referred. Reward: $50 NZD payout per 3 successful
-- referrals. Payouts tracked via `referral_payouts`.
--
-- Notes:
-- - Codes look like "REFER-<lastname>-<3char>". Uppercased, dashes preserved.
-- - 10-use cap (via Stripe coupon, not enforced here) keeps blast radius small.
-- - No family_id redesign — a student is only linked to another student via
--   a redemption row, nothing more.

-- 1) Add referral_code to students
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_students_referral_code ON students (referral_code) WHERE referral_code IS NOT NULL;

-- 2) Backfill codes for existing students. Uses upper(first-word-of-lastname) + random 3 chars.
-- The generated code format mirrors what the trigger below will produce.
DO $$
DECLARE
  r RECORD;
  last_word TEXT;
  rand_suffix TEXT;
  candidate TEXT;
  attempt INT;
BEGIN
  FOR r IN SELECT id, full_name FROM students WHERE referral_code IS NULL LOOP
    last_word := upper(regexp_replace(split_part(coalesce(r.full_name, 'STUDENT'), ' ', -1), '[^A-Za-z]', '', 'g'));
    IF last_word = '' OR last_word IS NULL THEN
      last_word := 'STUDENT';
    END IF;
    attempt := 0;
    LOOP
      attempt := attempt + 1;
      rand_suffix := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 3));
      candidate := 'REFER-' || last_word || '-' || rand_suffix;
      BEGIN
        UPDATE students SET referral_code = candidate WHERE id = r.id;
        EXIT;
      EXCEPTION WHEN unique_violation THEN
        IF attempt > 10 THEN
          RAISE EXCEPTION 'Could not generate unique referral code for student %', r.id;
        END IF;
      END;
    END LOOP;
  END LOOP;
END $$;

-- 3) Trigger to auto-assign a referral code on future student inserts.
CREATE OR REPLACE FUNCTION generate_referral_code_for_student()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  last_word TEXT;
  rand_suffix TEXT;
  candidate TEXT;
  attempt INT := 0;
BEGIN
  IF NEW.referral_code IS NOT NULL THEN
    RETURN NEW;
  END IF;
  last_word := upper(regexp_replace(split_part(coalesce(NEW.full_name, 'STUDENT'), ' ', -1), '[^A-Za-z]', '', 'g'));
  IF last_word = '' OR last_word IS NULL THEN
    last_word := 'STUDENT';
  END IF;
  LOOP
    attempt := attempt + 1;
    rand_suffix := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 3));
    candidate := 'REFER-' || last_word || '-' || rand_suffix;
    IF NOT EXISTS (SELECT 1 FROM students WHERE referral_code = candidate) THEN
      NEW.referral_code := candidate;
      EXIT;
    END IF;
    IF attempt > 10 THEN
      NEW.referral_code := 'REFER-STUDENT-' || upper(substring(md5(random()::text) from 1 for 5));
      EXIT;
    END IF;
  END LOOP;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_students_generate_referral_code ON students;
CREATE TRIGGER trg_students_generate_referral_code
  BEFORE INSERT ON students
  FOR EACH ROW
  EXECUTE FUNCTION generate_referral_code_for_student();

-- 4) Referrals log: one row per successful redemption (checkout completed)
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  referred_student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  program TEXT NOT NULL,
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE SET NULL,
  stripe_session_id TEXT,
  discount_amount NUMERIC(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT no_self_referral CHECK (referrer_student_id <> referred_student_id),
  CONSTRAINT unique_referred_per_enrollment UNIQUE (referred_student_id, enrollment_id)
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals (referrer_student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals (referred_student_id);

-- 5) Payout tracking: every 3 referrals triggers a $50 payout owed to referrer.
-- Director marks paid_at once transfer is sent.
CREATE TABLE IF NOT EXISTS referral_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  milestone_count INTEGER NOT NULL, -- 3, 6, 9, 12 ...
  amount NUMERIC(10,2) NOT NULL DEFAULT 50.00,
  currency TEXT NOT NULL DEFAULT 'NZD',
  owed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ,
  paid_by UUID REFERENCES auth.users(id),
  payment_reference TEXT, -- bank transfer ref, stripe transfer id, etc.
  admin_notes TEXT,
  CONSTRAINT unique_milestone_per_referrer UNIQUE (referrer_student_id, milestone_count)
);

CREATE INDEX IF NOT EXISTS idx_referral_payouts_unpaid ON referral_payouts (referrer_student_id) WHERE paid_at IS NULL;

-- 6) Trigger: on each new referral, check if referrer hit a 3-referral milestone.
CREATE OR REPLACE FUNCTION check_referral_milestone()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  total_refs INTEGER;
  expected_milestone INTEGER;
BEGIN
  SELECT count(*) INTO total_refs FROM referrals WHERE referrer_student_id = NEW.referrer_student_id;

  -- Every 3rd referral creates a payout row (idempotent via unique constraint)
  IF total_refs > 0 AND total_refs % 3 = 0 THEN
    expected_milestone := total_refs;
    INSERT INTO referral_payouts (referrer_student_id, milestone_count)
    VALUES (NEW.referrer_student_id, expected_milestone)
    ON CONFLICT (referrer_student_id, milestone_count) DO NOTHING;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_referrals_check_milestone ON referrals;
CREATE TRIGGER trg_referrals_check_milestone
  AFTER INSERT ON referrals
  FOR EACH ROW
  EXECUTE FUNCTION check_referral_milestone();

-- 7) RLS
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_payouts ENABLE ROW LEVEL SECURITY;

-- Students can see their own referrals (referrer side) — useful for future "my referrals" UI
CREATE POLICY "Students can view their own referrals"
  ON referrals FOR SELECT
  USING (
    referrer_student_id IN (
      SELECT id FROM students WHERE auth_user_id = auth.uid()
    )
  );

-- Students can see their own payouts
CREATE POLICY "Students can view their own payouts"
  ON referral_payouts FOR SELECT
  USING (
    referrer_student_id IN (
      SELECT id FROM students WHERE auth_user_id = auth.uid()
    )
  );

-- Directors can see everything
CREATE POLICY "Directors view all referrals"
  ON referrals FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'director')
  );

CREATE POLICY "Directors view all payouts"
  ON referral_payouts FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'director')
  );
