// @ts-nocheck — Deno edge function (URL imports + Deno global are valid)
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { PROGRAMS, getProgram } from '../_shared/programs.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function generateVerificationCode(programId: string, studentName: string): string {
  const prefix = programId.toUpperCase()
  const year = new Date().getFullYear()
  const initials = studentName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 3)
  const random = Math.random().toString(16).slice(2, 6).toUpperCase()
  return `${prefix}-${year}-${initials}-${random}`
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify the requesting user is admin/director
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check admin role
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!adminProfile || !['madrasah_admin', 'director'].includes(adminProfile.role)) {
      return new Response(
        JSON.stringify({ error: 'Only admins can issue certificates' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { studentId, programId } = await req.json()

    if (!studentId || !programId) {
      return new Response(
        JSON.stringify({ error: 'Missing studentId or programId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if certificate already exists
    const { data: existing } = await supabase
      .from('certificates')
      .select('id, verification_code')
      .eq('student_id', studentId)
      .eq('program_id', programId)
      .single()

    if (existing) {
      return new Response(
        JSON.stringify({ error: 'Certificate already issued', certificate: existing }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get student info
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('full_name, auth_user_id')
      .eq('auth_user_id', studentId)
      .single()

    if (studentError || !student) {
      return new Response(
        JSON.stringify({ error: 'Student not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get program config
    const program = getProgram(programId)
    if (!program) {
      return new Response(
        JSON.stringify({ error: 'Invalid program' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get test settings for weight calculation
    const { data: settings } = await supabase
      .from('program_test_settings')
      .select('milestone_test_weight, final_exam_weight')
      .eq('program_id', programId)
      .single()

    const milestoneWeight = settings?.milestone_test_weight ?? 50
    const examWeight = settings?.final_exam_weight ?? 50

    // Calculate milestone average from completed tests
    const { data: milestoneAttempts } = await supabase
      .from('test_attempts')
      .select('percentage')
      .eq('student_id', studentId)
      .eq('program_id', programId)
      .eq('type', 'milestone')
      .eq('status', 'completed')

    let milestoneAvg = 0
    if (milestoneAttempts && milestoneAttempts.length > 0) {
      const sum = milestoneAttempts.reduce((acc: number, a: any) => acc + Number(a.percentage), 0)
      milestoneAvg = sum / milestoneAttempts.length
    }

    // Get final exam score
    const { data: examAttempt } = await supabase
      .from('test_attempts')
      .select('percentage')
      .eq('student_id', studentId)
      .eq('program_id', programId)
      .eq('type', 'final_exam')
      .eq('status', 'completed')
      .order('percentage', { ascending: false })
      .limit(1)
      .single()

    const examScore = examAttempt ? Number(examAttempt.percentage) : 0

    // Calculate weighted total
    const weightedTotal = (milestoneAvg * milestoneWeight / 100) + (examScore * examWeight / 100)

    // Get teacher name
    const { data: assignment } = await supabase
      .from('teacher_assignments')
      .select('teachers(full_name)')
      .eq('student_id', studentId)
      .eq('program_id', programId)
      .limit(1)
      .single()

    const teacherName = (assignment as any)?.teachers?.full_name || null

    // Generate unique verification code
    const verificationCode = generateVerificationCode(programId, student.full_name)

    // Insert certificate
    const { data: certificate, error: insertError } = await supabase
      .from('certificates')
      .insert({
        student_id: studentId,
        program_id: programId,
        student_name: student.full_name,
        verification_code: verificationCode,
        milestone_average: Math.round(milestoneAvg * 100) / 100,
        final_exam_score: Math.round(examScore * 100) / 100,
        weighted_total: Math.round(weightedTotal * 100) / 100,
        teacher_name: teacherName,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      return new Response(
        JSON.stringify({ error: 'Failed to issue certificate', details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, certificate }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Certificate error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
