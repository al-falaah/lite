import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const ADMIN_EMAIL = 'admin@alfalaah-academy.nz'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Determine time period (last 12 hours for twice-daily digests)
    const now = new Date()
    const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000)

    // Get NZ time to determine if it's morning or evening
    const nzHour = parseInt(new Date().toLocaleString('en-US', {
      timeZone: 'Pacific/Auckland',
      hour: 'numeric',
      hour12: false
    }))
    const isPM = nzHour >= 12
    const digestType = isPM ? 'Evening' : 'Morning'

    // Format NZ date and time for display
    const nzDateStr = new Date().toLocaleDateString('en-NZ', {
      timeZone: 'Pacific/Auckland',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    const nzTimeStr = new Date().toLocaleTimeString('en-NZ', {
      timeZone: 'Pacific/Auckland',
      hour: '2-digit',
      minute: '2-digit'
    })

    // Get new applications in the last 12 hours
    const { data: newApplications, error: appError } = await supabaseClient
      .from('applications')
      .select('*')
      .gte('created_at', twelveHoursAgo.toISOString())
      .order('created_at', { ascending: false })

    if (appError) {
      console.error('Error fetching applications:', appError)
    }

    // Get new payment uploads in the last 12 hours
    const { data: newPayments, error: paymentError } = await supabaseClient
      .from('payments')
      .select(`
        *,
        student:students(full_name, student_id)
      `)
      .gte('created_at', twelveHoursAgo.toISOString())
      .eq('status', 'pending_verification')
      .order('created_at', { ascending: false })

    if (paymentError) {
      console.error('Error fetching payments:', paymentError)
    }

    const applicationCount = newApplications?.length || 0
    const paymentCount = newPayments?.length || 0

    // Only send email if there's something to report
    if (applicationCount === 0 && paymentCount === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No new activity to report',
          skipped: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate email HTML
    const emailHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 700px; margin: 0 auto; }
          .header { background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 30px; text-align: center; }
          .content { background: white; padding: 30px; }
          .summary-box { display: flex; gap: 20px; margin: 20px 0; }
          .stat-card { flex: 1; background: #f9fafb; border-left: 4px solid #059669; padding: 20px; text-align: center; }
          .stat-number { font-size: 36px; font-weight: bold; color: #059669; }
          .stat-label { font-size: 14px; color: #6b7280; text-transform: uppercase; }
          .section { margin: 30px 0; }
          .section-title { font-size: 18px; font-weight: 600; color: #111827; margin-bottom: 15px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
          .item { background: #f9fafb; padding: 15px; margin-bottom: 10px; border-radius: 6px; }
          .item-title { font-weight: 600; color: #059669; margin-bottom: 5px; }
          .item-detail { font-size: 14px; color: #6b7280; margin: 5px 0; }
          .button { display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          .badge { display: inline-block; padding: 4px 8px; background: #fef3c7; color: #92400e; border-radius: 4px; font-size: 12px; font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${digestType} Digest</h1>
            <p>${nzDateStr}</p>
            <p style="font-size: 14px; opacity: 0.9;">${nzTimeStr} NZ Time</p>
          </div>

          <div class="content">
            <div class="summary-box">
              <div class="stat-card">
                <div class="stat-number">${applicationCount}</div>
                <div class="stat-label">New Application${applicationCount !== 1 ? 's' : ''}</div>
              </div>
              <div class="stat-card">
                <div class="stat-number">${paymentCount}</div>
                <div class="stat-label">Payment${paymentCount !== 1 ? 's' : ''} to Verify</div>
              </div>
            </div>

            ${applicationCount > 0 ? `
              <div class="section">
                <div class="section-title">New Applications</div>
                ${newApplications.map(app => `
                  <div class="item">
                    <div class="item-title">${app.full_name}</div>
                    <div class="item-detail">Email: ${app.email}</div>
                    <div class="item-detail">Phone: ${app.phone}</div>
                    <div class="item-detail">
                      <span class="badge">${app.status.toUpperCase()}</span>
                      • Submitted: ${new Date(app.created_at).toLocaleString('en-NZ')}
                    </div>
                    <div class="item-detail">
                      Can Read Quran: ${app.can_read_quran ? 'Yes' : 'No'}
                      ${app.can_read_quran && app.tajweed_level ? `(${app.tajweed_level})` : ''}
                    </div>
                    <div class="item-detail">
                      Studied Arabic: ${app.has_studied_arabic ? 'Yes' : 'No'}
                      ${app.has_studied_arabic && app.arabic_level ? `(${app.arabic_level})` : ''}
                    </div>
                  </div>
                `).join('')}
              </div>
            ` : ''}

            ${paymentCount > 0 ? `
              <div class="section">
                <div class="section-title">Payments Awaiting Verification</div>
                ${newPayments.map(payment => `
                  <div class="item">
                    <div class="item-title">${payment.student?.full_name || 'Unknown Student'} (${payment.student?.student_id || 'N/A'})</div>
                    <div class="item-detail">Amount: $${payment.amount?.toFixed(2) || '0.00'}</div>
                    <div class="item-detail">Payment Date: ${payment.payment_date ? new Date(payment.payment_date).toLocaleDateString('en-NZ') : 'Not specified'}</div>
                    <div class="item-detail">Method: ${payment.payment_method || 'Not specified'}</div>
                    <div class="item-detail">
                      <span class="badge">PENDING VERIFICATION</span>
                      • Uploaded: ${new Date(payment.created_at).toLocaleString('en-NZ')}
                    </div>
                  </div>
                `).join('')}
              </div>
            ` : ''}

            <center>
              <a href="${Deno.env.get('APP_URL') || 'https://alfalaah-academy.nz'}/admin" class="button">
                Go to Admin Dashboard →
              </a>
            </center>

            <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
              This is your automated ${digestType.toLowerCase()} digest. You'll receive these updates twice daily (morning and evening) when there's new activity.
            </p>
          </div>

          <div class="footer">
            <p>© ${new Date().getFullYear()} Al-Falaah Academy • New Zealand</p>
            <p>This is an automated digest from your admin system</p>
          </div>
        </div>
      </body>
      </html>
    `

    // Send email via Resend
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Al-Falaah Admin <noreply@alfalaah-academy.nz>',
        to: [ADMIN_EMAIL],
        subject: `${digestType} Digest: ${applicationCount} New Application${applicationCount !== 1 ? 's' : ''}, ${paymentCount} Payment${paymentCount !== 1 ? 's' : ''} to Review`,
        html: emailHTML,
      }),
    })

    if (!emailRes.ok) {
      const error = await emailRes.text()
      throw new Error(`Failed to send email: ${error}`)
    }

    const emailData = await emailRes.json()
    console.log('Digest email sent:', emailData.id)

    return new Response(
      JSON.stringify({
        success: true,
        message: `${digestType} digest sent successfully`,
        stats: {
          applications: applicationCount,
          payments: paymentCount,
          emailId: emailData.id
        }
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
