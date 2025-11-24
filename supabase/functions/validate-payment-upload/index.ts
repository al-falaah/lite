import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Use service role key to bypass RLS for server-side operations
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get the uploaded file from form data
    const formData = await req.formData()
    const file = formData.get('file') as File
    const studentId = formData.get('student_id') as string
    const amount = formData.get('amount') as string
    const academicYear = formData.get('academic_year') as string
    const studentNotes = formData.get('student_notes') as string

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Server-side validation: File type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      return new Response(
        JSON.stringify({
          error: 'Invalid file type. Only JPG, PNG, and PDF files are allowed.'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Server-side validation: File size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB in bytes
    if (file.size > maxSize) {
      return new Response(
        JSON.stringify({
          error: 'File size exceeds 5MB limit.'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate student exists and get balance
    const { data: student, error: studentError } = await supabaseClient
      .from('students')
      .select('id, student_id, balance_remaining, total_fees')
      .eq('id', studentId)
      .single()

    if (studentError || !student) {
      return new Response(
        JSON.stringify({ error: 'Student record not found. Please contact admin.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate payment amount
    const paymentAmount = parseFloat(amount)
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Please enter a valid payment amount.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if student has any balance remaining
    if (student.balance_remaining <= 0) {
      return new Response(
        JSON.stringify({
          error: 'You have no outstanding balance. All payments have been completed.'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if amount exceeds remaining balance
    if (paymentAmount > student.balance_remaining) {
      return new Response(
        JSON.stringify({
          error: `Payment amount exceeds your remaining balance. Please enter a lower amount.`
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Upload file to storage
    const fileName = `${student.student_id}_${Date.now()}_${file.name}`
    const filePath = `payment-proofs/${fileName}`

    const { error: uploadError } = await supabaseClient.storage
      .from('payment-documents')
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return new Response(
        JSON.stringify({ error: 'Failed to upload file' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseClient.storage
      .from('payment-documents')
      .getPublicUrl(filePath)

    // Create payment record
    const { data: payment, error: paymentError } = await supabaseClient
      .from('payments')
      .insert({
        student_id: studentId,
        amount: parseFloat(amount),
        payment_method: 'bank_transfer',
        status: 'pending',
        academic_year: parseInt(academicYear),
        proof_url: publicUrl,
        proof_uploaded_at: new Date().toISOString(),
        student_notes: studentNotes || null,
      })
      .select()
      .single()

    if (paymentError) {
      console.error('Payment record error:', paymentError)
      // Clean up uploaded file
      await supabaseClient.storage
        .from('payment-documents')
        .remove([filePath])

      return new Response(
        JSON.stringify({
          error: 'Failed to create payment record. Please contact admin.',
          details: paymentError.message || 'Unknown error'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        payment,
        message: 'Payment proof uploaded successfully!'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
