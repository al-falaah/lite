-- Fix store RLS policies to allow admins to manage store data
-- Add UPDATE, DELETE, and INSERT policies using security definer function

-- Drop existing problematic policies that use recursive queries
DROP POLICY IF EXISTS "Admins can view all orders" ON store_orders;
DROP POLICY IF EXISTS "Admins can view all posts" ON blog_posts;
DROP POLICY IF EXISTS "Anyone can view published posts" ON blog_posts;

-- ===========================
-- STORE PRODUCTS POLICIES
-- ===========================

-- Drop all existing store_products policies
DROP POLICY IF EXISTS "Public can view active products" ON store_products;
DROP POLICY IF EXISTS "Admins can manage products" ON store_products;
DROP POLICY IF EXISTS "Admins can view all products" ON store_products;
DROP POLICY IF EXISTS "Admins can insert products" ON store_products;
DROP POLICY IF EXISTS "Admins can update products" ON store_products;
DROP POLICY IF EXISTS "Admins can delete products" ON store_products;

-- Public can view active products
CREATE POLICY "Public can view active products"
ON store_products
FOR SELECT
TO public
USING (is_active = true);

-- Admins can view all products (including inactive)
CREATE POLICY "Admins can view all products"
ON store_products
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Admins can insert products
CREATE POLICY "Admins can insert products"
ON store_products
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

-- Admins can update products
CREATE POLICY "Admins can update products"
ON store_products
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Admins can delete products
CREATE POLICY "Admins can delete products"
ON store_products
FOR DELETE
TO authenticated
USING (public.is_admin());

-- ===========================
-- STORE ORDERS POLICIES
-- ===========================

-- Drop all existing store_orders policies
DROP POLICY IF EXISTS "Public can create orders" ON store_orders;
DROP POLICY IF EXISTS "Admins can view orders" ON store_orders;
DROP POLICY IF EXISTS "Admins can update orders" ON store_orders;

-- Public can create orders (for checkout)
CREATE POLICY "Public can create orders"
ON store_orders
FOR INSERT
TO public
WITH CHECK (true);

-- Admins can view all orders
CREATE POLICY "Admins can view all orders"
ON store_orders
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Admins can update orders
CREATE POLICY "Admins can update orders"
ON store_orders
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Admins can delete orders (if needed)
CREATE POLICY "Admins can delete orders"
ON store_orders
FOR DELETE
TO authenticated
USING (public.is_admin());

-- ===========================
-- STORE ORDER ITEMS POLICIES
-- ===========================

-- Drop all existing store_order_items policies
DROP POLICY IF EXISTS "Public can create order items" ON store_order_items;
DROP POLICY IF EXISTS "Admins can view order items" ON store_order_items;

-- Public can create order items (when placing order)
CREATE POLICY "Public can create order items"
ON store_order_items
FOR INSERT
TO public
WITH CHECK (true);

-- Admins can view all order items
CREATE POLICY "Admins can view all order items"
ON store_order_items
FOR SELECT
TO authenticated
USING (public.is_admin());

-- ===========================
-- BLOG POSTS POLICIES (fix recursion)
-- ===========================

-- Public can view published posts
CREATE POLICY "Anyone can view published posts"
ON blog_posts
FOR SELECT
TO public
USING (status = 'published');

-- Admins can view all posts (including drafts) - using is_admin() function
CREATE POLICY "Admins can view all posts"
ON blog_posts
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Admins can insert posts
CREATE POLICY "Admins can insert posts"
ON blog_posts
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

-- Admins can update posts
CREATE POLICY "Admins can update posts"
ON blog_posts
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Admins can delete posts
CREATE POLICY "Admins can delete posts"
ON blog_posts
FOR DELETE
TO authenticated
USING (public.is_admin());

-- Ensure RLS is enabled on all tables
ALTER TABLE store_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
