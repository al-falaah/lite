-- Add payment-related fields to payments table
-- Migration: 002_add_payment_fields.sql
-- Supports both Stripe online payments and manual bank transfers

-- Add new columns for payment processing
ALTER TABLE payments
-- Stripe fields
ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_payment_method_id TEXT,
ADD COLUMN IF NOT EXISTS last_four TEXT, -- Last 4 digits of card
ADD COLUMN IF NOT EXISTS card_brand TEXT, -- 'visa', 'mastercard', etc.
ADD COLUMN IF NOT EXISTS receipt_url TEXT, -- Stripe receipt URL

-- Manual payment fields
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'pending', -- 'stripe', 'bank_transfer', 'cash', 'pending'
ADD COLUMN IF NOT EXISTS bank_reference TEXT, -- Bank transfer reference number
ADD COLUMN IF NOT EXISTS proof_of_payment_url TEXT, -- Uploaded proof document
ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES auth.users(id), -- Admin who verified
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payment_notes TEXT, -- Admin notes about payment

-- Tracking
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add index for faster Stripe ID lookups
CREATE INDEX IF NOT EXISTS idx_payments_stripe_checkout_session
ON payments(stripe_checkout_session_id);

CREATE INDEX IF NOT EXISTS idx_payments_stripe_payment_intent
ON payments(stripe_payment_intent_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists, then create
DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;

CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add indexes for payment verification
CREATE INDEX IF NOT EXISTS idx_payments_payment_method
ON payments(payment_method);

CREATE INDEX IF NOT EXISTS idx_payments_status_method
ON payments(status, payment_method);

-- Add comments for documentation
COMMENT ON COLUMN payments.stripe_checkout_session_id IS 'Stripe Checkout Session ID';
COMMENT ON COLUMN payments.stripe_payment_intent_id IS 'Stripe Payment Intent ID';
COMMENT ON COLUMN payments.payment_method IS 'Payment method used: stripe, bank_transfer, cash, or pending';
COMMENT ON COLUMN payments.last_four IS 'Last 4 digits of card (for Stripe payments)';
COMMENT ON COLUMN payments.card_brand IS 'Card brand (visa, mastercard, amex, etc.)';
COMMENT ON COLUMN payments.receipt_url IS 'Stripe hosted receipt URL';
COMMENT ON COLUMN payments.bank_reference IS 'Bank transfer reference number';
COMMENT ON COLUMN payments.proof_of_payment_url IS 'URL to uploaded proof of payment document';
COMMENT ON COLUMN payments.verified_by IS 'Admin user who verified the payment';
COMMENT ON COLUMN payments.verified_at IS 'Timestamp when payment was verified';

-- Create settings table for bank account details
CREATE TABLE IF NOT EXISTS payment_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_name TEXT NOT NULL,
  account_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  swift_code TEXT,
  branch_code TEXT,
  instructions TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default NZ bank account details
INSERT INTO payment_settings (bank_name, account_name, account_number, instructions)
VALUES (
  'ANZ Bank New Zealand',
  'Al-Falaah Islamic Institute',
  '00-0000-0000000-00',
  'Please use your Student ID as the reference when making payment'
) ON CONFLICT DO NOTHING;

-- RLS policies for payment_settings
ALTER TABLE payment_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can view active payment settings
CREATE POLICY "Anyone can view active payment settings"
ON payment_settings FOR SELECT
USING (is_active = true);

-- Only admins can manage payment settings
CREATE POLICY "Admins can manage payment settings"
ON payment_settings FOR ALL
USING (is_admin());

COMMENT ON TABLE payment_settings IS 'Bank account details for manual payments';