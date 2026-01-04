-- Comprehensive RLS fix for store tables
-- Allow public users to create orders and order items

-- First, let's check and fix store_orders policies
DROP POLICY IF EXISTS "Public can create store orders" ON store_orders;
DROP POLICY IF EXISTS "Allow public to create store orders" ON store_orders;
DROP POLICY IF EXISTS "Admin can manage store orders" ON store_orders;
DROP POLICY IF EXISTS "Admin can view and manage store orders" ON store_orders;

-- Allow anyone (anon or authenticated) to INSERT into store_orders
CREATE POLICY "anyone_can_insert_orders"
ON store_orders
FOR INSERT
TO public
WITH CHECK (true);

-- Allow authenticated users (admins) to do everything
CREATE POLICY "authenticated_can_manage_orders"
ON store_orders
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Now fix store_order_items policies
DROP POLICY IF EXISTS "Public can create store order items" ON store_order_items;
DROP POLICY IF EXISTS "Admin can manage store order items" ON store_order_items;

-- Allow anyone (anon or authenticated) to INSERT into store_order_items
CREATE POLICY "anyone_can_insert_order_items"
ON store_order_items
FOR INSERT
TO public
WITH CHECK (true);

-- Allow authenticated users (admins) to do everything
CREATE POLICY "authenticated_can_manage_order_items"
ON store_order_items
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Verify RLS is enabled (should already be, but let's be sure)
ALTER TABLE store_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_order_items ENABLE ROW LEVEL SECURITY;
