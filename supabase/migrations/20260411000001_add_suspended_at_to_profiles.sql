-- Add suspended_at column to profiles for tracking suspension state
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN profiles.suspended_at IS
'Timestamp when user was suspended. NULL = active. Set by manage-user edge function.';
