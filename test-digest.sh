#!/bin/bash

# Test the daily digest email function
# This sends a digest email with the last 12 hours of activity

echo "Testing daily digest email..."

curl -L -X POST "https://rkcdamqaptapsrhejdzm.supabase.co/functions/v1/send-daily-digest" \
  -H "Authorization: Bearer $(grep SUPABASE_ANON_KEY .env | cut -d '=' -f2)" \
  -H "Content-Type: application/json" \
  -d '{}'

echo ""
echo "✅ Digest function invoked! Check the response above and your admin email."
