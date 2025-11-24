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
        status: 'enrolled',
        enrolled_date: new Date().toISOString().split('T')[0],
        total_fees: 600.00, // $300/year x 2 years
        installments_per_year: 4, // Students can pay in up to 4 installments per year
        total_paid: 0,
        balance_remaining: 600.00
      })
      .select()
      .single()

    if (studentError) {
      console.error('Error creating student:', studentError)
      throw new Error('Failed to create student record')
    }

    // Generate payment installments using helper function
    // Default to 4 installments per year (students can pay full year upfront or in up to 4 installments)
    const { error: installmentsError } = await supabaseClient
      .rpc('generate_installment_payments', {
        p_student_id: student.id,
        p_installments_per_year: 4
      })

    if (installmentsError) {
      console.error('Error generating installments:', installmentsError)
      throw new Error('Failed to generate payment installments')
    }

    // Send welcome/approval email to student
    console.log('Sending approval email to:', student.email)
    const appUrl = Deno.env.get('APP_URL') || 'http://localhost:5173'

    try {
      const emailResponse = await supabaseClient.functions.invoke('send-welcome-email', {
        body: {
          studentData: {
            full_name: student.full_name,
            email: student.email,
            student_number: student.student_id,
            program_type: 'essentials' // 2-year program
          },
          baseUrl: appUrl
        }
      })

      if (emailResponse.error) {
        console.error('Failed to send approval email:', emailResponse.error)
        // Don't throw - student is created, email is non-critical
      } else {
        console.log('Approval email sent successfully')
      }
    } catch (emailError) {
      console.error('Error sending approval email:', emailError)
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
