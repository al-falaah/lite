# Stripe Webhook Integration - Setup Guide

## Overview

The Stripe webhook integration automatically handles:
1. ✅ **Payment tracking** - Updates `total_paid` and `balance_remaining` when students pay
2. ✅ **Subscription management** - Records monthly recurring payments
3. ✅ **Dropout handling** - Marks students as withdrawn when they cancel subscription
4. ✅ **Schedule visibility** - Automatically hides schedules for dropout students
5. ✅ **Reapplication requirement** - Dropout students must reapply to rejoin

---

## How It Works

### When a New Student Pays (First Payment)

**Event:** `checkout.session.completed`

1. Stripe sends webhook when payment is successful
2. System creates an enrollment for the specific program (essentials or tajweed)
3. Links the Stripe subscription ID to the enrollment
4. Records the payment in the database
5. Database trigger automatically updates `total_paid` and `balance_remaining`

### When Subscription Renews (Monthly Payments)

**Event:** `invoice.payment_succeeded`

1. Stripe sends webhook when monthly payment succeeds
2. System finds the enrollment by subscription ID
3. Records the payment linked to that enrollment
4. Database trigger automatically updates payment totals

### When Student Cancels Subscription

**Event:** `customer.subscription.deleted`

1. Stripe sends webhook when subscription is canceled
2. System finds the enrollment by subscription ID
3. Updates enrollment status to `'withdrawn'` (dropout)
4. Student portal automatically hides all schedules for withdrawn enrollments
5. Student must reapply to create a new enrollment if they want to rejoin

---

## Stripe Dashboard Setup

### 1. Get Your Webhook URL

Your webhook endpoint is:
```
https://rkcdamqaptapsrhejdzm.supabase.co/functions/v1/stripe-webhook
```

### 2. Configure Webhook in Stripe

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Enter the webhook URL above
4. Select these events to listen for:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `customer.subscription.deleted`
5. Click "Add endpoint"

### 3. Get Your Webhook Signing Secret

1. After creating the webhook, click on it
2. Copy the "Signing secret" (starts with `whsec_...`)
3. Add it to your Supabase secrets:

```bash
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
```

### 4. Verify Webhook is Receiving Events

1. Make a test payment in Stripe
2. Go to Stripe Dashboard → Developers → Webhooks → [Your webhook]
3. Check the "Recent events" section
4. You should see successful responses (200 status code)

---

## Database Schema

### Enrollments Table

Each enrollment tracks a student's participation in one program:

- **student_id** - References the student
- **program** - 'essentials' or 'tajweed'
- **status** - 'active', 'completed', or 'withdrawn'
- **total_fees** - Total amount student owes
- **total_paid** - Amount paid so far (auto-updated)
- **balance_remaining** - Amount still owed (auto-calculated)
- **stripe_subscription_id** - Links to Stripe subscription
- **payment_type** - 'monthly', 'annual', or 'one-time'

### Payments Table

Each payment is linked to a specific enrollment:

- **student_id** - References the student
- **enrollment_id** - References specific enrollment
- **amount** - Payment amount
- **status** - 'pending' or 'verified'
- **stripe_payment_id** - Stripe payment intent ID
- **stripe_subscription_id** - Stripe subscription ID

---

## Automatic Payment Total Updates

When a payment is marked as `verified`, a database trigger automatically:

1. Calculates the sum of all verified payments for that enrollment
2. Updates `total_paid` on the enrollment
3. Recalculates `balance_remaining` as `total_fees - total_paid`

**You don't need to manually update these fields!**

---

## Student Portal Behavior

### For Active Students (status = 'active')

- ✅ Enrollment is visible
- ✅ Schedules are shown
- ✅ Payment totals are accurate
- ✅ Can access Stripe billing portal

### For Withdrawn Students (status = 'withdrawn')

- ❌ Enrollment is hidden
- ❌ Schedules are NOT shown
- ❌ Cannot see class information
- ⚠️ Must reapply to rejoin

---

## Testing the Integration

Run this script to check a student's status:

```bash
node check-yesirat-enrollment.js
```

This shows:
- Current enrollment status
- Payment history
- Total paid vs balance remaining
- Active schedules

---

## Troubleshooting

### Webhook Not Receiving Events

1. Check webhook URL is correct in Stripe Dashboard
2. Verify `STRIPE_WEBHOOK_SECRET` is set correctly
3. Check webhook logs in Stripe Dashboard
4. Check Supabase Edge Function logs

### Payments Not Recording

1. Check webhook events include required events
2. Verify metadata in checkout session includes:
   - `student_id`
   - `plan_type` (monthly/annual/one-time)
   - `program` (essentials/tajweed)
3. Check Edge Function logs for errors

### Enrollment Not Marked as Withdrawn

1. Verify webhook includes `customer.subscription.deleted` event
2. Check that enrollment has correct `stripe_subscription_id`
3. Check Edge Function logs for errors

---

## Important Notes

### Multiple Programs

- A student can have multiple active enrollments
- Each enrollment has its own subscription and payment tracking
- Canceling one subscription doesn't affect other enrollments

### Reapplication After Dropout

When a student cancels their subscription:
1. Enrollment is marked as `withdrawn`
2. Schedules are hidden
3. Student must reapply to create a NEW enrollment
4. Payment history is preserved

---

## Next Steps

1. Configure webhook in Stripe Dashboard
2. Add webhook signing secret to Supabase
3. Test with a payment
4. Monitor webhook logs
5. Verify payment data in database
