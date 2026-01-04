-- Final comprehensive RLS fix for store tables
-- This migration removes ALL existing policies and creates clean ones

-- ============================================
-- STORE_ORDERS TABLE
-- ============================================

-- Drop ALL existing policies on store_orders
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'store_orders'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON store_orders', pol.policyname);
    END LOOP;
END $$;

-- Create new clean policies for store_orders
-- Policy 1: Allow anyone (anon/authenticated) to INSERT orders
CREATE POLICY "store_orders_insert_policy"
ON store_orders
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Policy 2: Allow authenticated users (admins) to SELECT all orders
CREATE POLICY "store_orders_select_policy"
ON store_orders
FOR SELECT
TO authenticated
USING (true);

-- Policy 3: Allow authenticated users (admins) to UPDATE all orders
CREATE POLICY "store_orders_update_policy"
ON store_orders
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy 4: Allow authenticated users (admins) to DELETE all orders
CREATE POLICY "store_orders_delete_policy"
ON store_orders
FOR DELETE
TO authenticated
USING (true);

-- ============================================
-- STORE_ORDER_ITEMS TABLE
-- ============================================

-- Drop ALL existing policies on store_order_items
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'store_order_items'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON store_order_items', pol.policyname);
    END LOOP;
END $$;

-- Create new clean policies for store_order_items
-- Policy 1: Allow anyone (anon/authenticated) to INSERT order items
CREATE POLICY "store_order_items_insert_policy"
ON store_order_items
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Policy 2: Allow authenticated users (admins) to SELECT all order items
CREATE POLICY "store_order_items_select_policy"
ON store_order_items
FOR SELECT
TO authenticated
USING (true);

-- Policy 3: Allow authenticated users (admins) to UPDATE all order items
CREATE POLICY "store_order_items_update_policy"
ON store_order_items
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy 4: Allow authenticated users (admins) to DELETE all order items
CREATE POLICY "store_order_items_delete_policy"
ON store_order_items
FOR DELETE
TO authenticated
USING (true);

-- ============================================
-- Ensure RLS is enabled
-- ============================================
ALTER TABLE store_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_order_items ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Verify policies were created
-- ============================================
DO $$
DECLARE
    orders_count int;
    items_count int;
BEGIN
    SELECT COUNT(*) INTO orders_count FROM pg_policies WHERE tablename = 'store_orders';
    SELECT COUNT(*) INTO items_count FROM pg_policies WHERE tablename = 'store_order_items';

    RAISE NOTICE 'store_orders policies: %', orders_count;
    RAISE NOTICE 'store_order_items policies: %', items_count;

    IF orders_count < 4 THEN
        RAISE EXCEPTION 'Expected 4 policies on store_orders, found %', orders_count;
    END IF;

    IF items_count < 4 THEN
        RAISE EXCEPTION 'Expected 4 policies on store_order_items, found %', items_count;
    END IF;
END $$;
