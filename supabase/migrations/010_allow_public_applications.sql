-- Allow public users to submit applications
-- This fixes the RLS policy that was blocking anonymous application submissions

-- Drop the policy if it exists, then create it
DROP POLICY IF EXISTS "Anyone can submit applications" ON applications;

-- Add policy to allow anyone to insert applications
CREATE POLICY "Anyone can submit applications"
ON applications FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Keep the existing admin policy for SELECT, UPDATE, DELETE
-- (The "Admins can manage applications" policy already handles those)
