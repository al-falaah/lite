#!/bin/bash

# Script to update email domain across all Edge Functions
# Run this after verifying your custom domain in Resend

echo "🔄 Email Domain Update Script"
echo "=============================="
echo ""

# Default to tftmadrasah.nz if no parameter provided
if [ -z "$1" ]; then
  DOMAIN="tftmadrasah.nz"
  echo "Using default domain: $DOMAIN"
else
  DOMAIN=$1
fi
echo "Updating all email functions to use: $DOMAIN"
echo ""

# Confirm with user
read -p "Have you verified this domain in Resend? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ Please verify your domain in Resend first: https://resend.com/domains"
  exit 1
fi

echo ""
echo "📧 Updating email functions..."

# Update send-application-confirmation
echo "  → send-application-confirmation"
sed -i.bak "s/from: 'Al-Falaah Institute <onboarding@resend.dev>'/from: 'Al-Falaah Institute <noreply@$DOMAIN>'/g" \
  supabase/functions/send-application-confirmation/index.ts

# Update send-welcome-email
echo "  → send-welcome-email"
sed -i.bak "s/from: 'Al-Falaah Institute <onboarding@resend.dev>'/from: 'Al-Falaah Institute <noreply@$DOMAIN>'/g" \
  supabase/functions/send-welcome-email/index.ts

# Update send-daily-digest
echo "  → send-daily-digest"
sed -i.bak "s/from: 'Al-Falaah Admin <onboarding@resend.dev>'/from: 'Al-Falaah Admin <noreply@$DOMAIN>'/g" \
  supabase/functions/send-daily-digest/index.ts

# Update _shared/email.ts
echo "  → _shared/email.ts"
sed -i.bak "s/from: 'Al-Falaah <onboarding@resend.dev>'/from: 'Al-Falaah <noreply@$DOMAIN>'/g" \
  supabase/functions/_shared/email.ts

# Clean up backup files
rm -f supabase/functions/send-application-confirmation/index.ts.bak
rm -f supabase/functions/send-welcome-email/index.ts.bak
rm -f supabase/functions/send-daily-digest/index.ts.bak
rm -f supabase/functions/_shared/email.ts.bak

echo ""
echo "✅ Email domain updated in all functions!"
echo ""
echo "📤 Next steps:"
echo "  1. Review the changes: git diff"
echo "  2. Deploy functions: supabase functions deploy --all"
echo "  3. Update environment variables:"
echo "     supabase secrets set ADMIN_EMAIL=admin@$DOMAIN"
echo "     supabase secrets set APP_URL=https://$DOMAIN"
echo ""
