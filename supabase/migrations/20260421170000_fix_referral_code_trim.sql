-- Fix: trim whitespace from full_name before extracting last word for referral_code.
-- Trailing spaces caused split_part(..., -1) to return '' and fall through to
-- the STUDENT fallback (e.g. one existing enrolee got REFER-STUDENT-653).

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
  last_word := upper(regexp_replace(split_part(trim(coalesce(NEW.full_name, 'STUDENT')), ' ', -1), '[^A-Za-z]', '', 'g'));
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
