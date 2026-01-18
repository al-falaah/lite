-- Add referral_source column to applications table
ALTER TABLE applications
ADD COLUMN IF NOT EXISTS referral_source TEXT;

-- Add comment for documentation
COMMENT ON COLUMN applications.referral_source IS 'How the applicant heard about the program (e.g., WhatsApp Group, Facebook, Friends, Masjid, Google Search, Other)';
