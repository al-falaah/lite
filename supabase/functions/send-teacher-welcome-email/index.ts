// Edge Function: Send Teacher Welcome Email
// Triggered when admin creates a new teacher account

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { sendEmail } from '../_shared/email.ts';
import { EMAIL_STYLES, getHeaderHTML, getFooterHTML } from '../_shared/email-template.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function generateEmailHTML(teacherData: any, baseUrl: string): string {
  const { full_name, email, staff_id, password } = teacherData;

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
          ${getHeaderHTML('Welcome to The FastTrack Madrasah', 'Your teaching journey begins now')}

          <div class="content">
            <h2 class="greeting">As-salāmu ʿalaykum ${full_name},</h2>

            <p class="paragraph">Welcome to The FastTrack Madrasah teaching team! We are honored to have you join our mission to provide authentic Islamic education. Your role as an educator is crucial in guiding our students on their journey of knowledge.</p>

            <div class="info-box">
              <div class="info-box-title">Your Staff Account Details</div>
              <table>
                <tr>
                  <td class="label">Staff ID</td>
                  <td class="value" style="color: #059669; font-size: 18px; font-weight: 700; font-family: monospace;">${staff_id}</td>
                </tr>
                <tr>
                  <td class="label">Email</td>
                  <td class="value">${email}</td>
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
                  <td style="padding: 12px 0; border-bottom: 2px solid #fde68a; font-weight: 700; color: #92400e; width: 50%; font-size: 15px;">Staff ID</td>
                  <td style="padding: 12px 0; border-bottom: 2px solid #fde68a; color: #059669; font-size: 17px; font-weight: 700; font-family: monospace;">${staff_id}</td>
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

            <p class="paragraph" style="margin-top: 32px;"><strong style="font-size: 18px; color: #1a202c;">What You Can Do in the Teacher Portal:</strong></p>
            <ul style="margin: 16px 0; padding-left: 28px; color: #4a5568;">
              <li style="margin-bottom: 12px; line-height: 1.7;">View and manage your assigned students</li>
              <li style="margin-bottom: 12px; line-height: 1.7;">Update class schedules and meeting links</li>
              <li style="margin-bottom: 12px; line-height: 1.7;">Submit student progress reports</li>
              <li style="margin-bottom: 12px; line-height: 1.7;">Communicate with your students</li>
              <li style="margin-bottom: 12px; line-height: 1.7;">Access teaching resources and materials</li>
            </ul>

            <center>
              <a href="${baseUrl}/teacher" class="cta-button">Access Teacher Portal →</a>
            </center>

            <p class="paragraph" style="margin-top: 36px;"><strong style="font-size: 18px; color: #1a202c;">Important Reminders:</strong></p>
            <ul style="margin: 16px 0; padding-left: 28px; color: #4a5568;">
              <li style="margin-bottom: 12px; line-height: 1.7;"><strong>Save your credentials</strong> - Keep your Staff ID and temporary password safe until you change it</li>
              <li style="margin-bottom: 12px; line-height: 1.7;"><strong>Change your password</strong> - Do this immediately on first login for security</li>
              <li style="margin-bottom: 12px; line-height: 1.7;"><strong>Review your profile</strong> - Ensure your contact information is up to date</li>
              <li style="margin-bottom: 12px; line-height: 1.7;"><strong>Check assigned students</strong> - Review your student roster when available</li>
              <li style="margin-bottom: 12px; line-height: 1.7;"><strong>Prepare materials</strong> - Familiarize yourself with the curriculum and resources</li>
            </ul>

            <p class="paragraph" style="margin-top: 36px;">If you have any questions or need support, please don't hesitate to reach out to us at <a href="mailto:admin@tftmadrasah.nz" style="color: #059669; text-decoration: none; font-weight: 600;">admin@tftmadrasah.nz</a>.</p>

            <p class="paragraph" style="margin-top: 32px; font-style: italic; color: #6b7280;">May Allah bless your efforts in spreading knowledge and guide you in nurturing the next generation of students.</p>

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
        ...corsHeaders,
        'Access-Control-Allow-Methods': 'POST',
      },
    });
  }

  try {
    const { teacherData, baseUrl } = await req.json();

    if (!teacherData || !teacherData.email || !teacherData.full_name) {
      return new Response(
        JSON.stringify({ error: 'Missing required teacher data' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const appUrl = baseUrl || Deno.env.get('APP_URL') || 'https://tftmadrasah.nz';
    const emailHTML = generateEmailHTML(teacherData, appUrl);

    const result = await sendEmail({
      to: teacherData.email,
      subject: 'Welcome to The FastTrack Madrasah Teaching Team!',
      html: emailHTML,
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to send email');
    }

    console.log('✅ Teacher welcome email sent to:', teacherData.email);

    return new Response(
      JSON.stringify({ success: true, message: 'Welcome email sent' }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        },
      }
    );
  } catch (error) {
    console.error('Error in send-teacher-welcome-email:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        },
      }
    );
  }
});
