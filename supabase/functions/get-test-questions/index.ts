import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Fisher-Yates shuffle
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
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

    // Get the requesting user from the auth header
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

    const { program_id, type, milestone_index } = await req.json()

    if (!program_id || !type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: program_id, type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (type === 'milestone' && (milestone_index === null || milestone_index === undefined)) {
      return new Response(
        JSON.stringify({ error: 'milestone_index required for milestone tests' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify student has an active enrollment in this program
    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('email', user.email)
      .single()

    if (!student) {
      return new Response(
        JSON.stringify({ error: 'Student record not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id, status')
      .eq('student_id', student.id)
      .eq('program', program_id)
      .eq('status', 'active')
      .single()

    if (!enrollment) {
      return new Response(
        JSON.stringify({ error: 'No active enrollment found for this program' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check for in-progress attempt (resume if exists)
    const attemptQuery = supabase
      .from('test_attempts')
      .select('*')
      .eq('student_id', user.id)
      .eq('program_id', program_id)
      .eq('type', type)
      .eq('status', 'in_progress')

    if (type === 'milestone') {
      attemptQuery.eq('milestone_index', milestone_index)
    } else {
      attemptQuery.is('milestone_index', null)
    }

    const { data: existingAttempt } = await attemptQuery.single()

    if (existingAttempt) {
      // Check if timed out
      const elapsed = (Date.now() - new Date(existingAttempt.started_at).getTime()) / 60000
      if (elapsed >= existingAttempt.time_limit_minutes) {
        // Mark as timed out
        await supabase
          .from('test_attempts')
          .update({ status: 'timed_out', completed_at: new Date().toISOString() })
          .eq('id', existingAttempt.id)
      } else {
        // Resume — fetch the questions that were assigned
        const { data: assignedQuestions } = await supabase
          .from('test_questions')
          .select('id, question_text, question_type, options, difficulty, section_tag')
          .in('id', existingAttempt.question_ids)

        // Maintain original order
        const orderedQuestions = existingAttempt.question_ids
          .map((qid: string) => assignedQuestions?.find((q: any) => q.id === qid))
          .filter(Boolean)

        return new Response(
          JSON.stringify({
            attempt_id: existingAttempt.id,
            questions: orderedQuestions,
            started_at: existingAttempt.started_at,
            time_limit_minutes: existingAttempt.time_limit_minutes,
            answers: existingAttempt.answers || {},
            resumed: true
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // For milestone tests, check if already completed successfully
    if (type === 'milestone') {
      const { data: completedAttempt } = await supabase
        .from('test_attempts')
        .select('id')
        .eq('student_id', user.id)
        .eq('program_id', program_id)
        .eq('type', 'milestone')
        .eq('milestone_index', milestone_index)
        .eq('status', 'completed')
        .limit(1)
        .single()

      if (completedAttempt) {
        return new Response(
          JSON.stringify({ error: 'Milestone test already completed', already_completed: true }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // For final exam, check retake limits
    if (type === 'final_exam') {
      const { data: settings } = await supabase
        .from('program_test_settings')
        .select('allow_exam_retake, max_exam_retakes')
        .eq('program_id', program_id)
        .single()

      const { count: completedCount } = await supabase
        .from('test_attempts')
        .select('id', { count: 'exact', head: true })
        .eq('student_id', user.id)
        .eq('program_id', program_id)
        .eq('type', 'final_exam')
        .eq('status', 'completed')

      const maxAttempts = (settings?.allow_exam_retake && settings?.max_exam_retakes)
        ? 1 + settings.max_exam_retakes  // 1 original + retakes
        : 1

      if ((completedCount || 0) >= maxAttempts) {
        return new Response(
          JSON.stringify({ error: 'Maximum exam attempts reached', max_reached: true }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Get test settings
    const { data: settings } = await supabase
      .from('program_test_settings')
      .select('*')
      .eq('program_id', program_id)
      .single()

    // Check if this test is configured as oral (not online)
    const testModes = settings?.milestone_test_modes || {}
    const modeKey = type === 'final_exam' ? 'final_exam' : String(milestone_index)
    const testMode = testModes[modeKey] || 'online'

    if (testMode === 'oral') {
      return new Response(
        JSON.stringify({ error: 'This test is an oral test and must be graded by your teacher', is_oral: true }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const questionCount = type === 'milestone'
      ? (settings?.milestone_question_count || 25)
      : (settings?.exam_question_count || 50)

    const timeLimit = type === 'milestone'
      ? (settings?.milestone_time_limit || 40)
      : (settings?.exam_time_limit || 120)

    // Fetch questions from the bank
    let questionsQuery = supabase
      .from('test_questions')
      .select('id, question_text, question_type, options, difficulty, section_tag')
      .eq('program_id', program_id)
      .eq('type', type)

    if (type === 'milestone') {
      questionsQuery = questionsQuery.eq('milestone_index', milestone_index)
    }

    const { data: allQuestions, error: questionsError } = await questionsQuery

    if (questionsError) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch questions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!allQuestions || allQuestions.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No questions available for this test' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Randomly select questions
    const shuffled = shuffle(allQuestions)
    const selected = shuffled.slice(0, Math.min(questionCount, shuffled.length))
    const questionIds = selected.map(q => q.id)

    // Create attempt record
    const attemptData: any = {
      student_id: user.id,
      program_id,
      type,
      milestone_index: type === 'milestone' ? milestone_index : null,
      question_ids: questionIds,
      total_questions: selected.length,
      status: 'in_progress',
      time_limit_minutes: timeLimit,
      started_at: new Date().toISOString()
    }

    const { data: attempt, error: attemptError } = await supabase
      .from('test_attempts')
      .insert(attemptData)
      .select()
      .single()

    if (attemptError) {
      return new Response(
        JSON.stringify({ error: 'Failed to create test attempt' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Return questions WITHOUT correct answers
    const safeQuestions = selected.map(({ id, question_text, question_type, options, difficulty, section_tag }) => ({
      id, question_text, question_type, options, difficulty, section_tag
    }))

    return new Response(
      JSON.stringify({
        attempt_id: attempt.id,
        questions: safeQuestions,
        started_at: attempt.started_at,
        time_limit_minutes: timeLimit,
        answers: {},
        resumed: false
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in get-test-questions:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
