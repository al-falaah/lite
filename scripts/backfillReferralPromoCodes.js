// One-off: create Stripe promotion codes for every enrolled student's referral_code.
// Reads all students that have referral_code set and creates a promo code under
// REFERRAL_25_OFF. Skips if the promo code already exists (Stripe returns
// resource_already_exists).
//
// Usage:
//   STRIPE_SECRET_KEY=sk_live_... \
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
//   node scripts/backfillReferralPromoCodes.js

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!STRIPE_SECRET_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing env vars. Need STRIPE_SECRET_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: students, error } = await supabase
    .from('students')
    .select('id, full_name, email, referral_code, status')
    .not('referral_code', 'is', null)
    .eq('status', 'enrolled');

  if (error) {
    console.error('Query error:', error);
    process.exit(1);
  }

  console.log(`Found ${students.length} enrolled students with referral codes.`);

  for (const s of students) {
    try {
      const promo = await stripe.promotionCodes.create({
        coupon: 'REFERRAL_25_OFF',
        code: s.referral_code,
        max_redemptions: 10,
        metadata: { student_id: s.id, backfill: 'true' },
      });
      console.log(`✅ ${s.full_name} (${s.email}) → ${s.referral_code} [${promo.id}]`);
    } catch (err) {
      if (err?.code === 'resource_already_exists') {
        console.log(`⏭  ${s.full_name} → ${s.referral_code} already exists, skipped`);
      } else {
        console.error(`❌ ${s.full_name} → ${s.referral_code}:`, err.message);
      }
    }
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
