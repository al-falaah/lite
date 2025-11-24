# Al-Falaah Email Notifications - Setup Guide

This directory contains Supabase Edge Functions for sending automated email notifications using Resend.

## 📧 Available Email Functions

1. **send-application-confirmation** - Sent when applicant submits application
2. **send-invite-email** - Sent when admin approves application and sends invite
3. **send-welcome-email** - Sent when student completes enrollment

## 🚀 Setup Instructions

### Step 1: Sign Up for Resend

1. Go to [resend.com](https://resend.com)
2. Create a free account (100 emails/day, 3,000/month)
3. Verify your email address
4. Go to **API Keys** section
5. Create a new API key
6. Copy the API key (starts with `re_...`)

### Step 2: Add Domain (Optional but Recommended)

For production, you should add your custom domain:

1. In Resend dashboard, go to **Domains**
2. Click **Add Domain**
3. Enter your domain (e.g., `alfalaah.co.nz`)
4. Add the DNS records to your domain provider
5. Wait for verification (usually a few minutes)

**For development/testing**: You can use Resend's test domain `onboarding@resend.dev`

### Step 3: Install Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF
```

To find your project ref:
- Go to your Supabase project dashboard
- Look at the URL: `https://supabase.com/dashboard/project/YOUR_PROJECT_REF`

### Step 4: Set Environment Variables

Add the Resend API key to your Supabase project secrets:

```bash
# Set RESEND_API_KEY
supabase secrets set RESEND_API_KEY=re_your_api_key_here

# Set APP_URL (your frontend URL)
supabase secrets set APP_URL=https://your-domain.com

# For local development
supabase secrets set APP_URL=http://localhost:5173
```

### Step 5: Deploy Edge Functions

```bash
# Deploy all functions at once
supabase functions deploy send-application-confirmation
supabase functions deploy send-invite-email
supabase functions deploy send-welcome-email

# Or deploy all at once
supabase functions deploy
```

### Step 6: Test the Functions

Test locally before deploying:

```bash
# Serve functions locally
supabase functions serve

# In another terminal, test a function
curl -i --location --request POST 'http://localhost:54321/functions/v1/send-application-confirmation' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"applicantData":{"full_name":"Test User","email":"test@example.com","program_type":"foundational","class_format":"cohort"}}'
```

## 🔗 Integration with Frontend

### 1. Application Confirmation Email

Add to `ApplicationPage.jsx` after successful submission:

```javascript
// After application is created
const { error: emailError } = await supabase.functions.invoke('send-application-confirmation', {
  body: {
    applicantData: {
      full_name: formData.full_name,
      email: formData.email,
      program_type: formData.program_type,
      class_format: formData.class_format
    }
  }
});

if (emailError) {
  console.error('Failed to send confirmation email:', emailError);
  // Don't fail the whole submission, just log it
}
```

### 2. Invite Email

Add to `AdminDashboard.jsx` when sending invite:

```javascript
const handleSendInvite = async (application) => {
  // ... existing code to generate invite token ...

  const { error: emailError } = await supabase.functions.invoke('send-invite-email', {
    body: {
      applicantData: {
        full_name: application.full_name,
        email: application.email,
        program_type: application.program_type
      },
      inviteToken: token,
      baseUrl: window.location.origin
    }
  });

  if (emailError) {
    console.error('Failed to send invite email:', emailError);
    toast.error('Invite created but email failed to send');
  } else {
    toast.success('Invite sent successfully!');
  }
};
```

### 3. Welcome Email

Add to `SignupPage.jsx` after successful enrollment:

```javascript
// After student record is created and enrollment is complete
const { error: emailError } = await supabase.functions.invoke('send-welcome-email', {
  body: {
    studentData: {
      full_name: application.full_name,
      email: application.email,
      student_number: studentRecord.student_number,
      program_type: application.program_type
    },
    baseUrl: window.location.origin
  }
});

if (emailError) {
  console.error('Failed to send welcome email:', emailError);
  // Don't fail enrollment, just log it
}
```

## 📊 Monitoring

### View Function Logs

```bash
# View logs for a specific function
supabase functions logs send-application-confirmation --tail

# View all function logs
supabase functions logs --tail
```

### Resend Dashboard

Monitor email delivery in the Resend dashboard:
- Go to **Emails** to see all sent emails
- Check delivery status
- View email content
- See bounce/complaint rates

## 🔒 Security Notes

1. **Never commit API keys** - Always use environment variables
2. **Verify requests** - Edge functions validate required data
3. **CORS configured** - Only allows requests from your frontend
4. **Rate limiting** - Resend has built-in rate limiting

## 🐛 Troubleshooting

### Email not sending

1. Check Resend API key is set correctly:
   ```bash
   supabase secrets list
   ```

2. Check function logs:
   ```bash
   supabase functions logs send-application-confirmation
   ```

3. Verify Resend dashboard for errors

### Function deployment fails

1. Ensure Supabase CLI is up to date:
   ```bash
   npm update -g supabase
   ```

2. Check you're linked to the correct project:
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```

### Emails going to spam

1. Add custom domain in Resend (not `onboarding@resend.dev`)
2. Configure SPF, DKIM, and DMARC records
3. Warm up your domain by sending gradually increasing volumes
4. Use professional, well-formatted email content (already done ✅)

## 📝 Next Steps

After basic emails are working:

1. **Payment Reminders** - Scheduled function to send reminders before due dates
2. **Email Preferences** - Let users opt out of certain emails
3. **Email Templates** - Create template variations for different programs
4. **Analytics** - Track open rates and click-through rates

## 💡 Tips

- **Free tier**: 3,000 emails/month is usually enough for small-medium institutes
- **Test emails**: Use your own email for testing before going live
- **Email design**: Current templates are mobile-responsive and tested
- **Compliance**: Include unsubscribe link for marketing emails (not needed for transactional)
