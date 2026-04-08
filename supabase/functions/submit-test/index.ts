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

    // Authenticate user
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

    const { attempt_id, answers } = await req.json()

    if (!attempt_id || !answers) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: attempt_id, answers' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch the attempt and verify ownership
    const { data: attempt, error: attemptError } = await supabase
      .from('test_attempts')
      .select('*')
      .eq('id', attempt_id)
      .eq('student_id', user.id)
      .single()

    if (attemptError || !attempt) {
      return new Response(
        JSON.stringify({ error: 'Test attempt not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (attempt.status !== 'in_progress') {
      return new Response(
        JSON.stringify({ error: 'Test already submitted' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check time limit
    const elapsed = (Date.now() - new Date(attempt.started_at).getTime()) / 60000
    const timedOut = elapsed > attempt.time_limit_minutes + 1 // 1 min grace period

    // Fetch correct answers for the assigned questions
    const { data: questionData, error: qError } = await supabase
      .from('test_questions')
      .select('id, correct_answer, question_type, explanation')
      .in('id', attempt.question_ids)

    if (qError || !questionData) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch answers for grading' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Grade the test
    const correctAnswerMap: Record<string, { correct_answer: string; question_type: string; explanation: string }> = {}
    questionData.forEach(q => {
      correctAnswerMap[q.id] = {
        correct_answer: q.correct_answer,
        question_type: q.question_type,
        explanation: q.explanation || ''
      }
    })

    let correctCount = 0
    const gradedAnswers: Record<string, { selected: string; is_correct: boolean }> = {}

    for (const [questionId, selectedAnswer] of Object.entries(answers)) {
      const correctInfo = correctAnswerMap[questionId]
      if (!correctInfo) continue

      let isCorrect = false
      if (correctInfo.question_type === 'short_answer') {
        // Case-insensitive comparison, trimmed
        isCorrect = (selectedAnswer as string).trim().toLowerCase() === correctInfo.correct_answer.trim().toLowerCase()
      } else {
        // MCQ or true_false — exact letter match
        isCorrect = selectedAnswer === correctInfo.correct_answer
      }

      if (isCorrect) correctCount++
      gradedAnswers[questionId] = { selected: selectedAnswer as string, is_correct: isCorrect }
    }

    const totalQuestions = attempt.question_ids.length
    const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 10000) / 100 : 0

    // Update the attempt
    const { error: updateError } = await supabase
      .from('test_attempts')
      .update({
        score: correctCount,
        total_questions: totalQuestions,
        percentage,
        answers: gradedAnswers,
        status: timedOut ? 'timed_out' : 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', attempt_id)

    if (updateError) {
      return new Response(
        JSON.stringify({ error: 'Failed to save results' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get test settings for review preferences
    const { data: settings } = await supabase
      .from('program_test_settings')
      .select('*')
      .eq('program_id', attempt.program_id)
      .single()

    // Recalculate student_program_results
    await recalculateResults(supabase, user.id, attempt.program_id, settings)

    // Build review data based on admin settings
    const reviewData = attempt.question_ids.map((qid: string) => {
      const qa = correctAnswerMap[qid]
      const answer = gradedAnswers[qid]
      const review: any = {
        question_id: qid,
        selected: answer?.selected || null,
        is_correct: answer?.is_correct || false,
      }
      if (settings?.show_wrong_answers && !answer?.is_correct) {
        review.your_answer = answer?.selected
      }
      if (settings?.show_correct_answers) {
        review.correct_answer = qa?.correct_answer
      }
      if (settings?.show_explanations && qa?.explanation) {
        review.explanation = qa.explanation
      }
      return review
    })

    return new Response(
      JSON.stringify({
        score: correctCount,
        total_questions: totalQuestions,
        percentage,
        status: timedOut ? 'timed_out' : 'completed',
        review: reviewData,
        show_correct_answers: settings?.show_correct_answers || false,
        show_wrong_answers: settings?.show_wrong_answers || true,
        show_explanations: settings?.show_explanations || true,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in submit-test:', error)
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

  // Final exam: best score (for retakes)
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

  // Upsert results
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
