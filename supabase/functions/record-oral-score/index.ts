// @ts-nocheck — Deno edge function (URL imports + Deno global are valid)
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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Authenticate user (must be a teacher)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { student_id, program_id, type, milestone_index, percentage, notes } = await req.json()

    // Validate required fields
    if (!student_id || !program_id || !type || percentage === undefined || percentage === null) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: student_id, program_id, type, percentage' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (type !== 'milestone' && type !== 'final_exam') {
      return new Response(
        JSON.stringify({ error: 'Invalid type. Must be "milestone" or "final_exam"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (type === 'milestone' && (milestone_index === undefined || milestone_index === null)) {
      return new Response(
        JSON.stringify({ error: 'milestone_index is required for milestone type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (percentage < 0 || percentage > 100) {
      return new Response(
        JSON.stringify({ error: 'Percentage must be between 0 and 100' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify the teacher is assigned to this student
    const { data: teacher } = await supabase
      .from('teachers')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    if (!teacher) {
      return new Response(
        JSON.stringify({ error: 'Teacher record not found' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: assignment } = await supabase
      .from('teacher_student_assignments')
      .select('id')
      .eq('teacher_id', teacher.id)
      .eq('student_id', student_id)
      .eq('status', 'assigned')
      .single()

    if (!assignment) {
      return new Response(
        JSON.stringify({ error: 'You are not assigned to this student' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Resolve students.id → auth_user_id (test_attempts.student_id references auth.users)
    const { data: studentRecord } = await supabase
      .from('students')
      .select('auth_user_id')
      .eq('id', student_id)
      .single()

    if (!studentRecord?.auth_user_id) {
      return new Response(
        JSON.stringify({ error: 'Student auth record not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const authStudentId = studentRecord.auth_user_id

    // Verify the test mode is "oral" for this milestone/exam
    const { data: settings } = await supabase
      .from('program_test_settings')
      .select('*')
      .eq('program_id', program_id)
      .single()

    const testModes = settings?.milestone_test_modes || {}
    const modeKey = type === 'final_exam' ? 'final_exam' : String(milestone_index)
    const mode = testModes[modeKey] || 'online'

    if (mode !== 'oral') {
      return new Response(
        JSON.stringify({ error: 'This test is not configured as an oral test' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check for existing oral attempt for this milestone/exam
    let query = supabase
      .from('test_attempts')
      .select('*')
      .eq('student_id', authStudentId)
      .eq('program_id', program_id)
      .eq('type', type)
      .eq('is_oral', true)

    if (type === 'milestone') {
      query = query.eq('milestone_index', milestone_index)
    }

    const { data: existingAttempts } = await query

    // Milestone oral scores are final — reject if already graded
    if (type === 'milestone' && existingAttempts && existingAttempts.length > 0) {
      return new Response(
        JSON.stringify({ error: 'This milestone oral test has already been graded and cannot be changed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // For final exam, check retake limits
    if (type === 'final_exam' && existingAttempts && existingAttempts.length > 0) {
      const maxAttempts = settings?.allow_exam_retake ? 1 + (settings?.max_exam_retakes || 1) : 1
      if (existingAttempts.length >= maxAttempts) {
        return new Response(
          JSON.stringify({ error: 'Maximum exam attempts reached' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Insert new oral attempt
    const now = new Date().toISOString()
    let attemptId: string

    const insertData: any = {
      student_id: authStudentId,
      program_id,
      type,
      milestone_index: type === 'milestone' ? milestone_index : null,
      question_ids: [],
      score: Math.round(percentage),
      total_questions: 100,
      percentage,
      answers: {},
      status: 'completed',
      is_oral: true,
      graded_by: user.id,
      oral_notes: notes || null,
      started_at: now,
      completed_at: now,
      time_limit_minutes: 0,
    }

    const { data: inserted, error: insertError } = await supabase
      .from('test_attempts')
      .insert(insertData)
      .select('id')
      .single()

    if (insertError) {
      return new Response(
        JSON.stringify({ error: 'Failed to record oral score: ' + insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    attemptId = inserted.id

    // Recalculate student_program_results
    await recalculateResults(supabase, authStudentId, program_id, settings)

    return new Response(
      JSON.stringify({
        success: true,
        attempt_id: attemptId,
        percentage,
        message: `Oral ${type === 'final_exam' ? 'exam' : 'test'} score recorded successfully`,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in record-oral-score:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function recalculateResults(
  supabase: any,
  studentId: string,
  programId: string,
  settings: any
) {
  // Get all completed attempts for this student+program
  const { data: allAttempts } = await supabase
    .from('test_attempts')
    .select('*')
    .eq('student_id', studentId)
    .eq('program_id', programId)
    .in('status', ['completed', 'timed_out'])
    .order('completed_at', { ascending: false })

  if (!allAttempts || allAttempts.length === 0) return

  // Milestone scores: best score per milestone
  const milestoneScores: Record<string, number> = {}
  const milestoneAttempts = allAttempts.filter((a: any) => a.type === 'milestone')
  milestoneAttempts.forEach((a: any) => {
    const key = String(a.milestone_index)
    if (!(key in milestoneScores) || a.percentage > milestoneScores[key]) {
      milestoneScores[key] = a.percentage
    }
  })

  // Final exam: best score
  const examAttempts = allAttempts.filter((a: any) => a.type === 'final_exam')
  const bestExamScore = examAttempts.length > 0
    ? Math.max(...examAttempts.map((a: any) => a.percentage))
    : null

  // Calculate milestone average
  const milestoneValues = Object.values(milestoneScores) as number[]
  const milestoneAverage = milestoneValues.length > 0
    ? milestoneValues.reduce((sum, v) => sum + v, 0) / milestoneValues.length
    : null

  // Calculate weighted total
  const milestoneWeight = settings?.milestone_test_weight || 50
  const examWeight = settings?.final_exam_weight || 50
  const passMark = settings?.pass_mark || 50

  let weightedTotal: number | null = null
  let status = 'in_progress'

  if (milestoneAverage !== null && bestExamScore !== null) {
    weightedTotal = (milestoneAverage * milestoneWeight / 100) + (bestExamScore * examWeight / 100)
    status = weightedTotal >= passMark ? 'passed' : 'failed'
  }

  const { error } = await supabase
    .from('student_program_results')
    .upsert({
      student_id: studentId,
      program_id: programId,
      milestone_scores: milestoneScores,
      milestone_average: milestoneAverage,
      final_exam_score: bestExamScore,
      final_exam_attempts: examAttempts.length,
      weighted_total: weightedTotal,
      status,
      computed_at: new Date().toISOString()
    }, {
      onConflict: 'student_id,program_id'
    })

  if (error) {
    console.error('Error upserting results:', error)
  }
}
