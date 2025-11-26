-- =============================================
-- Add Rejection Reason to Applications
-- =============================================
-- Allow storing rejection reason when admin rejects an application

-- Add rejection_reason column
ALTER TABLE applications
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Add comment for documentation
COMMENT ON COLUMN applications.rejection_reason IS 'Reason provided by admin when rejecting an application';

-- =============================================
-- SUCCESS
-- =============================================
SELECT '✅ rejection_reason column added to applications table!' as message;
