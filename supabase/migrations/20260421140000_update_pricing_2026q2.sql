-- Q2 2026 pricing uplift.
-- Adds previous_price column to support "was X, now Y" framing on the public
-- site. Bumps TMP, QARI, EASI per director decision. Existing paid enrollments
-- are unaffected (enrollments store their own total_fees at purchase time).

ALTER TABLE program_pricing
  ADD COLUMN IF NOT EXISTS previous_price NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS previous_price_monthly NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS previous_price_annual NUMERIC(10,2);

-- TMP: $150 → $295 one-time (6-month program, 24 weeks × 1.5h = 36h)
UPDATE program_pricing
SET previous_price = 150.00,
    current_price = 295.00,
    updated_at = now()
WHERE program_id = 'tajweed';

-- QARI: $650 → $650 one-time (kept). No "was/now" since no change.
-- (Monthly option deferred — requires checkout/webhook work to support both
--  one-time and subscription modes on the same program.)

-- EASI: $55/mo → $75/mo, $615/yr → $800/yr
UPDATE program_pricing
SET previous_price_monthly = 55.00,
    current_price_monthly = 75.00,
    previous_price_annual = 615.00,
    current_price_annual = 800.00,
    updated_at = now()
WHERE program_id = 'essentials';
