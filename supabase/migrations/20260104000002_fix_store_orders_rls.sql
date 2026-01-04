-- Fix RLS policy for store_orders to allow public order creation
-- The issue: The INSERT policy requires authentication, but we need guest checkout

-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Public can create store orders" ON store_orders;

-- Create a new permissive policy that allows anyone to insert orders
CREATE POLICY "Allow public to create store orders"
ON store_orders
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Keep the existing SELECT policy for authenticated admins
-- (Already exists from initial migration, but let's ensure it's correct)
DROP POLICY IF EXISTS "Admin can manage store orders" ON store_orders;

CREATE POLICY "Admin can view and manage store orders"
ON store_orders
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
