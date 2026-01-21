import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'
import { PROGRAMS, PROGRAM_IDS, getProgram, isValidProgram, getPriceCents } from '../_shared/programs.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, planType, program } = await req.json() // program: 'essentials' or 'tajweed' (optional)

    if (!email || !planType) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get student details by email (works for both new and existing students)
    const { data: student, error: studentError } = await supabaseClient
      .from('students')
      .select('*')
      .eq('email', email)
      .single()

    if (studentError || !student) {
      console.error('Student lookup error:', studentError)
      return new Response(
        JSON.stringify({ error: `No student found for: ${email}` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2023-10-16',
    })

    // Create or get Stripe customer
    let customerId = student.stripe_customer_id

    // Try to verify existing customer or create new one
    if (customerId) {
      try {
        // Verify the customer exists in Stripe
        await stripe.customers.retrieve(customerId)
        console.log('Using existing Stripe customer:', customerId)
      } catch (error) {
        // Customer doesn't exist (wrong account, deleted, etc.)
        console.warn('Invalid Stripe customer ID, creating new:', error.message)
        customerId = null
      }
    }

    if (!customerId) {
      // Create new customer
      const customer = await stripe.customers.create({
        email: student.email,
        name: student.full_name,
        metadata: {
          student_id: student.id,
          student_number: student.student_id || 'pending',
        },
      })
      customerId = customer.id
      console.log('Created new Stripe customer:', customerId)

      // Save customer ID to database
      await supabaseClient
        .from('students')
        .update({ stripe_customer_id: customerId })
        .eq('id', student.id)
    }

    const appUrl = Deno.env.get('APP_URL') || 'https://tftmadrasah.nz'
    const currentProgram = program || PROGRAM_IDS.ESSENTIALS

    // Validate program
    if (!isValidProgram(currentProgram)) {
      return new Response(
        JSON.stringify({ error: `Invalid program: ${currentProgram}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get program config
    const programConfig = getProgram(currentProgram)!
    const priceCents = getPriceCents(currentProgram, planType)

    // Create checkout session based on plan type and program
    const sessionConfig: any = {
      customer: customerId,
      line_items: [],
      mode: planType === 'monthly' ? 'subscription' : 'payment',
      success_url: `${appUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}&program=${currentProgram}`,
      cancel_url: `${appUrl}/student`, // Redirect to student portal on cancel
      metadata: {
        student_id: student.id,
        plan_type: planType,
        program: currentProgram,
      },
    }

    // Program-specific pricing using centralized config
    if (programConfig.pricing.type === 'one-time') {
      // One-time payment program (e.g., Tajweed)
      sessionConfig.line_items.push({
        price_data: {
          currency: programConfig.pricing.currency.toLowerCase(),
          product_data: {
            name: `The FastTrack Madrasah - ${programConfig.name}`,
            description: programConfig.description,
          },
          unit_amount: priceCents,
        },
        quantity: 1,
      })
    } else {
      // Subscription program (e.g., Essentials)
      if (planType === 'monthly') {
        // Monthly subscription
        sessionConfig.line_items.push({
          price_data: {
            currency: programConfig.pricing.currency.toLowerCase(),
            product_data: {
              name: `The FastTrack Madrasah - ${programConfig.shortName} Monthly`,
              description: programConfig.description,
            },
            unit_amount: priceCents,
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        })
      } else {
        // Annual one-time payment
        sessionConfig.line_items.push({
          price_data: {
            currency: programConfig.pricing.currency.toLowerCase(),
            product_data: {
              name: `The FastTrack Madrasah - ${programConfig.shortName} Annual`,
              description: `${programConfig.description} (Year 1)`,
            },
            unit_amount: priceCents,
          },
          quantity: 1,
        })
      }
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
