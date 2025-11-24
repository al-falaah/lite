# Email Notifications Setup

## Overview
Three email notification functions have been deployed:
1. **send-payment-verified-email** - Notifies students when payment is verified
2. **send-payment-reminder** - Sends reminders for overdue payments
3. **send-application-notification** - Notifies admin of new applications

## Setup Steps

### 1. Create Resend Account
1. Go to [resend.com](https://resend.com)
2. Sign up for a free account (100 emails/day free tier)
3. Verify your email

### 2. Get API Key
1. Go to Resend Dashboard → API Keys
2. Click "Create API Key"
3. Copy the key (starts with `re_...`)

### 3. Set Environment Variables in Supabase
1. Go to Supabase Dashboard → Project Settings → Edge Functions → Manage secrets
2. Add these secrets:
   ```
   RESEND_API_KEY=re_your_api_key_here
   ADMIN_EMAIL=your_admin_email@example.com
   APP_URL=https://your-app-domain.com
   ```

### 4. Verify Domain (Production)
For production use, you need to verify your domain in Resend:
1. Go to Resend Dashboard → Domains
2. Click "Add Domain"
3. Follow DNS setup instructions
4. Update email functions to use your domain (change `@alfalaah.edu` to your domain)

For testing, you can use the sandbox domain that comes with Resend.

## How to Use

### 1. When Admin Verifies Payment
Call the function from your admin dashboard:
```javascript
const response = await fetch(
  `${supabaseUrl}/functions/v1/send-payment-verified-email`,
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ paymentId: 'payment-uuid-here' }),
  }
)
```

### 2. Send Payment Reminders (Manual or Scheduled)
```javascript
const response = await fetch(
  `${supabaseUrl}/functions/v1/send-payment-reminder`,
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
  }
)
```

You can set this up as a cron job to run daily.

### 3. When Application is Submitted
Call from your application form:
```javascript
const response = await fetch(
  `${supabaseUrl}/functions/v1/send-application-notification`,
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ applicationId: 'application-uuid-here' }),
  }
)
```

## Testing

Test each function:
```bash
# Test payment verified email
curl -X POST https://your-project.supabase.co/functions/v1/send-payment-verified-email \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"paymentId": "test-payment-id"}'

# Test payment reminder
curl -X POST https://your-project.supabase.co/functions/v1/send-payment-reminder \
  -H "Authorization: Bearer YOUR_ANON_KEY"

# Test application notification
curl -X POST https://your-project.supabase.co/functions/v1/send-application-notification \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type": "application/json" \
  -d '{"applicationId": "test-application-id"}'
```

## Next Steps

1. Set up Resend account and get API key
2. Add environment variables to Supabase
3. Integrate function calls into your admin dashboard
4. Set up cron job for payment reminders (daily at 9 AM recommended)
5. Test each email notification

## Email Templates

All emails are professional HTML templates with:
- Al-Falaah branding
- Clear call-to-action buttons
- Payment/application details
- Automated footer disclaimers
