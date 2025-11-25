-- Add Stripe fields to students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Add Stripe fields to payments table
ALTER TABLE payments ADD COLUMN IF NOT EXISTS stripe_payment_id TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_students_stripe_customer ON students(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_students_stripe_subscription ON students(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_payment ON payments(stripe_payment_id);
