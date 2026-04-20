-- Idempotency ledger for Stripe webhook deliveries.
-- Prevents duplicate enrollment/payment rows when the same Stripe event is
-- delivered more than once (retries, or admin-triggered replays from the
-- Stripe Dashboard). The webhook inserts event_id at the top of the handler;
-- if the insert fails with unique_violation, processing is skipped.

CREATE TABLE IF NOT EXISTS stripe_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  payload JSONB
);

CREATE INDEX IF NOT EXISTS idx_stripe_events_type_time
  ON stripe_events (event_type, processed_at DESC);

ALTER TABLE stripe_events ENABLE ROW LEVEL SECURITY;

-- Only service role writes/reads this table; no public policies.
