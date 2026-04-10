-- Dynamic Program Pricing Table
-- Allows the director to manage fees from the dashboard.
-- "Full price" = hourly_rate × hours_per_week × total_weeks (market rate).
-- If current fees < full price → displayed as "Subsidized" on the site.

CREATE TABLE IF NOT EXISTS program_pricing (
  program_id TEXT PRIMARY KEY,
  pricing_type TEXT NOT NULL CHECK (pricing_type IN ('one-time', 'subscription')),
  hourly_rate NUMERIC(10,2) NOT NULL,
  hours_per_week NUMERIC(4,1) NOT NULL,
  total_weeks INTEGER NOT NULL,
  current_price NUMERIC(10,2),         -- for one-time programs
  current_price_monthly NUMERIC(10,2), -- for subscription programs
  current_price_annual NUMERIC(10,2),  -- for subscription programs
  currency TEXT NOT NULL DEFAULT 'NZD',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Seed current pricing data
INSERT INTO program_pricing (program_id, pricing_type, hourly_rate, hours_per_week, total_weeks, current_price, current_price_monthly, current_price_annual)
VALUES
  -- QARI: $20/hr, 1.5 hrs/week, 52 weeks → full = $1,560, current = $300
  ('qari', 'one-time', 20.00, 1.5, 52, 300.00, NULL, NULL),
  -- TMP: $20/hr, 1.5 hrs/week, 24 weeks → full = $720, current = $150
  ('tajweed', 'one-time', 20.00, 1.5, 24, 150.00, NULL, NULL),
  -- EASI: $30/hr, 2.5 hrs/week, 104 weeks → full = $7,800, current = $35/mo or $375/yr
  ('essentials', 'subscription', 30.00, 2.5, 104, NULL, 35.00, 375.00)
ON CONFLICT (program_id) DO NOTHING;

-- RLS
ALTER TABLE program_pricing ENABLE ROW LEVEL SECURITY;

-- Anyone can read pricing (it's public info)
CREATE POLICY "Anyone can read pricing"
  ON program_pricing FOR SELECT
  USING (true);

-- Only directors can update pricing
CREATE POLICY "Directors can update pricing"
  ON program_pricing FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'director'
    )
  );

-- Also fix the stale create_enrollment function pricing
-- Update Tajweed from $120 to current, add QARI, and read from program_pricing table
CREATE OR REPLACE FUNCTION create_enrollment(
  p_student_id UUID,
  p_program TEXT,
  p_payment_type TEXT DEFAULT 'monthly',
  p_payment_amount NUMERIC DEFAULT NULL,
  p_total_fees NUMERIC DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_enrollment_id UUID;
  v_total_fees NUMERIC;
  v_payment_amount NUMERIC;
  v_program_duration_months INTEGER;
  v_pricing RECORD;
BEGIN
  -- Fetch live pricing from program_pricing table
  SELECT * INTO v_pricing FROM program_pricing WHERE program_id = p_program;

  IF v_pricing IS NULL THEN
    RAISE EXCEPTION 'Unknown program: %', p_program;
  END IF;

  -- Calculate total fees and duration based on pricing type
  IF v_pricing.pricing_type = 'one-time' THEN
    v_total_fees := COALESCE(p_total_fees, v_pricing.current_price);
    v_payment_amount := COALESCE(p_payment_amount, v_pricing.current_price);
    -- Duration: derive from total_weeks
    v_program_duration_months := GREATEST(1, (v_pricing.total_weeks / 4.33)::INTEGER);
  ELSE
    -- Subscription (essentials)
    v_program_duration_months := GREATEST(1, (v_pricing.total_weeks / 4.33)::INTEGER);
    IF p_payment_type = 'monthly' THEN
      v_total_fees := COALESCE(p_total_fees, v_pricing.current_price_monthly * v_program_duration_months);
      v_payment_amount := COALESCE(p_payment_amount, v_pricing.current_price_monthly);
    ELSE
      v_total_fees := COALESCE(p_total_fees, v_pricing.current_price_annual * GREATEST(1, (v_pricing.total_weeks / 52.0)::INTEGER));
      v_payment_amount := COALESCE(p_payment_amount, v_pricing.current_price_annual);
    END IF;
  END IF;

  -- Create enrollment
  INSERT INTO enrollments (
    student_id,
    program,
    status,
    payment_status,
    payment_type,
    total_fees,
    amount_paid,
    program_duration_months,
    enrolled_at
  ) VALUES (
    p_student_id,
    p_program,
    'enrolled',
    'pending',
    CASE WHEN v_pricing.pricing_type = 'one-time' THEN 'oneTime' ELSE p_payment_type END,
    v_total_fees,
    0,
    v_program_duration_months,
    now()
  )
  RETURNING id INTO v_enrollment_id;

  RETURN v_enrollment_id;
END;
$$;
