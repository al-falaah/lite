// Edge Function: Send Welcome Email
// Triggered when student completes enrollment

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { sendEmail } from '../_shared/email.ts';
import { EMAIL_STYLES, getHeaderHTML, getFooterHTML } from '../_shared/email-template.ts';

function generateEmailHTML(studentData: any, baseUrl: string): string {
  const { full_name, email, student_id, program, password } = studentData;

  // Determine program name based on program field
  const programName = program === 'tajweed'
    ? 'Tajweed Program'
    : 'Essential Arabic & Islamic Studies Program';

  const programDuration = program === 'tajweed' ? '6 months' : '2 years';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>${EMAIL_STYLES}</style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="container">
          ${getHeaderHTML('Welcome to The FastTrack Madrasah', 'Your journey of knowledge begins now')}

          <div class="content">
            <h2 class="greeting">As-salāmu ʿalaykum ${full_name},</h2>

            <p class="paragraph">Welcome to The FastTrack Madrasah! We are thrilled to have you join our community of dedicated learners on the path of authentic Islamic knowledge.</p>

            <div class="info-box">
              <div class="info-box-title">Your Enrollment Details</div>
              <table>
                <tr>
                  <td class="label">Student ID</td>
                  <td class="value" style="color: #059669; font-size: 18px; font-weight: 700; font-family: monospace;">${student_id}</td>
                </tr>
                <tr>
                  <td class="label">Program</td>
                  <td class="value"><strong>${programName}</strong></td>
                </tr>
                <tr>
                  <td class="label">Duration</td>
                  <td class="value">${programDuration}</td>
                </tr>
                <tr>
                  <td class="label">Status</td>
                  <td class="value" style="color: #059669; font-weight: 700;">✓ Active</td>
                </tr>
              </table>
            </div>

            <div class="highlight-box">
              <h3>Your Login Credentials</h3>
              <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 2px solid #fde68a; font-weight: 700; color: #92400e; width: 50%; font-size: 15px;">Student ID</td>
                  <td style="padding: 12px 0; border-bottom: 2px solid #fde68a; color: #059669; font-size: 17px; font-weight: 700; font-family: monospace;">${student_id}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; font-weight: 700; color: #92400e; width: 50%; font-size: 15px;">Temporary Password</td>
                  <td style="padding: 12px 0; color: #92400e; font-size: 17px; font-weight: 700; font-family: monospace;">${password}</td>
                </tr>
              </table>
              <p style="margin: 20px 0 0 0; font-size: 14px; color: #92400e; line-height: 1.7;">
                <strong>Important Security Notice:</strong> You will be required to change your password on first login. Please choose a strong password (minimum 8 characters) that includes letters, numbers, and special characters.
              </p>
            </div>

            <p class="paragraph" style="margin-top: 32px;"><strong style="font-size: 18px; color: #1a202c;">What You Can Do Now:</strong></p>
            <ul style="margin: 16px 0; padding-left: 28px; color: #4a5568;">
              <li style="margin-bottom: 12px; line-height: 1.7;">Access your student portal at any time using your Student ID</li>
              <li style="margin-bottom: 12px; line-height: 1.7;">View your class schedule and join meeting links</li>
              <li style="margin-bottom: 12px; line-height: 1.7;">Track your progress through the program</li>
              <li style="margin-bottom: 12px; line-height: 1.7;">View your enrollment details and payment history</li>
              <li style="margin-bottom: 12px; line-height: 1.7;">Apply for additional programs when ready</li>
            </ul>

            <center>
              <a href="${baseUrl}/student" class="cta-button">Access Student Portal →</a>
            </center>

            <p class="paragraph" style="margin-top: 36px;"><strong style="font-size: 18px; color: #1a202c;">Important Reminders:</strong></p>
            <ul style="margin: 16px 0; padding-left: 28px; color: #4a5568;">
              <li style="margin-bottom: 12px; line-height: 1.7;"><strong>Save your credentials</strong> - Keep your Student ID and temporary password safe until you change it</li>
              <li style="margin-bottom: 12px; line-height: 1.7;"><strong>Change your password</strong> - Do this immediately on first login for security</li>
              <li style="margin-bottom: 12px; line-height: 1.7;"><strong>Check your schedule</strong> - Review your class times regularly for any updates</li>
              <li style="margin-bottom: 12px; line-height: 1.7;"><strong>Join on time</strong> - Use the meeting links provided for each session</li>
              <li style="margin-bottom: 12px; line-height: 1.7;"><strong>Stay updated</strong> - Keep your contact information current in the portal</li>
            </ul>

            <p class="paragraph" style="margin-top: 36px;">If you have any questions or need support, please don't hesitate to reach out to us at <a href="mailto:admin@tftmadrasah.nz" style="color: #059669; text-decoration: none; font-weight: 600;">admin@tftmadrasah.nz</a>.</p>

            <p class="paragraph" style="margin-top: 32px; font-style: italic; color: #6b7280;">May Allah make this journey beneficial for you and grant you success in your studies.</p>

            <p class="paragraph" style="margin-top: 36px; padding-top: 24px; border-top: 2px solid #e5e7eb;">
              Jazaakumullaahu Khayran,<br>
              <strong style="color: #059669;">The FastTrack Madrasah Team</strong>
            </p>
          </div>

          ${getFooterHTML()}
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

    const appUrl = baseUrl || Deno.env.get('APP_URL') || 'https://tftmadrasah.nz';
    const emailHTML = generateEmailHTML(studentData, appUrl);

    const result = await sendEmail({
      to: studentData.email,
      subject: 'Welcome to The FastTrack Madrasah!',
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
