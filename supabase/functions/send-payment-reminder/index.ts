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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get all pending payments with due dates in the past
    const today = new Date().toISOString().split('T')[0]

    const { data: overduePayments, error } = await supabaseClient
      .from('payments')
      .select(`
        *,
        students (
          full_name,
          email,
          student_id,
          balance_remaining
        )
      `)
      .eq('status', 'pending')
      .lt('due_date', today)
      .not('students', 'is', null)

    if (error) {
      throw new Error(`Failed to fetch overdue payments: ${error.message}`)
    }

    if (!overduePayments || overduePayments.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No overdue payments found', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Group payments by student
    const paymentsByStudent = overduePayments.reduce((acc, payment) => {
      const studentEmail = payment.students.email
      if (!acc[studentEmail]) {
        acc[studentEmail] = {
          student: payment.students,
          payments: []
        }
      }
      acc[studentEmail].payments.push(payment)
      return acc
    }, {})

    // Send reminder emails
    const emailPromises = Object.values(paymentsByStudent).map(async ({ student, payments }) => {
      const totalOverdue = payments.reduce((sum, p) => sum + p.amount, 0)
      const oldestPayment = payments.sort((a, b) =>
        new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      )[0]

      const daysOverdue = Math.floor(
        (new Date().getTime() - new Date(oldestPayment.due_date).getTime()) / (1000 * 60 * 60 * 24)
      )

      return fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'Al-Falaah Institute <noreply@alfalaah.edu>',
          to: [student.email],
          subject: 'Payment Reminder - Al-Falaah Islamic Institute',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #dc2626;">Payment Reminder</h2>

              <p>Dear ${student.full_name},</p>

              <p>This is a friendly reminder that you have <strong>${payments.length}</strong> overdue payment(s).</p>

              <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; border-left: 4px solid #dc2626; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #dc2626;">Overdue Summary</h3>
                <p><strong>Total Overdue Amount:</strong> $${totalOverdue.toFixed(2)}</p>
                <p><strong>Oldest Payment Due:</strong> ${new Date(oldestPayment.due_date).toLocaleDateString()} (${daysOverdue} days ago)</p>
                <p><strong>Current Balance:</strong> $${student.balance_remaining.toFixed(2)}</p>
              </div>

              <h3>Overdue Payments:</h3>
              <ul style="list-style: none; padding: 0;">
                ${payments.map(p => `
                  <li style="background-color: #f9fafb; padding: 12px; margin: 8px 0; border-radius: 6px;">
                    <strong>$${p.amount.toFixed(2)}</strong> - Year ${p.academic_year}, Due: ${new Date(p.due_date).toLocaleDateString()}
                  </li>
                `).join('')}
              </ul>

              <div style="margin: 30px 0; padding: 20px; background-color: #ecfdf5; border-radius: 8px;">
                <h3 style="margin-top: 0; color: #059669;">How to Pay</h3>
                <p>Please submit your payment and upload the proof at:</p>
                <p><a href="${Deno.env.get('APP_URL') || 'https://alfalaah.edu'}/payment"
                      style="display: inline-block; background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">
                  Upload Payment Proof
                </a></p>
              </div>

              <p>If you have already made the payment, please upload your proof of payment as soon as possible.</p>

              <p>If you are experiencing financial difficulties, please contact us to discuss payment arrangements.</p>

              <p style="margin-top: 30px;">Best regards,<br>Al-Falaah Islamic Institute</p>

              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
              <p style="font-size: 12px; color: #6b7280;">
                This is an automated reminder. Please do not reply to this email.
              </p>
            </div>
          `,
        }),
      })
    })

    await Promise.all(emailPromises)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Sent ${emailPromises.length} reminder emails`,
        count: emailPromises.length
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
