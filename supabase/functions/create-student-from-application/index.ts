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

    // Check if student already exists with this email
    const { data: existingStudent } = await supabaseClient
      .from('students')
      .select('*')
      .eq('email', application.email)
      .single()

    if (existingStudent) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Student already exists',
          student: existingStudent
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate student ID
    const year = new Date().getFullYear()
    const { count } = await supabaseClient
      .from('students')
      .select('id', { count: 'exact', head: true })

    const studentNumber = String((count || 0) + 1).padStart(5, '0')
    const studentId = `STU-${year}-${studentNumber}`

    // Create student record
    const { data: student, error: studentError } = await supabaseClient
      .from('students')
      .insert({
        student_id: studentId,
        full_name: application.full_name,
        email: application.email,
        phone: application.phone,
        date_of_birth: application.date_of_birth,
        gender: application.gender,
        application_id: application.id,
        status: 'pending_payment', // Will be changed to 'enrolled' after Stripe payment
        enrolled_date: new Date().toISOString().split('T')[0],
        total_fees: 600.00, // Monthly: $25/month x 24 months OR Annual: $275/year x 2 years ($550)
        installments_per_year: null, // Not used with Stripe - payments handled via Stripe
        total_paid: 0,
        balance_remaining: 600.00
      })
      .select()
      .single()

    if (studentError) {
      console.error('Error creating student:', studentError)
      throw new Error('Failed to create student record')
    }

    // Note: With Stripe integration, payments are handled automatically
    // No need to generate installments - Stripe handles monthly/annual subscriptions

    // Send payment instructions to applicant (not welcome email yet - that comes after payment)
    console.log('Sending payment instructions to:', student.email)
    const appUrl = Deno.env.get('APP_URL') || 'http://localhost:5173'

    try {
      const emailResponse = await supabaseClient.functions.invoke('send-payment-instructions', {
        body: {
          applicantData: {
            full_name: student.full_name,
            email: student.email,
            student_id: student.student_id
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

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Student created successfully',
        student: student
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
