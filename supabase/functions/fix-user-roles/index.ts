// @ts-nocheck — Deno edge function (URL imports + Deno global are valid)
// Edge Function: Fix User Roles
// One-time function to set user_metadata.role for all existing teachers and students

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { ...corsHeaders, 'Access-Control-Allow-Methods': 'POST' } })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const results = { teachers: { fixed: 0, skipped: 0, errors: [] as string[] }, students: { fixed: 0, skipped: 0, errors: [] as string[] } }

    // Fix teachers
    const { data: teachers, error: teachersError } = await supabaseClient
      .from('teachers')
      .select('id, full_name, email, auth_user_id')
      .not('auth_user_id', 'is', null)

    if (teachersError) {
      throw new Error(`Failed to fetch teachers: ${teachersError.message}`)
    }

    for (const teacher of teachers || []) {
      try {
        const { data: { user }, error: getUserError } = await supabaseClient.auth.admin.getUserById(teacher.auth_user_id)

        if (getUserError || !user) {
          results.teachers.errors.push(`${teacher.full_name}: user not found`)
          continue
        }

        if (user.user_metadata?.role === 'teacher') {
          results.teachers.skipped++
          continue
        }

        const { error: updateError } = await supabaseClient.auth.admin.updateUserById(teacher.auth_user_id, {
          user_metadata: { ...user.user_metadata, role: 'teacher' }
        })

        if (updateError) {
          results.teachers.errors.push(`${teacher.full_name}: ${updateError.message}`)
        } else {
          results.teachers.fixed++
          console.log(`✅ Fixed teacher: ${teacher.full_name} (${teacher.email})`)
        }
      } catch (e) {
        results.teachers.errors.push(`${teacher.full_name}: ${e.message}`)
      }
    }

    // Fix students
    const { data: students, error: studentsError } = await supabaseClient
      .from('students')
      .select('id, full_name, email, auth_user_id')
      .not('auth_user_id', 'is', null)

    if (studentsError) {
      throw new Error(`Failed to fetch students: ${studentsError.message}`)
    }

    for (const student of students || []) {
      try {
        const { data: { user }, error: getUserError } = await supabaseClient.auth.admin.getUserById(student.auth_user_id)

        if (getUserError || !user) {
          results.students.errors.push(`${student.full_name}: user not found`)
          continue
        }

        if (user.user_metadata?.role === 'student') {
          results.students.skipped++
          continue
        }

        const { error: updateError } = await supabaseClient.auth.admin.updateUserById(student.auth_user_id, {
          user_metadata: { ...user.user_metadata, role: 'student' }
        })

        if (updateError) {
          results.students.errors.push(`${student.full_name}: ${updateError.message}`)
        } else {
          results.students.fixed++
          console.log(`✅ Fixed student: ${student.full_name} (${student.email})`)
        }
      } catch (e) {
        results.students.errors.push(`${student.full_name}: ${e.message}`)
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )
  }
})
