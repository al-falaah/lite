-- Add feedback_seen_at so student must view feedback before teacher can assign new
ALTER TABLE recitations ADD COLUMN IF NOT EXISTS feedback_seen_at TIMESTAMPTZ;
