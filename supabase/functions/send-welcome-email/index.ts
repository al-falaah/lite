// Edge Function: Send Welcome Email
// Triggered when student completes enrollment

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { sendEmail } from '../_shared/email.ts';

const EMAIL_STYLES = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.6;
    color: #1f2937;
    background-color: #f9fafb;
  }
  .email-wrapper {
    background-color: #f9fafb;
    padding: 40px 20px;
  }
  .container {
    max-width: 600px;
    margin: 0 auto;
    background: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }
  .header {
    background: white;
    padding: 32px 40px 24px;
    text-align: center;
    border-bottom: 1px solid #e5e7eb;
  }
  .logo-container {
    margin-bottom: 16px;
  }
  .brand-name {
    font-size: 24px;
    font-weight: 700;
    color: #059669;
    margin: 8px 0 4px;
  }
  .brand-tagline {
    font-size: 13px;
    color: #6b7280;
    font-weight: 400;
  }
  .header-title {
    font-size: 28px;
    font-weight: 700;
    color: #111827;
    margin: 20px 0 8px;
  }
  .header-subtitle {
    font-size: 15px;
    color: #6b7280;
    margin: 0;
  }
  .content {
    padding: 40px;
  }
  .greeting {
    font-size: 20px;
    font-weight: 600;
    color: #111827;
    margin-bottom: 16px;
  }
  .paragraph {
    margin-bottom: 16px;
    color: #374151;
    font-size: 15px;
    line-height: 1.6;
  }
  .info-box {
    background: #f0fdf4;
    border-left: 4px solid #059669;
    padding: 20px;
    margin: 24px 0;
    border-radius: 6px;
  }
  .info-box-title {
    font-size: 18px;
    font-weight: 700;
    color: #047857;
    margin-bottom: 16px;
  }
  .info-box table {
    width: 100%;
    border-collapse: collapse;
  }
  .info-box td {
    padding: 8px 0;
    border-bottom: 1px solid #d1fae5;
  }
  .info-box tr:last-child td {
    border-bottom: none;
  }
  .label {
    font-weight: 600;
    color: #065f46;
    width: 40%;
  }
  .value {
    color: #374151;
  }
  .cta-button {
    display: inline-block;
    background: #059669;
    color: white;
    padding: 16px 40px;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 600;
    font-size: 16px;
    margin: 24px 0;
    transition: background 0.2s;
  }
  .cta-button:hover {
    background: #047857;
  }
  ul {
    margin: 16px 0;
    padding-left: 24px;
    color: #374151;
  }
  ul li {
    margin-bottom: 8px;
    line-height: 1.6;
  }
  .footer {
    text-align: center;
    padding: 32px 40px;
    background: #f9fafb;
    border-top: 1px solid #e5e7eb;
  }
  .footer-text {
    color: #6b7280;
    font-size: 13px;
    margin: 4px 0;
  }
  .footer-link {
    color: #059669;
    text-decoration: none;
  }
`;

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
          <div class="header">
            <div class="logo-container">
              <table cellpadding="0" cellspacing="0" border="0" align="center">
                <tr>
                  <td width="64" height="64" style="background: #059669; border-radius: 12px; text-align: center; vertical-align: middle;">
                    <span style="color: white; font-size: 20px; font-weight: bold; font-family: Arial, sans-serif; letter-spacing: 1px; line-height: 64px; display: inline-block;">AFA</span>
                  </td>
                </tr>
              </table>
            </div>
            <div class="brand-name">The FastTrack Madrasah</div>
            <div class="brand-tagline">الفلاح • Authentic Islamic Education</div>
            <h1 class="header-title">Welcome to Al-Falaah! 🌟</h1>
            <p class="header-subtitle">Your journey of knowledge begins now</p>
          </div>

          <div class="content">
            <h2 class="greeting">As-salāmu ʿalaykum ${full_name},</h2>

            <p class="paragraph">Welcome to The FastTrack Madrasah! We are thrilled to have you join our community of dedicated learners on the path of authentic Islamic knowledge.</p>

            <div class="info-box">
              <div class="info-box-title">Your Enrollment Details</div>
              <table>
                <tr>
                  <td class="label">Student ID</td>
                  <td class="value" style="color: #059669; font-size: 16px; font-weight: 600;">${student_id}</td>
                </tr>
                <tr>
                  <td class="label">Program</td>
                  <td class="value">${programName}</td>
                </tr>
                <tr>
                  <td class="label">Duration</td>
                  <td class="value">${programDuration}</td>
                </tr>
                <tr>
                  <td class="label">Status</td>
                  <td class="value" style="color: #059669; font-weight: 600;">✓ Active</td>
                </tr>
              </table>
            </div>

            <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 20px; margin: 24px 0; border-radius: 6px;">
              <div style="font-size: 18px; font-weight: 700; color: #92400e; margin-bottom: 16px;">🔐 Your Login Credentials</div>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #fde68a; font-weight: 600; color: #92400e; width: 50%;">Student ID</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #fde68a; color: #059669; font-size: 16px; font-weight: 600; font-family: monospace;">${student_id}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: 600; color: #92400e; width: 50%;">Temporary Password</td>
                  <td style="padding: 8px 0; color: #92400e; font-size: 16px; font-weight: 600; font-family: monospace;">${password}</td>
                </tr>
              </table>
              <p style="margin: 12px 0 0 0; font-size: 14px; color: #92400e; line-height: 1.6;"><strong>⚠️ Important:</strong> You will be required to change your password on first login for security. Please choose a strong password (minimum 8 characters).</p>
            </div>

            <p class="paragraph"><strong>What You Can Do Now:</strong></p>
            <ul>
              <li>Access your student portal at any time using your Student ID</li>
              <li>View your class schedule and meeting links</li>
              <li>Track your progress through the program</li>
              <li>View your enrollment details</li>
              <li>Apply for additional programs</li>
            </ul>

            <center>
              <a href="${baseUrl}/student" class="cta-button">Access Student Portal</a>
            </center>

            <p class="paragraph"><strong>Important Reminders:</strong></p>
            <ul>
              <li>Save your Student ID and temporary password - you'll need both to access the portal</li>
              <li>Change your temporary password on first login for security</li>
              <li>Check your class schedule regularly for upcoming sessions</li>
              <li>Join classes on time using the meeting links provided</li>
              <li>Keep your contact information up to date</li>
            </ul>

            <p class="paragraph">If you have any questions or need support, please don't hesitate to reach out to us at <a href="mailto:admin@tftmadrasah.nz" style="color: #059669; text-decoration: none;">admin@tftmadrasah.nz</a>.</p>

            <p class="paragraph">May Allah make this journey beneficial for you and grant you success in your studies.</p>

            <p class="paragraph" style="margin-top: 32px;">
              JazakAllah Khair,<br>
              <strong>The FastTrack Madrasah Team</strong>
            </p>
          </div>

          <div class="footer">
            <p class="footer-text"><strong>The FastTrack Madrasah</strong></p>
            <p class="footer-text">Authentic Islamic Education Rooted in the Qur'an and Sunnah</p>
            <p class="footer-text" style="margin-top: 16px;">
              <a href="mailto:admin@tftmadrasah.nz" class="footer-link">admin@tftmadrasah.nz</a>
            </p>
            <p class="footer-text" style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb;">
              © ${new Date().getFullYear()} The FastTrack Madrasah. All rights reserved.
            </p>
            <p class="footer-text">New Zealand</p>
          </div>
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
