# Blog Email Notifications Setup Guide

This guide explains how to set up automated email notifications for blog subscribers using Supabase Edge Functions and Resend.

## Prerequisites

1. **Resend Account**: Sign up at https://resend.com (free tier includes 3,000 emails/month)
2. **Verified Domain**: Add and verify your domain `tftmadrasah.nz` in Resend dashboard
3. **Supabase Project**: Already configured

## Step 1: Set Up Resend

### 1.1 Create Resend Account
1. Go to https://resend.com
2. Sign up with your email
3. Verify your email address

### 1.2 Add and Verify Domain
1. In Resend dashboard, go to "Domains"
2. Click "Add Domain"
3. Enter `tftmadrasah.nz`
4. Add the provided DNS records to your domain:
   - SPF Record
   - DKIM Record
   - Custom domain CNAME (optional)
5. Wait for verification (can take a few hours)

### 1.3 Get API Key
1. In Resend dashboard, go to "API Keys"
2. Click "Create API Key"
3. Name it "Blog Notifications"
4. Copy the API key (it starts with `re_`)
5. **IMPORTANT**: Save this key securely - you won't see it again!

## Step 2: Enable Supabase Extensions

### 2.1 Enable pg_net Extension
1. Go to Supabase Dashboard → Database → Extensions
2. Search for `pg_net`
3. Enable the extension
4. This allows the database to make HTTP requests

## Step 3: Deploy Edge Function

### 3.1 Deploy the Function
```bash
# From project root
cd supabase

# Deploy the notify-blog-subscribers function
supabase functions deploy notify-blog-subscribers
```

### 3.2 Set Environment Secrets
```bash
# Set Resend API key
supabase secrets set RESEND_API_KEY=re_your_actual_api_key_here

# Verify secrets are set
supabase secrets list
```

You should see:
- `RESEND_API_KEY` (value hidden)
- `SUPABASE_URL` (auto-set)
- `SUPABASE_SERVICE_ROLE_KEY` (auto-set)

## Step 4: Apply Database Migration

```bash
# Push the database migration to enable auto-notifications
supabase db push
```

This will create:
- `notify_blog_publish()` function
- Trigger on `blog_posts` table
- Automatic email sending when blog posts are published

## Step 5: Test the System

### 5.1 Subscribe to Blog
1. Visit https://www.tftmadrasah.nz/blog
2. Scroll to subscription form
3. Subscribe with a test email

### 5.2 Publish a Blog Post
1. Go to https://www.tftmadrasah.nz/blog/admin
2. Create or edit a blog post
3. Change status from "Draft" to "Published"
4. Click "Save Changes"

### 5.3 Check Email
- You should receive an email within 1-2 minutes
- Check spam folder if not in inbox
- Email will come from `blog@tftmadrasah.nz`

## Step 6: Monitor and Debug

### 6.1 View Edge Function Logs
```bash
# Real-time logs
supabase functions logs notify-blog-subscribers --tail
```

### 6.2 Check Resend Dashboard
1. Go to Resend dashboard → Emails
2. View sent emails and delivery status
3. Check for any errors or bounces

### 6.3 Test Unsubscribe
1. Click "Unsubscribe" link in email
2. Confirm unsubscription
3. Verify subscriber is marked as `is_active = false` in database

## Email Features

### Current Implementation
✅ Automated emails when blog posts are published
✅ Beautiful HTML email template with brand colors
✅ Responsive design (works on mobile)
✅ Featured image display
✅ Unsubscribe link in every email
✅ Personalized greeting if name is provided
✅ Author and publish date
✅ Direct link to full article

### Email Template Includes
- Site branding header
- Featured image (if available)
- Post title and excerpt
- "Read Full Article" call-to-action button
- Author and publication date
- Unsubscribe link in footer

## Customization

### Change Email Sender
Edit `supabase/functions/notify-blog-subscribers/index.ts`:
```typescript
from: 'The FastTrack Madrasah <blog@tftmadrasah.nz>',
```

### Modify Email Template
The HTML template is in the Edge Function file. You can customize:
- Colors and styling
- Layout and structure
- Text content
- Logo/images

### Change Trigger Behavior
Edit `supabase/migrations/20250102000001_add_blog_notification_trigger.sql` to:
- Add delays before sending
- Filter by post categories
- Add additional conditions

## Cost Estimation

### Resend Pricing (Free Tier)
- 3,000 emails/month: **FREE**
- 100 emails/day limit
- $20/month for 50,000 emails after free tier

### Supabase Pricing
- Edge Functions: Included in free tier (500K invocations/month)
- Database operations: Minimal impact

### Estimated Usage
- 100 subscribers × 4 posts/month = **400 emails/month** (well within free tier)

## Troubleshooting

### Emails Not Sending
1. Check Resend API key is set correctly:
   ```bash
   supabase secrets list
   ```

2. View Edge Function logs:
   ```bash
   supabase functions logs notify-blog-subscribers
   ```

3. Check pg_net extension is enabled:
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'pg_net';
   ```

### Domain Not Verified
- DNS changes can take 24-48 hours
- Use Resend's DNS checker
- Contact Resend support if issues persist

### Test Email Not Received
- Check spam/junk folder
- Verify subscriber is marked as `is_active = true`
- Check Resend dashboard for delivery status
- Ensure post status changed TO published (not already published)

## Security Best Practices

1. **Never commit API keys** to git
2. **Use environment variables** for all secrets
3. **Rotate API keys** periodically
4. **Monitor usage** in Resend dashboard
5. **Set rate limits** if needed
6. **Validate email addresses** before subscribing

## Support

For issues with:
- **Resend**: docs.resend.com or support@resend.com
- **Supabase**: supabase.com/docs or dashboard support
- **This System**: Check function logs and database triggers

## Manual Email Sending (Optional)

If you need to manually notify subscribers (e.g., for testing):

```bash
# Using curl (replace POST_ID with actual blog post ID)
curl -X POST 'https://rkcdamqaptapsrhejdzm.supabase.co/functions/v1/notify-blog-subscribers' \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"post_id": "YOUR_POST_ID"}'
```

## Next Steps

After setup is complete:
1. Test with multiple subscribers
2. Monitor email delivery rates
3. Adjust email template based on feedback
4. Consider adding:
   - Weekly digest emails
   - Welcome email for new subscribers
   - Re-engagement campaigns
   - Newsletter archive page
