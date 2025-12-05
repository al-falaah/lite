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

    // Verify webhook signature (using async method for Deno)
    const event = webhookSecret
      ? await stripe.webhooks.constructEventAsync(body, signature, webhookSecret)
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
      const program = session.metadata.program || 'essentials' // Get program from metadata

      console.log(`Payment successful for student ${studentId}, plan: ${planType}, program: ${program}`)

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

      // If student is pending_payment, generate student ID and update status
      if (student.status === 'pending_payment') {
        // Generate random 6-digit numeric student ID using database function
        const { data: idResult, error: idError } = await supabaseClient
          .rpc('generate_random_student_id')

        if (idError || !idResult) {
          console.error('Failed to generate unique student ID:', idError)
          throw new Error('Failed to generate unique student ID')
        }

        const generatedStudentId = idResult
        console.log(`Generated random student ID: ${generatedStudentId}`)

        // Update student status and Stripe customer ID
        const { error: updateError } = await supabaseClient
          .from('students')
          .update({
            student_id: generatedStudentId,
            status: 'enrolled',
            stripe_customer_id: session.customer || null,
          })
          .eq('id', studentId)

        if (updateError) {
          console.error('Error updating student:', updateError)
        } else {
          console.log('Student enrolled:', studentId, 'with ID:', generatedStudentId)
        }
      }

      // Create enrollment for this program
      const { data: enrollment, error: enrollmentError } = await supabaseClient
        .rpc('create_enrollment', {
          p_student_id: studentId,
          p_program: program,
          p_payment_type: planType,
          p_application_id: null,
        })

      if (enrollmentError) {
        console.error('Error creating enrollment:', enrollmentError)
        return new Response('Error creating enrollment', { status: 500 })
      }

      console.log('Enrollment created:', enrollment)

      // Update enrollment with Stripe subscription ID
      if (session.subscription) {
        const { error: subError } = await supabaseClient
          .from('enrollments')
          .update({ stripe_subscription_id: session.subscription })
          .eq('id', enrollment)

        if (subError) {
          console.error('Error updating enrollment subscription:', subError)
        }
      }

      // Determine payment amount
      const amount = planType === 'monthly' ? 25 : (planType === 'annual' ? 275 : 120)

      // Create payment record linked to enrollment
      const { error: paymentError } = await supabaseClient
        .from('payments')
        .insert({
          student_id: studentId,
          enrollment_id: enrollment,
          amount: amount,
          payment_method: 'stripe',
          status: 'verified',
          academic_year: 1,
          stripe_payment_id: session.payment_intent,
          stripe_subscription_id: session.subscription || null,
          verified_at: new Date().toISOString(),
        })

      if (paymentError) {
        console.error('Error creating payment record:', paymentError)
      } else {
        console.log('Payment record created for enrollment:', enrollment)
      }

      // Send welcome email if new student
      if (student.status === 'pending_payment') {
        try {
          const appUrl = Deno.env.get('APP_URL') || 'https://alfalaah-academy.nz'
          await supabaseClient.functions.invoke('send-welcome-email', {
            body: {
              studentData: {
                full_name: student.full_name,
                email: student.email,
                student_number: student.student_id,
                program_type: program,
              },
              baseUrl: appUrl,
            },
          })
          console.log('Welcome email sent')
        } catch (emailError) {
          console.error('Error sending welcome email:', emailError)
        }
      }
    }

    // Handle subscription updates (monthly recurring payments)
    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object

      if (invoice.subscription) {
        // Find enrollment by subscription ID
        const { data: enrollment, error: enrollmentError } = await supabaseClient
          .from('enrollments')
          .select('*, students(*)')
          .eq('stripe_subscription_id', invoice.subscription)
          .single()

        if (enrollmentError) {
          console.error('Enrollment not found for subscription:', invoice.subscription, enrollmentError)
          return new Response('Enrollment not found', { status: 404 })
        }

        if (enrollment) {
          console.log('Processing payment for enrollment:', enrollment.id, 'program:', enrollment.program)

          // Record the payment linked to this enrollment
          const { error: paymentError } = await supabaseClient
            .from('payments')
            .insert({
              student_id: enrollment.student_id,
              enrollment_id: enrollment.id,
              amount: invoice.amount_paid / 100, // Convert from cents
              payment_method: 'stripe',
              status: 'verified',
              academic_year: 1, // You may want to calculate this based on payment history
              stripe_payment_id: invoice.payment_intent,
              stripe_subscription_id: invoice.subscription,
              verified_at: new Date().toISOString(),
            })

          if (paymentError) {
            console.error('Error recording payment:', paymentError)
          } else {
            console.log('Subscription payment recorded for enrollment:', enrollment.id)
            // The database trigger will automatically update total_paid and balance_remaining
          }
        }
      }
    }

    // Handle subscription cancellations (student dropout)
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object

      console.log('Subscription canceled:', subscription.id)

      // Find enrollment by subscription ID
      const { data: enrollment, error: enrollmentError } = await supabaseClient
        .from('enrollments')
        .select('*, students(*)')
        .eq('stripe_subscription_id', subscription.id)
        .single()

      if (enrollmentError) {
        console.error('Enrollment not found for subscription:', subscription.id, enrollmentError)
        return new Response('Enrollment not found', { status: 404 })
      }

      if (enrollment) {
        console.log('Marking enrollment as withdrawn (dropout):', enrollment.id)

        // Update enrollment status to withdrawn (dropout)
        const { error: updateError } = await supabaseClient
          .from('enrollments')
          .update({
            status: 'withdrawn',
            updated_at: new Date().toISOString(),
          })
          .eq('id', enrollment.id)

        if (updateError) {
          console.error('Error updating enrollment status:', updateError)
        } else {
          console.log('Enrollment marked as withdrawn. Student will need to reapply to rejoin.')

          // Note: Schedules will automatically be hidden in the frontend
          // because we filter by enrollment status = 'active'
          // If student wants to rejoin, they must reapply and create a new enrollment
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
