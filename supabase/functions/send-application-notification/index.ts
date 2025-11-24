import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL') || 'admin@alfalaah.edu'

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
    const { data: application, error } = await supabaseClient
      .from('applications')
      .select('*')
      .eq('id', applicationId)
      .single()

    if (error || !application) {
      throw new Error('Application not found')
    }

    // Send email to admin
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Al-Falaah Institute <noreply@alfalaah.edu>',
        to: [ADMIN_EMAIL],
        subject: `New Application: ${application.full_name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #059669;">New Application Received</h2>

            <p>A new student application has been submitted and requires your review.</p>

            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Applicant Information</h3>

              <p><strong>Full Name:</strong> ${application.full_name}</p>
              <p><strong>Email:</strong> ${application.email}</p>
              <p><strong>Phone:</strong> ${application.phone}</p>
              <p><strong>Date of Birth:</strong> ${application.date_of_birth ? new Date(application.date_of_birth).toLocaleDateString() : 'Not provided'}</p>
              <p><strong>Gender:</strong> ${application.gender || 'Not provided'}</p>
            </div>

            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Islamic Background</h3>

              <p><strong>Can Read Quran:</strong> ${application.can_read_quran ? 'Yes' : 'No'}</p>
              ${application.can_read_quran && application.tajweed_level ? `<p><strong>Tajweed Level:</strong> ${application.tajweed_level}</p>` : ''}
              <p><strong>Studied Arabic:</strong> ${application.has_studied_arabic ? 'Yes' : 'No'}</p>
              ${application.has_studied_arabic && application.arabic_level ? `<p><strong>Arabic Level:</strong> ${application.arabic_level}</p>` : ''}
            </div>

            ${application.motivation ? `
              <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Motivation & Goals</h3>
                <p style="white-space: pre-wrap;">${application.motivation}</p>
              </div>
            ` : ''}

            <div style="margin: 30px 0;">
              <p><strong>Submitted:</strong> ${new Date(application.submitted_at).toLocaleString()}</p>
            </div>

            <div style="margin: 30px 0;">
              <a href="${Deno.env.get('APP_URL') || 'https://alfalaah.edu'}/admin"
                 style="display: inline-block; background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                Review Application in Admin Dashboard
              </a>
            </div>

            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="font-size: 12px; color: #6b7280;">
              This is an automated notification. You can manage this application from your admin dashboard.
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
      JSON.stringify({ success: true, message: 'Admin notification sent successfully' }),
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
