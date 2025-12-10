#!/bin/bash

# Get the Supabase URL and service role key from env
SUPABASE_URL="${VITE_SUPABASE_URL}"
SUPABASE_SERVICE_ROLE_KEY="${VITE_SUPABASE_SERVICE_ROLE_KEY}"

# Test student data
curl -i --location --request POST "${SUPABASE_URL}/functions/v1/send-welcome-email" \
  --header "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  --header "Content-Type: application/json" \
  --data '{
    "studentData": {
      "full_name": "Test Student",
      "email": "scigine.dev@gmail.com",
      "student_id": "100001",
      "program": "essentials"
    },
    "baseUrl": "http://localhost:5173"
  }'
