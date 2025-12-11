// Edge Function: Send Application Confirmation Email
// Triggered when a new application is submitted

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
  ol {
    margin: 16px 0;
    padding-left: 24px;
    color: #374151;
  }
  ol li {
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

function generateEmailHTML(applicantData: any): string {
  const { full_name, email, program } = applicantData;

  // Determine program-specific details
  const isTajweed = program === 'tajweed';
  const programName = isTajweed ? 'Tajweed Program' : 'Essential Arabic & Islamic Studies Program';
  const programDuration = isTajweed ? '6 months' : '2 years';

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
            <div class="brand-name">Al-Falaah Academy</div>
            <div class="brand-tagline">الفلاح • Authentic Islamic Education</div>
            <h1 class="header-title">Application Received</h1>
            <p class="header-subtitle">We have received your application</p>
          </div>

          <div class="content">
            <h2 class="greeting">As-salāmu ʿalaykum ${full_name},</h2>

            <p class="paragraph">Jazākumullāhu Khayran for your interest in Al-Falaah Academy. We have received your application and are excited about the possibility of welcoming you to our learning community.</p>

            <div class="info-box">
              <div class="info-box-title">Application Summary</div>
              <table>
                <tr>
                  <td class="label">Applicant Name</td>
                  <td class="value">${full_name}</td>
                </tr>
                <tr>
                  <td class="label">Email Address</td>
                  <td class="value">${email}</td>
                </tr>
                <tr>
                  <td class="label">Program</td>
                  <td class="value">${programName}</td>
                </tr>
                <tr>
                  <td class="label">Duration</td>
                  <td class="value">${programDuration}</td>
                </tr>
              </table>
            </div>

            <p class="paragraph"><strong>What happens next?</strong></p>
            <ol>
              <li>Our admissions team will review your application</li>
              <li>Once approved, you'll receive an email with payment instructions</li>
              <li>After payment, you'll be enrolled and can begin your learning journey</li>
            </ol>

            <p class="paragraph">If you have any questions, please don't hesitate to contact us at <a href="mailto:admin@alfalaah-academy.nz" style="color: #059669; text-decoration: none;">admin@alfalaah-academy.nz</a>.</p>

            <p class="paragraph">May Allah bless your journey of seeking knowledge.</p>

            <p class="paragraph" style="margin-top: 32px;">
              JazakAllah Khair,<br>
              <strong>Al-Falaah Academy Team</strong>
            </p>
          </div>

          <div class="footer">
            <p class="footer-text"><strong>Al-Falaah Academy</strong></p>
            <p class="footer-text">Authentic Islamic Education Rooted in the Qur'an and Sunnah</p>
            <p class="footer-text" style="margin-top: 16px;">
              <a href="mailto:admin@alfalaah-academy.nz" class="footer-link">admin@alfalaah-academy.nz</a>
            </p>
            <p class="footer-text" style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb;">
              © ${new Date().getFullYear()} Al-Falaah Academy. All rights reserved.
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
