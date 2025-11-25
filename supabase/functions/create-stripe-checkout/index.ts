import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { studentId, planType } = await req.json() // planType: 'monthly' or 'annual'

    if (!studentId || !planType) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get student details
    const { data: student, error: studentError } = await supabaseClient
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single()

    if (studentError || !student) {
      return new Response(
        JSON.stringify({ error: 'Student not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2023-10-16',
    })

    // Create or get Stripe customer
    let customerId = student.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: student.email,
        name: student.full_name,
        metadata: {
          student_id: student.id,
          student_number: student.student_id,
        },
      })
      customerId = customer.id

      // Save customer ID
      await supabaseClient
        .from('students')
        .update({ stripe_customer_id: customerId })
        .eq('id', studentId)
    }

    const appUrl = Deno.env.get('APP_URL') || 'https://alfalaah-academy.nz'

    // Create checkout session based on plan type
    const sessionConfig: any = {
      customer: customerId,
      line_items: [],
      mode: planType === 'monthly' ? 'subscription' : 'payment',
      success_url: `${appUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/payment`,
      metadata: {
        student_id: student.id,
        plan_type: planType,
      },
    }

    if (planType === 'monthly') {
      // Monthly subscription: $25/month
      sessionConfig.line_items.push({
        price_data: {
          currency: 'nzd',
          product_data: {
            name: 'Al-Falaah Academy - Monthly Subscription',
            description: '2-Year Essential Islamic Studies Course',
          },
          unit_amount: 2500, // $25 in cents
          recurring: {
            interval: 'month',
          },
        },
        quantity: 1,
      })
    } else {
      // Annual one-time payment: $275
      sessionConfig.line_items.push({
        price_data: {
          currency: 'nzd',
          product_data: {
            name: 'Al-Falaah Academy - Annual Payment',
            description: '2-Year Essential Islamic Studies Course (Year 1)',
          },
          unit_amount: 27500, // $275 in cents
        },
        quantity: 1,
      })
    }

    const session = await stripe.checkout.sessions.create(sessionConfig)

    return new Response(
      JSON.stringify({
        success: true,
        checkout_url: session.url,
        session_id: session.id,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error creating checkout:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
