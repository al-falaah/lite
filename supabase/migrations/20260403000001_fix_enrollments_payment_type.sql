-- Fix enrollments payment_type constraint to include oneTime (used by webhook and frontend)
-- The webhook and frontend use 'oneTime' for one-time payments (tajweed, qari programs)
-- but the DB constraint only allowed 'monthly' and 'annual'

ALTER TABLE enrollments DROP CONSTRAINT IF EXISTS enrollments_payment_type_check;
ALTER TABLE enrollments
  ADD CONSTRAINT enrollments_payment_type_check
  CHECK (payment_type IN ('monthly', 'annual', 'oneTime'));
