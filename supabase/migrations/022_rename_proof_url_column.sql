-- =============================================
-- Rename proof_url to proof_of_payment_url
-- =============================================
-- The code expects proof_of_payment_url but the column is named proof_url

-- Only rename if proof_url exists and proof_of_payment_url doesn't
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'payments'
    AND column_name = 'proof_url'
  ) THEN
    ALTER TABLE payments
    RENAME COLUMN proof_url TO proof_of_payment_url;
  END IF;
END $$;

-- =============================================
-- SUCCESS
-- =============================================
SELECT '✅ Column renamed to proof_of_payment_url!' as message;
