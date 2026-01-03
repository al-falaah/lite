-- Create store_products table
CREATE TABLE IF NOT EXISTS store_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price_nzd DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  category TEXT,
  stock_quantity INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create store_orders table
CREATE TABLE IF NOT EXISTS store_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_whatsapp TEXT NOT NULL,
  delivery_address_line1 TEXT NOT NULL,
  delivery_address_line2 TEXT,
  delivery_city TEXT NOT NULL,
  delivery_postal_code TEXT NOT NULL,
  delivery_country TEXT NOT NULL,
  customer_notes TEXT,
  subtotal_nzd DECIMAL(10,2) NOT NULL,
  shipping_cost_nzd DECIMAL(10,2),
  total_nzd DECIMAL(10,2),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'invoice_sent', 'paid', 'shipped', 'delivered', 'cancelled')),
  payment_method TEXT,
  payment_reference TEXT,
  tracking_number TEXT,
  admin_notes TEXT,
  invoice_sent_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create store_order_items table
CREATE TABLE IF NOT EXISTS store_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES store_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES store_products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_price_nzd DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL,
  subtotal_nzd DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_store_products_slug ON store_products(slug);
CREATE INDEX IF NOT EXISTS idx_store_products_active ON store_products(is_active);
CREATE INDEX IF NOT EXISTS idx_store_products_category ON store_products(category);
CREATE INDEX IF NOT EXISTS idx_store_orders_number ON store_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_store_orders_email ON store_orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_store_orders_status ON store_orders(status);
CREATE INDEX IF NOT EXISTS idx_store_order_items_order ON store_order_items(order_id);

-- Function to generate store order numbers (format: STO-YYYYMMDD-NNNN)
CREATE OR REPLACE FUNCTION generate_store_order_number()
RETURNS TEXT AS $$
DECLARE
  today TEXT;
  sequence_num INTEGER;
  order_num TEXT;
BEGIN
  -- Get today's date in YYYYMMDD format
  today := TO_CHAR(NOW(), 'YYYYMMDD');

  -- Get the count of orders created today + 1
  SELECT COUNT(*) + 1 INTO sequence_num
  FROM store_orders
  WHERE order_number LIKE 'STO-' || today || '-%';

  -- Format: STO-YYYYMMDD-NNNN (with leading zeros)
  order_num := 'STO-' || today || '-' || LPAD(sequence_num::TEXT, 4, '0');

  RETURN order_num;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_store_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to store_products
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'store_products_updated_at'
  ) THEN
    CREATE TRIGGER store_products_updated_at
    BEFORE UPDATE ON store_products
    FOR EACH ROW
    EXECUTE FUNCTION update_store_updated_at();
  END IF;
END $$;

-- Apply updated_at trigger to store_orders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'store_orders_updated_at'
  ) THEN
    CREATE TRIGGER store_orders_updated_at
    BEFORE UPDATE ON store_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_store_updated_at();
  END IF;
END $$;

-- Trigger to auto-generate order number before insert
CREATE OR REPLACE FUNCTION set_store_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := generate_store_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'store_orders_set_number'
  ) THEN
    CREATE TRIGGER store_orders_set_number
    BEFORE INSERT ON store_orders
    FOR EACH ROW
    EXECUTE FUNCTION set_store_order_number();
  END IF;
END $$;

-- Enable RLS on all store tables
ALTER TABLE store_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for store_products
-- Public can read active products
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'store_products' AND policyname = 'Public can view active store products'
  ) THEN
    CREATE POLICY "Public can view active store products"
    ON store_products FOR SELECT
    USING (is_active = true);
  END IF;
END $$;

-- Authenticated admin users can manage all products
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'store_products' AND policyname = 'Admin can manage store products'
  ) THEN
    CREATE POLICY "Admin can manage store products"
    ON store_products FOR ALL
    USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- RLS Policies for store_orders
-- Public can create orders (submit order requests)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'store_orders' AND policyname = 'Public can create store orders'
  ) THEN
    CREATE POLICY "Public can create store orders"
    ON store_orders FOR INSERT
    WITH CHECK (true);
  END IF;
END $$;

-- Authenticated admin users can view and manage all orders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'store_orders' AND policyname = 'Admin can manage store orders'
  ) THEN
    CREATE POLICY "Admin can manage store orders"
    ON store_orders FOR ALL
    USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- RLS Policies for store_order_items
-- Public can insert order items (when creating order)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'store_order_items' AND policyname = 'Public can create store order items'
  ) THEN
    CREATE POLICY "Public can create store order items"
    ON store_order_items FOR INSERT
    WITH CHECK (true);
  END IF;
END $$;

-- Authenticated admin users can view and manage all order items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'store_order_items' AND policyname = 'Admin can manage store order items'
  ) THEN
    CREATE POLICY "Admin can manage store order items"
    ON store_order_items FOR ALL
    USING (auth.role() = 'authenticated');
  END IF;
END $$;
