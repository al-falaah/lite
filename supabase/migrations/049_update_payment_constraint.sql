-- =============================================
-- Update Payment Method Constraint
-- =============================================
-- Allow 'stripe' as a payment method

ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_method_check;
ALTER TABLE payments ADD CONSTRAINT payments_payment_method_check
  CHECK (payment_method IN ('bank_transfer', 'cash', 'stripe'));

-- Success message
SELECT '✅ Payment method constraint updated to include Stripe' as message;
