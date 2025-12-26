import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Disabling RLS on blog_posts and class_schedules...')

    // Disable RLS on blog_posts
    const { error: blogError } = await supabaseClient.rpc('exec', {
      query: 'ALTER TABLE blog_posts DISABLE ROW LEVEL SECURITY;'
    })

    if (blogError) {
      console.error('Error disabling RLS on blog_posts:', blogError)
    } else {
      console.log('✓ RLS disabled on blog_posts')
    }

    // Disable RLS on class_schedules
    const { error: scheduleError } = await supabaseClient.rpc('exec', {
      query: 'ALTER TABLE class_schedules DISABLE ROW LEVEL SECURITY;'
    })

    if (scheduleError) {
      console.error('Error disabling RLS on class_schedules:', scheduleError)
    } else {
      console.log('✓ RLS disabled on class_schedules')
    }

    // Check results
    const { data: checkData, error: checkError } = await supabaseClient
      .from('pg_tables')
      .select('tablename, rowsecurity')
      .in('tablename', ['blog_posts', 'class_schedules'])
      .eq('schemaname', 'public')

    if (checkError) {
      console.error('Error checking RLS status:', checkError)
    } else {
      console.log('Current RLS status:', checkData)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'RLS disabled on blog_posts and class_schedules',
        blog_error: blogError,
        schedule_error: scheduleError,
        status: checkData
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
