// Edge Function: Send Welcome Email
// Triggered when student completes enrollment

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

function generateEmailHTML(studentData: any, baseUrl: string): string {
  const { full_name, email, student_number, program_type } = studentData;

  // Currently only offering the 2-year program
  const programName = '2-Year Essential Islamic Studies Course';

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
          <h1>Welcome to Al-Falaah Academy</h1>
          <p>Your Journey Begins Now</p>
        </div>

        <div class="content">
          <h2>Assalaamu 'alaykum ${full_name},</h2>

          <p>Welcome to Al-Falaah Academy! We are thrilled to have you join our community of learners.</p>

          <div class="info-box">
            <h3>Your Enrollment Details</h3>
            <table>
              <tr>
                <td class="label">Student ID:</td>
                <td><strong>${student_number}</strong></td>
              </tr>
              <tr>
                <td class="label">Email:</td>
                <td>${email}</td>
              </tr>
              <tr>
                <td class="label">Program:</td>
                <td>${programName}</td>
              </tr>
              <tr>
                <td class="label">Status:</td>
                <td>Active</td>
              </tr>
            </table>
          </div>

          <p><strong>What You Can Do Now:</strong></p>
          <ul>
            <li>Access your student dashboard at any time</li>
            <li>View your payment schedule</li>
            <li>Download lesson materials (once available)</li>
            <li>Track your attendance and progress</li>
            <li>Update your profile information</li>
          </ul>

          <center>
            <a href="${baseUrl}/dashboard" class="button">Go to Dashboard →</a>
          </center>

          <p><strong>Important Reminders:</strong></p>
          <ul>
            <li>Check your payment schedule in the dashboard</li>
            <li>Complete payments before the due dates</li>
            <li>Attend all scheduled classes</li>
            <li>Keep your contact information up to date</li>
          </ul>

          <p>If you have any questions or need support, please don't hesitate to reach out to us at <a href="mailto:admin@alfalaah-academy.nz">admin@alfalaah-academy.nz</a>.</p>

          <p>May Allah make this journey beneficial for you and grant you success in your studies.</p>

          <p>Best regards,<br>
          <strong>Al-Falaah Team</strong></p>
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
    const { studentData, baseUrl } = await req.json();

    if (!studentData || !studentData.email || !studentData.full_name) {
      return new Response(
        JSON.stringify({ error: 'Missing required student data' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const appUrl = baseUrl || Deno.env.get('APP_URL') || 'http://localhost:5173';
    const emailHTML = generateEmailHTML(studentData, appUrl);

    const result = await sendEmail({
      to: studentData.email,
      subject: 'Welcome to Al-Falaah Academy!',
      html: emailHTML,
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to send email');
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Welcome email sent' }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Error in send-welcome-email:', error);
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
