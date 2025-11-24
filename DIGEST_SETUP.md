# Daily Digest Email Setup

## Overview

The daily digest system sends you summary emails **twice per day** (morning and evening) with:
- Number of new applications submitted
- Number of new payment uploads awaiting verification
- Details of each application and payment

The digest only sends emails when there's activity - if there are no new applications or payments, no email is sent.

## What's Been Done

✅ Created the `send-daily-digest` Edge Function
✅ Deployed the function to Supabase
✅ Removed individual notification emails (to avoid spam)
✅ Tested successfully - digest email sent!

## Setting Up the Schedule

You have 3 options to schedule the digest emails:

### Option 1: EasyCron (Recommended - Free & Simple)

1. Go to [EasyCron.com](https://www.easycron.com/) and sign up (free plan allows 2 cron jobs)

2. Create **Morning Digest** job (8 AM NZ time):
   - **URL**: `https://rkcdamqaptapsrhejdzm.supabase.co/functions/v1/send-daily-digest`
   - **Cron Expression**: `0 20 * * *` (8 PM UTC = 8 AM NZDT next day)
   - **HTTP Method**: POST
   - **HTTP Headers**:
     ```
     Authorization: Bearer YOUR_SUPABASE_ANON_KEY
     Content-Type: application/json
     ```
   - **Request Body**: `{}`

3. Create **Evening Digest** job (8 PM NZ time):
   - **URL**: Same as above
   - **Cron Expression**: `0 8 * * *` (8 AM UTC = 8 PM NZDT same day)
   - **HTTP Method**: POST
   - **HTTP Headers**: Same as above
   - **Request Body**: `{}`

**Note**: These times are for NZDT (UTC+13). During standard time (UTC+12), adjust by 1 hour if needed.

### Option 2: GitHub Actions (If you use GitHub)

Create `.github/workflows/daily-digest.yml`:

```yaml
name: Daily Digest Emails

on:
  schedule:
    # Morning: 8 PM UTC = 9 AM NZDT
    - cron: '0 20 * * *'
    # Evening: 8 AM UTC = 9 PM NZDT
    - cron: '0 8 * * *'
  workflow_dispatch: # Allows manual trigger

jobs:
  send-digest:
    runs-on: ubuntu-latest
    steps:
      - name: Send Digest Email
        run: |
          curl -X POST "https://rkcdamqaptapsrhejdzm.supabase.co/functions/v1/send-daily-digest" \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{}'
```

Add `SUPABASE_ANON_KEY` to your GitHub repository secrets.

### Option 3: Supabase pg_cron (Advanced)

Run the migration:
```bash
supabase db push
```

This will set up the cron jobs directly in your Supabase database (if pg_cron is available in your plan).

## Manual Testing

To manually trigger a digest email anytime:

```bash
./test-digest.sh
```

Or use curl:
```bash
curl -X POST "https://rkcdamqaptapsrhejdzm.supabase.co/functions/v1/send-daily-digest" \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

## Digest Schedule

The digest uses **New Zealand time (Pacific/Auckland timezone)** and automatically adjusts for daylight saving.

- **Morning Digest**: Runs at 8 AM NZ time (covers previous 12 hours)
- **Evening Digest**: Runs at 8 PM NZ time (covers previous 12 hours)

### Smart Skipping
The digest only sends emails when there's activity in the last 12 hours. If there are no new applications or payments, no email is sent - no spam!

## What the Email Includes

### Summary Stats
- Total new applications
- Total payments awaiting verification

### Application Details
For each new application:
- Full name, email, phone
- Status badge
- Submission time
- Can read Quran (with Tajweed level)
- Studied Arabic (with Arabic level)

### Payment Details
For each pending payment:
- Student name and ID
- Amount
- Payment date
- Payment method
- Upload time

### Quick Actions
- Direct link to admin dashboard

## Troubleshooting

**No emails received?**
1. Check your spam folder
2. Verify ADMIN_EMAIL is set correctly in Supabase Environment Variables
3. Run `./test-digest.sh` to manually test
4. Check Supabase function logs in the dashboard

**Getting too many/few emails?**
- The digest automatically skips sending if there's no activity
- Adjust the cron schedule times to your preference
- Each digest covers 12 hours of activity

**Want to change digest times?**
Edit the cron expressions:
- `0 20 * * *` = 8 PM UTC (morning in NZ)
- `0 8 * * *` = 8 AM UTC (evening in NZ)

Use [crontab.guru](https://crontab.guru/) to help with cron expressions.

## Next Steps

1. Choose your scheduling method (EasyCron recommended)
2. Set up the two cron jobs (morning & evening)
3. Wait for the first digest or run `./test-digest.sh` to see it in action
4. Check your admin email!

---

**Note**: During the transition, you might receive both old individual notifications and new digests. The individual notifications have been removed from the application form, so you'll only get digests going forward.
