import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { paymentId } = await req.json()

    if (!paymentId) {
      return new Response(
        JSON.stringify({ error: 'Payment ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get payment and student details
    const { data: payment, error: paymentError } = await supabaseClient
      .from('payments')
      .select(`
        *,
        students (
          id,
          full_name,
          email,
          student_id,
          balance_remaining,
          status
        )
      `)
      .eq('id', paymentId)
      .single()

    if (paymentError || !payment) {
      throw new Error('Payment not found')
    }

    const isFirstPayment = payment.students.status === 'pending_payment'
    const appUrl = Deno.env.get('APP_URL') || 'https://alfalaah-academy.nz'

    // If this is the first payment, enroll the student
    if (isFirstPayment) {
      console.log('First payment verified - enrolling student:', payment.students.student_id)

      const { error: updateError } = await supabaseClient
        .from('students')
        .update({ status: 'enrolled' })
        .eq('id', payment.students.id)

      if (updateError) {
        console.error('Error updating student status:', updateError)
        // Don't throw - continue with email
      } else {
        console.log('Student enrolled successfully')
      }

      // Send welcome email for first payment
      try {
        const welcomeResponse = await supabaseClient.functions.invoke('send-welcome-email', {
          body: {
            studentData: {
              full_name: payment.students.full_name,
              email: payment.students.email,
              student_number: payment.students.student_id,
              program_type: 'essentials'
            },
            baseUrl: appUrl
          }
        })

        if (welcomeResponse.error) {
          console.error('Failed to send welcome email:', welcomeResponse.error)
        } else {
          console.log('Welcome email sent successfully')
        }
      } catch (emailError) {
        console.error('Error sending welcome email:', emailError)
      }

      // Return success for first payment (welcome email already sent)
      return new Response(
        JSON.stringify({ success: true, message: 'Student enrolled and welcome email sent' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Send email using Resend
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Al-Falaah Academy <noreply@alfalaah-academy.nz>',
        to: [payment.students.email],
        subject: 'Payment Verified - Al-Falaah Academy',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #059669;">Payment Verified ✓</h2>

            <p>Dear ${payment.students.full_name},</p>

            <p>We are pleased to confirm that your payment has been successfully verified.</p>

            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Payment Details</h3>
              <p><strong>Amount:</strong> $${payment.amount.toFixed(2)}</p>
              <p><strong>Academic Year:</strong> Year ${payment.academic_year}</p>
              <p><strong>Payment Date:</strong> ${new Date(payment.verified_at).toLocaleDateString()}</p>
              <p><strong>Remaining Balance:</strong> $${payment.students.balance_remaining.toFixed(2)}</p>
            </div>

            <p>Thank you for your prompt payment. If you have any questions, please don't hesitate to contact us.</p>

            <p style="margin-top: 30px;">Best regards,<br>Al-Falaah Academy</p>

            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="font-size: 12px; color: #6b7280;">
              This is an automated message. Please do not reply to this email.
            </p>
          </div>
        `,
      }),
    })

    if (!emailRes.ok) {
      const error = await emailRes.text()
      throw new Error(`Failed to send email: ${error}`)
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Email sent successfully' }),
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
