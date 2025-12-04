// Edge Function: Send Application Confirmation Email
// Triggered when a new application is submitted

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
  table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
  .label { font-weight: 600; color: #6b7280; }
`;

function generateEmailHTML(applicantData: any): string {
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
          <h1>Al-Falaah Academy</h1>
          <p>Application Received</p>
        </div>

        <div class="content">
          <h2>Assalaamu 'alaykum ${full_name},</h2>

          <p>Thank you for your interest in Al-Falaah Academy. We have received your application for the <strong>2-Year Essential Arabic & Islamic Studies Course</strong> and will review it shortly.</p>

          <div class="info-box">
            <h3>Application Summary</h3>
            <table>
              <tr>
                <td class="label">Name:</td>
                <td>${full_name}</td>
              </tr>
              <tr>
                <td class="label">Email:</td>
                <td>${email}</td>
              </tr>
              <tr>
                <td class="label">Program:</td>
                <td>2-Year Essential Arabic & Islamic Studies Course</td>
              </tr>
              <tr>
                <td class="label">Learning Format:</td>
                <td>Personalized One-on-One</td>
              </tr>
              <tr>
                <td class="label">Option 1 - Monthly:</td>
                <td>$25 NZD/month (auto-renewing)</td>
              </tr>
              <tr>
                <td class="label">Option 2 - Annual:</td>
                <td>$275 NZD/year (save $25!)</td>
              </tr>
              <tr>
                <td class="label">Total (2 years):</td>
                <td>Monthly: $600 | Annual: $550</td>
              </tr>
            </table>
          </div>

          <p><strong>What happens next?</strong></p>
          <ol>
            <li>Our admissions team will review your application</li>
            <li>Once approved, you'll receive an approval notification email and payment instructions</li>
            <li>After payment you'll be enrolled as a student, then you can begin your personalized learning journey</li>
          </ol>

          <p>If you have any questions, please don't hesitate to contact us at <a href="mailto:admin@alfalaah-academy.nz">admin@alfalaah-academy.nz</a>.</p>

          <p>May Allah bless your journey of seeking knowledge.</p>

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
    const { applicantData } = await req.json();

    if (!applicantData || !applicantData.email || !applicantData.full_name) {
      return new Response(
        JSON.stringify({ error: 'Missing required applicant data' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const emailHTML = generateEmailHTML(applicantData);

    const result = await sendEmail({
      to: applicantData.email,
      subject: 'Application Received - Al-Falaah Academy',
      html: emailHTML,
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to send email');
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Confirmation email sent' }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Error in send-application-confirmation:', error);
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
