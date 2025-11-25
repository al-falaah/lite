-- =============================================
-- Rename proof_url to proof_of_payment_url
-- =============================================
-- The code expects proof_of_payment_url but the column is named proof_url

ALTER TABLE payments
RENAME COLUMN proof_url TO proof_of_payment_url;

-- =============================================
-- SUCCESS
-- =============================================
SELECT '✅ Column renamed to proof_of_payment_url!' as message;
