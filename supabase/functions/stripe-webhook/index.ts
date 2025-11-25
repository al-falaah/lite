import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16',
})

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return new Response('No signature', { status: 400 })
  }

  try {
    const body = await req.text()
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

    // Verify webhook signature
    const event = webhookSecret
      ? stripe.webhooks.constructEvent(body, signature, webhookSecret)
      : JSON.parse(body)

    console.log('Webhook event:', event.type)

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Handle successful payment
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object

      const studentId = session.metadata.student_id
      const planType = session.metadata.plan_type

      console.log(`Payment successful for student ${studentId}, plan: ${planType}`)

      // Get student details
      const { data: student, error: studentError } = await supabaseClient
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single()

      if (studentError || !student) {
        console.error('Student not found:', studentId)
        return new Response('Student not found', { status: 404 })
      }

      // Determine payment amount and academic year
      const amount = planType === 'monthly' ? 25 : 275
      const academicYear = 1 // First year payment

      // Create payment record
      const { error: paymentError } = await supabaseClient
        .from('payments')
        .insert({
          student_id: studentId,
          amount: amount,
          payment_method: 'stripe',
          status: 'verified',
          academic_year: academicYear,
          stripe_payment_id: session.payment_intent,
          stripe_subscription_id: session.subscription || null,
          verified_at: new Date().toISOString(),
        })

      if (paymentError) {
        console.error('Error creating payment record:', paymentError)
      }

      // If student is pending_payment, generate student ID and enroll them
      if (student.status === 'pending_payment') {
        // Generate random 6-digit student ID: STU-NNNNNN
        let generatedStudentId = ''
        let isUnique = false
        let attempts = 0
        const maxAttempts = 10

        while (!isUnique && attempts < maxAttempts) {
          // Generate random 6-digit number (100000 to 999999)
          const randomNumber = Math.floor(100000 + Math.random() * 900000)
          generatedStudentId = `STU-${randomNumber}`

          // Check if this ID already exists
          const { data: existingStudent } = await supabaseClient
            .from('students')
            .select('id')
            .eq('student_id', generatedStudentId)
            .single()

          if (!existingStudent) {
            isUnique = true
          }
          attempts++
        }

        if (!isUnique) {
          console.error('Failed to generate unique student ID after', maxAttempts, 'attempts')
          throw new Error('Failed to generate unique student ID')
        }

        console.log(`Generated random student ID: ${generatedStudentId}`)

        const { error: updateError } = await supabaseClient
          .from('students')
          .update({
            student_id: generatedStudentId,
            status: 'enrolled',
            stripe_subscription_id: session.subscription || null,
          })
          .eq('id', studentId)

        if (updateError) {
          console.error('Error enrolling student:', updateError)
        } else {
          console.log('Student enrolled:', studentId, 'with ID:', generatedStudentId)

          // Send welcome email with the newly generated student ID
          try {
            const appUrl = Deno.env.get('APP_URL') || 'https://alfalaah-academy.nz'
            await supabaseClient.functions.invoke('send-welcome-email', {
              body: {
                studentData: {
                  full_name: student.full_name,
                  email: student.email,
                  student_number: generatedStudentId,
                  program_type: 'essentials',
                },
                baseUrl: appUrl,
              },
            })
            console.log('Welcome email sent with student ID:', generatedStudentId)
          } catch (emailError) {
            console.error('Error sending welcome email:', emailError)
          }
        }
      }
    }

    // Handle subscription updates
    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object

      if (invoice.subscription) {
        // Find student by subscription ID
        const { data: student } = await supabaseClient
          .from('students')
          .select('*')
          .eq('stripe_subscription_id', invoice.subscription)
          .single()

        if (student) {
          // Record the payment
          await supabaseClient
            .from('payments')
            .insert({
              student_id: student.id,
              amount: invoice.amount_paid / 100, // Convert from cents
              payment_method: 'stripe',
              status: 'verified',
              academic_year: 1, // Determine based on payment history
              stripe_payment_id: invoice.payment_intent,
              stripe_subscription_id: invoice.subscription,
              verified_at: new Date().toISOString(),
            })

          console.log('Subscription payment recorded for student:', student.id)
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
