-- Fix RLS for applications table to allow public submissions
-- This migration ensures the applications form works after RLS is enabled

-- First, disable RLS temporarily if it's causing issues
ALTER TABLE IF EXISTS applications DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE IF EXISTS applications ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Anyone can submit applications" ON applications;
DROP POLICY IF EXISTS "Users can view their own applications" ON applications;
DROP POLICY IF EXISTS "Admins have full access to applications" ON applications;
DROP POLICY IF EXISTS "Public can view published blog posts" ON applications;
DROP POLICY IF EXISTS "Authenticated users can manage blog posts" ON applications;

-- Allow anyone (including anonymous users) to submit applications
CREATE POLICY "Enable insert for anonymous and authenticated users"
ON applications
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow users to view their own applications (if they're authenticated)
CREATE POLICY "Enable read access for own applications"
ON applications
FOR SELECT
TO authenticated
USING (email = auth.jwt()->>'email' OR auth.jwt()->>'role' = 'admin');

-- Allow admins to do everything
CREATE POLICY "Enable all access for admins"
ON applications
FOR ALL
TO authenticated
USING (
  auth.jwt()->>'role' = 'admin' OR
  auth.jwt()->'user_metadata'->>'role' = 'admin'
)
WITH CHECK (
  auth.jwt()->>'role' = 'admin' OR
  auth.jwt()->'user_metadata'->>'role' = 'admin'
);
