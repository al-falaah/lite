// Edge Function: Send Welcome Email
// Triggered when student completes enrollment

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { sendEmail } from '../_shared/email.ts';
import { EMAIL_STYLES, getHeaderHTML, getFooterHTML } from '../_shared/email-template.ts';

function generateEmailHTML(studentData: any, baseUrl: string, inviteLink: string): string {
  const { full_name, email, student_id, program } = studentData;

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
              <h3>Activate Your Account</h3>
              <p style="margin: 16px 0; font-size: 15px; color: #92400e; line-height: 1.7;">
                Click the button below to set up your password and activate your student portal access. This link will expire in 24 hours.
              </p>
              <center style="margin: 24px 0;">
                <a href="${inviteLink}" class="cta-button" style="background: #059669; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block;">Set Up Your Account →</a>
              </center>
              <p style="margin: 20px 0 0 0; font-size: 14px; color: #92400e; line-height: 1.7;">
                <strong>Security Tip:</strong> Choose a strong password (minimum 8 characters) that includes letters, numbers, and special characters.
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

            <p class="paragraph" style="margin-top: 36px;"><strong style="font-size: 18px; color: #1a202c;">Getting Started:</strong></p>
            <ul style="margin: 16px 0; padding-left: 28px; color: #4a5568;">
              <li style="margin-bottom: 12px; line-height: 1.7;"><strong>Activate your account</strong> - Click the activation link above to set your password</li>
              <li style="margin-bottom: 12px; line-height: 1.7;"><strong>Save your Student ID</strong> - You'll use your email (${email}) to log in</li>
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
    const { studentData, baseUrl, inviteLink } = await req.json();

    if (!studentData || !studentData.email || !studentData.full_name) {
      return new Response(
        JSON.stringify({ error: 'Missing required student data' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!inviteLink) {
      return new Response(
        JSON.stringify({ error: 'Missing invite link' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const appUrl = baseUrl || Deno.env.get('APP_URL') || 'https://tftmadrasah.nz';
    const emailHTML = generateEmailHTML(studentData, appUrl, inviteLink);

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
