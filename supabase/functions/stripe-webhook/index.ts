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

      // Track if this is a new student to send welcome email
      const isNewStudent = student.status === 'pending_payment'

      // If student is pending_payment, generate student ID, password and update status
      if (isNewStudent) {
        // Generate random 6-digit numeric student ID using database function
        const { data: idResult, error: idError } = await supabaseClient
          .rpc('generate_random_student_id')

        if (idError || !idResult) {
          console.error('Failed to generate unique student ID:', idError)
          throw new Error('Failed to generate unique student ID')
        }

        const generatedStudentId = idResult
        console.log(`Generated random student ID: ${generatedStudentId}`)

        // Generate temporary password (8 characters: mix of letters and numbers)
        const generatePassword = () => {
          const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Removed similar-looking chars
          let password = ''
          for (let i = 0; i < 8; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length))
          }
          return password
        }

        const generatedPassword = generatePassword()
        console.log('Generated temporary password for student:', generatedPassword)

        // Create Supabase Auth user with email and generated password
        console.log('Creating Supabase Auth user...')
        const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
          email: student.email,
          password: generatedPassword,
          email_confirm: true, // Auto-confirm email
          user_metadata: {
            full_name: student.full_name,
            student_id: generatedStudentId,
            role: 'student',
            first_login: true,
          },
        })

        if (authError || !authData.user) {
          console.error('Failed to create Supabase Auth user:', authError)
          throw new Error('Failed to create authentication user')
        }

        console.log('✅ Supabase Auth user created:', authData.user.id)

        // Update student record with student_id, auth_user_id, and status
        console.log('Updating student record...', { studentId, generatedStudentId, authUserId: authData.user.id })
        const { error: updateError } = await supabaseClient
          .from('students')
          .update({
            student_id: generatedStudentId,
            auth_user_id: authData.user.id,
            status: 'enrolled',
            stripe_customer_id: session.customer || null,
          })
          .eq('id', studentId)

        if (updateError) {
          console.error('ERROR: Failed to update student:', updateError)
          console.error('Update error details:', JSON.stringify(updateError, null, 2))
          return new Response(JSON.stringify({ error: 'Failed to update student status' }), { status: 500 })
        } else {
          console.log('✅ Student enrolled successfully:', studentId, 'with ID:', generatedStudentId)
          // Update the student object with the new credentials
          student.student_id = generatedStudentId
          student.password = generatedPassword
          student.status = 'enrolled'
        }
      }

      // Find the application for this student and program
      const { data: application } = await supabaseClient
        .from('applications')
        .select('id')
        .eq('email', student.email)
        .eq('program', program)
        .eq('status', 'approved')
        .single()

      const applicationId = application?.id || null

      // Create enrollment for this program
      const { data: enrollment, error: enrollmentError } = await supabaseClient
        .rpc('create_enrollment', {
          p_student_id: studentId,
          p_program: program,
          p_payment_type: planType,
          p_application_id: applicationId,
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
      const amount = planType === 'monthly' ? 35 : (planType === 'annual' ? 375 : 120)

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
      if (isNewStudent) {
        try {
          const appUrl = Deno.env.get('APP_URL') || 'https://tftmadrasah.nz'
          const supabaseUrl = Deno.env.get('SUPABASE_URL')
          const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

          console.log('Sending welcome email to:', student.email)
          console.log('Student data:', {
            full_name: student.full_name,
            email: student.email,
            student_id: student.student_id,
            program: program,
          })

          const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-welcome-email`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${serviceRoleKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              studentData: {
                full_name: student.full_name,
                email: student.email,
                student_id: student.student_id,
                program: program,
                password: student.password,
              },
              baseUrl: appUrl,
            }),
          })

          const emailResult = await emailResponse.json()

          if (!emailResponse.ok) {
            console.error('❌ Welcome email failed:', emailResult)
            throw new Error(emailResult.error || 'Failed to send welcome email')
          }

          console.log('✅ Welcome email sent successfully to:', student.email)
        } catch (emailError) {
          console.error('❌ Error sending welcome email:', emailError)
          // Don't throw - enrollment is complete, email is non-critical
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

    // Handle subscription cancellations - FLAG for admin review instead of auto-withdraw
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
        console.log('Flagging enrollment for admin review (subscription canceled):', enrollment.id)

        // Add admin note flagging the subscription cancellation
        const cancellationNote = `[${new Date().toISOString()}] SUBSCRIPTION CANCELED - Student canceled Stripe subscription. Needs admin review for withdrawal/dropout.`
        const existingNotes = enrollment.admin_notes || ''
        const updatedNotes = existingNotes
          ? `${existingNotes}\n\n${cancellationNote}`
          : cancellationNote

        // Update enrollment with admin note - DO NOT auto-withdraw
        const { error: updateError } = await supabaseClient
          .from('enrollments')
          .update({
            admin_notes: updatedNotes,
            updated_at: new Date().toISOString(),
          })
          .eq('id', enrollment.id)

        if (updateError) {
          console.error('Error flagging enrollment:', updateError)
        } else {
          console.log('Enrollment flagged for admin review. Status remains active until admin manually withdraws.')

          // TODO: Send notification to admin dashboard
          // Admin will need to manually review and decide whether to:
          // 1. Mark as withdrawn/dropout
          // 2. Contact student for payment arrangement
          // 3. Other action
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
