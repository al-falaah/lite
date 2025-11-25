// Edge Function: Send Payment Instructions Email
// Triggered when application is approved

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { sendEmail } from '../_shared/email.ts';

const EMAIL_STYLES = `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
  .header { background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
  .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
  .button { display: inline-block; background: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
  .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
  .info-box { background: #f0fdf4; border-left: 4px solid #059669; padding: 15px; margin: 20px 0; }
  .highlight-box { background: #fef3c7; border: 2px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 8px; }
  table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
  .label { font-weight: 600; color: #6b7280; }
`;

function generateEmailHTML(applicantData: any, appUrl: string): string {
  const { full_name, email } = applicantData;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>${EMAIL_STYLES}</style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Application Approved!</h1>
          <p>Al-Falaah Academy</p>
        </div>

        <div class="content">
          <h2>Assalaamu 'alaykum ${full_name},</h2>

          <p>Congratulations! Your application to Al-Falaah Academy has been approved. We are excited to welcome you to our community of learners.</p>

          <div class="highlight-box">
            <h3 style="margin-top: 0; color: #92400e;">📋 Next Step: Payment</h3>
            <p style="margin-bottom: 0;">Choose your payment plan and complete your enrollment instantly with Stripe.</p>
          </div>

          <div class="info-box">
            <h3>Choose Your Payment Plan</h3>
            <table>
              <tr>
                <td class="label">Program:</td>
                <td>2-Year Essential Islamic Studies Course</td>
              </tr>
              <tr>
                <td class="label">Option 1 - Monthly:</td>
                <td><strong>$25 NZD/month</strong> (auto-renewing)</td>
              </tr>
              <tr>
                <td class="label">Option 2 - Annual:</td>
                <td><strong>$275 NZD/year</strong> (save $25!)</td>
              </tr>
              <tr>
                <td class="label">Total (2 years):</td>
                <td>Monthly: $600 | Annual: $550</td>
              </tr>
            </table>
          </div>

          <div class="info-box" style="background: #e0f2fe; border-color: #0284c7;">
            <h3>✨ Instant Enrollment with Stripe</h3>
            <p style="margin-bottom: 10px;">Pay securely online and get enrolled immediately:</p>
            <ul style="margin: 0; padding-left: 20px;">
              <li>Secure payment processing by Stripe</li>
              <li>Instant enrollment confirmation</li>
              <li>Automatic welcome email with student details</li>
              <li>Choose monthly or annual payment</li>
            </ul>
          </div>

          <center>
            <a href="${appUrl}/payment?email=${encodeURIComponent(email)}" class="button" style="font-size: 18px; padding: 16px 40px;">
              💳 Choose Payment Plan & Pay Now →
            </a>
          </center>

          <p style="margin-top: 30px; font-size: 14px; color: #6b7280; text-align: center;">
            Secure payment powered by <strong>Stripe</strong> • No credit card fees • Instant enrollment
          </p>

          <p>If you have any questions about payment, please don't hesitate to contact us at <a href="mailto:admin@alfalaah-academy.nz">admin@alfalaah-academy.nz</a>.</p>

          <p>We look forward to having you in our academy!</p>

          <p>Best regards,<br>
          <strong>Al-Falaah Admissions Team</strong></p>
        </div>

        <div class="footer">
          <p>© ${new Date().getFullYear()} Al-Falaah Academy. All rights reserved.</p>
          <p>New Zealand</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const { applicantData, appUrl } = await req.json();

    if (!applicantData || !applicantData.email || !applicantData.full_name) {
      return new Response(
        JSON.stringify({ error: 'Missing required applicant data' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const baseUrl = appUrl || Deno.env.get('APP_URL') || 'https://alfalaah-academy.nz';
    const emailHTML = generateEmailHTML(applicantData, baseUrl);

    const result = await sendEmail({
      to: applicantData.email,
      subject: '🎉 Application Approved - Payment Instructions',
      html: emailHTML,
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to send email');
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Payment instructions email sent' }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Error in send-payment-instructions:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});
