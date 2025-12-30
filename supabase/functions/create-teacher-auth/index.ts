// Edge Function: Create Teacher Auth User
// Called by admin to create a teacher with Supabase Auth

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Methods': 'POST',
      },
    })
  }

  try {
    const { email, password, full_name, staff_id } = await req.json()

    if (!email || !password || !full_name || !staff_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      )
    }

    // Create Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Create Supabase Auth user
    const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: full_name,
        staff_id: staff_id,
        role: 'teacher',
        first_login: true,
      },
    })

    if (authError) {
      console.error('Failed to create auth user:', authError)
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    console.log('✅ Teacher auth user created:', authData.user.id)

    return new Response(
      JSON.stringify({
        success: true,
        auth_user_id: authData.user.id
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        },
      }
    )
  } catch (error) {
    console.error('Error in create-teacher-auth:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        },
      }
    )
  }
})
