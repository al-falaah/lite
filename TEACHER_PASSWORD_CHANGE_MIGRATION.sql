-- Add first_login column to teachers table
-- Run this in your Supabase SQL Editor

ALTER TABLE teachers ADD COLUMN IF NOT EXISTS first_login BOOLEAN DEFAULT true;

-- Update existing teachers to require password change on first login
UPDATE teachers SET first_login = true WHERE first_login IS NULL;

-- Also need to allow public UPDATE for teachers to change their own password
-- (Teachers aren't authenticated Supabase users, so they need public access)
CREATE POLICY "Teachers can update their own password"
  ON teachers FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);
