-- =============================================
-- Add Stripe subscription tracking to enrollments
-- =============================================
-- Since students can have multiple enrollments, each enrollment
-- should track its own Stripe subscription

-- Add stripe_subscription_id to enrollments table
ALTER TABLE enrollments
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_enrollments_stripe_subscription
  ON enrollments(stripe_subscription_id);

-- Add unique constraint to ensure one enrollment per subscription
ALTER TABLE enrollments
  ADD CONSTRAINT unique_stripe_subscription
  UNIQUE (stripe_subscription_id);

COMMENT ON COLUMN enrollments.stripe_subscription_id IS
  'Stripe subscription ID for this specific enrollment - links to recurring payments';

-- Show current enrollments
SELECT
  s.student_id,
  s.full_name,
  e.program,
  e.status,
  e.stripe_subscription_id,
  e.total_paid,
  e.balance_remaining
FROM enrollments e
JOIN students s ON e.student_id = s.id
ORDER BY s.student_id, e.program;
