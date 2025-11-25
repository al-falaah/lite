# Stripe Webhook Configuration

## Critical Setup Step for Production

To enable automatic student enrollment after payment, you **must** configure the Stripe webhook in your Stripe Dashboard.

## Steps to Configure

### 1. Go to Stripe Dashboard
Visit: https://dashboard.stripe.com/webhooks

### 2. Add New Endpoint
Click **"Add endpoint"** button

### 3. Configure Endpoint URL
Enter the following URL:
```
https://rkcdamqaptapsrhejdzm.supabase.co/functions/v1/stripe-webhook
```

### 4. Select Events to Listen For
Add these two events:
- `checkout.session.completed` - Triggered when payment is successful
- `invoice.payment_succeeded` - Triggered for recurring monthly payments

### 5. Get Webhook Signing Secret
After creating the endpoint, Stripe will show you a webhook signing secret starting with `whsec_...`

Copy this secret.

### 6. Store Secret in Supabase
Run this command in your terminal:
```bash
supabase secrets set STRIPE_WEBHOOK_SECRET="whsec_your_actual_secret_here"
```

Replace `whsec_your_actual_secret_here` with the actual secret from Stripe.

## Testing the Webhook

After configuration, you can test the complete flow:

1. **Submit Application**: Go to /apply and submit a test application
2. **Approve Application**: Login to /admin and approve the application
3. **Check Email**: Applicant receives payment instructions email
4. **Click Payment Link**: Opens /payment page with student ID
5. **Select Plan**: Choose monthly ($25/month) or annual ($275/year)
6. **Complete Payment**: Redirected to Stripe Checkout
7. **Payment Success**: After payment, redirected to /payment-success
8. **Auto Enrollment**: Webhook automatically enrolls student
9. **Welcome Email**: Student receives welcome email with student ID

## Verification

To verify the webhook is working:

1. Go to Stripe Dashboard > Webhooks
2. Click on your webhook endpoint
3. Check the "Events" tab to see incoming webhook events
4. Successful events show a green checkmark ✓
5. Failed events show a red X - click for error details

## Common Issues

### Webhook Returns 400 Error
- Check that `STRIPE_WEBHOOK_SECRET` is correctly set in Supabase
- Verify the secret matches exactly (no extra quotes or spaces)

### Student Not Auto-Enrolled
- Check webhook events in Stripe Dashboard
- Look for `checkout.session.completed` event
- Check Supabase Edge Function logs for errors

### Welcome Email Not Sent
- Verify `send-welcome-email` Edge Function is deployed
- Check function logs in Supabase Dashboard

## Important Notes

- Without webhook configuration, payments will succeed but students won't be auto-enrolled
- Webhook signature verification ensures requests are genuinely from Stripe
- Always use HTTPS for webhook URLs (HTTP is rejected by Stripe)
- Test with Stripe test mode first before going live

## Support

If you encounter issues:
1. Check Stripe Dashboard webhook logs
2. Check Supabase Edge Function logs
3. Contact support at admin@alfalaah-academy.nz
