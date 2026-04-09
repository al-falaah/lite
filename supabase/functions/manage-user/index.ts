// @ts-nocheck — Deno edge function
// Edge Function: Manage User (suspend / unsuspend / delete)
// Called by director only

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: { ...corsHeaders, 'Access-Control-Allow-Methods': 'POST' },
    })
  }

  try {
    const { action, userId } = await req.json()

    if (!action || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: action, userId' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    if (!['suspend', 'unsuspend', 'delete'].includes(action)) {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Must be: suspend, unsuspend, or delete' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    // Verify caller is a director
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Verify caller identity using their JWT
    const callerClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: { autoRefreshToken: false, persistSession: false },
        global: { headers: { Authorization: authHeader } }
      }
    )

    const { data: { user: caller }, error: callerError } = await callerClient.auth.getUser()
    if (callerError || !caller) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    // Check caller is director
    const { data: callerProfile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', caller.id)
      .single()

    if (!callerProfile || callerProfile.role !== 'director') {
      return new Response(
        JSON.stringify({ error: 'Only directors can manage users' }),
        { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    // Prevent self-deletion/suspension
    if (caller.id === userId) {
      return new Response(
        JSON.stringify({ error: 'You cannot modify your own account' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    if (action === 'suspend') {
      // Ban user for 100 years (effectively permanent)
      const { error } = await supabaseClient.auth.admin.updateUserById(userId, {
        ban_duration: '876000h'
      })
      if (error) throw error

      // Mark in profiles
      await supabaseClient
        .from('profiles')
        .update({ suspended_at: new Date().toISOString() })
        .eq('id', userId)

      return new Response(
        JSON.stringify({ success: true, message: 'User suspended' }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    if (action === 'unsuspend') {
      // Remove ban
      const { error } = await supabaseClient.auth.admin.updateUserById(userId, {
        ban_duration: 'none'
      })
      if (error) throw error

      // Clear suspension in profiles
      await supabaseClient
        .from('profiles')
        .update({ suspended_at: null })
        .eq('id', userId)

      return new Response(
        JSON.stringify({ success: true, message: 'User unsuspended' }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    if (action === 'delete') {
      // Delete auth user (cascades to profiles via FK if set, otherwise clean up manually)
      const { error } = await supabaseClient.auth.admin.deleteUser(userId)
      if (error) throw error

      // Clean up profile row if it still exists
      await supabaseClient
        .from('profiles')
        .delete()
        .eq('id', userId)

      return new Response(
        JSON.stringify({ success: true, message: 'User deleted' }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

  } catch (error) {
    console.error('manage-user error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )
  }
})
