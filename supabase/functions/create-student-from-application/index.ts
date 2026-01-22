import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getProgram } from '../_shared/programs.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { applicationId } = await req.json()

    if (!applicationId) {
      return new Response(
        JSON.stringify({ error: 'Application ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get application details
    const { data: application, error: appError } = await supabaseClient
      .from('applications')
      .select('*')
      .eq('id', applicationId)
      .single()

    if (appError || !application) {
      throw new Error('Application not found')
    }

    if (application.status !== 'approved') {
      throw new Error('Only approved applications can be converted to students')
    }

    // Get program from application
    const program = application.program || 'essentials'
    console.log(`Processing application for program: ${program}`)

    // Check if student already exists with this email
    const { data: existingStudent } = await supabaseClient
      .from('students')
      .select('*')
      .eq('email', application.email)
      .single()

    let student
    let isNewStudent = false

    if (existingStudent) {
      console.log('Student already exists:', existingStudent.student_id)
      student = existingStudent

      // Check if they already have an enrollment for this program
      const { data: existingEnrollment } = await supabaseClient
        .from('enrollments')
        .select('*')
        .eq('student_id', student.id)
        .eq('program', program)
        .single()

      if (existingEnrollment) {
        const programConfig = getProgram(program)
        const programName = programConfig ? `${programConfig.name} (${programConfig.shortName})` : program
        return new Response(
          JSON.stringify({
            success: false,
            error: `Student is already enrolled in ${programName}`,
            student: student,
            enrollment: existingEnrollment
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log(`Creating new ${program} enrollment for existing student`)
    } else {
      // Note: Student ID and password will be generated AFTER payment, not before
      // Students who haven't paid yet don't get credentials
      console.log('Creating new student record')

      // Create student record without student_id and password (will be set after payment)
      const { data: newStudent, error: studentError } = await supabaseClient
        .from('students')
        .insert({
          student_id: null, // Will be assigned after payment (6-digit random number)
          password: null, // Will be generated after payment
          full_name: application.full_name,
          email: application.email,
          phone: application.phone,
          date_of_birth: application.date_of_birth,
          gender: application.gender,
          application_id: application.id,
          status: 'pending_payment', // Will be changed to 'enrolled' after Stripe payment
          enrolled_date: new Date().toISOString().split('T')[0],
          // Copy availability preferences from application
          preferred_days: application.preferred_days,
          preferred_times: application.preferred_times,
          timezone: application.timezone || 'Pacific/Auckland',
          availability_notes: application.availability_notes
        })
        .select()
        .single()

      if (studentError) {
        console.error('Error creating student:', studentError)
        throw new Error('Failed to create student record')
      }

      student = newStudent
      isNewStudent = true
      console.log('Student created successfully')
    }

    // Note: Enrollment will be created by Stripe webhook AFTER successful payment
    // Do NOT create enrollment here - student must pay first
    console.log(`Student created with pending_payment status. Enrollment for ${program} will be created after payment.`)

    // Send payment instructions to applicant (not welcome email yet - that comes after payment)
    console.log('Sending payment instructions to:', student.email)
    const appUrl = Deno.env.get('APP_URL') || 'http://localhost:5173'

    try {
      const emailResponse = await supabaseClient.functions.invoke('send-payment-instructions', {
        body: {
          applicantData: {
            full_name: student.full_name,
            email: student.email,
            student_id: null, // No student ID until payment
            password: null, // No password until payment
            program: program // Pass program for program-aware email
          },
          appUrl: appUrl
        }
      })

      if (emailResponse.error) {
        console.error('Failed to send payment instructions:', emailResponse.error)
        // Don't throw - student is created, email is non-critical
      } else {
        console.log('Payment instructions sent successfully')
      }
    } catch (emailError) {
      console.error('Error sending payment instructions:', emailError)
      // Don't throw - student is created, email is non-critical
    }

    const programConfig = getProgram(program)
    const programDisplayName = programConfig ? `${programConfig.name} (${programConfig.shortName})` : program
    const message = isNewStudent
      ? `Student created for ${programDisplayName}. Payment instructions sent.`
      : `Existing student will be enrolled in ${programDisplayName} after payment.`

    return new Response(
      JSON.stringify({
        success: true,
        message: message,
        student: student,
        program: program,
        isNewStudent: isNewStudent,
        note: 'Student created with pending_payment status. Student ID and password will be generated after payment. Enrollment will be created after successful Stripe payment.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
