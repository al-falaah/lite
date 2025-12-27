// Edge Function: Send Application Confirmation Email
// Triggered when a new application is submitted

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { sendEmail } from '../_shared/email.ts';
import { EMAIL_STYLES, getHeaderHTML, getFooterHTML } from '../_shared/email-template.ts';

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
          ${getHeaderHTML('Application Received', 'We have received your application')}

          <div class="content">
            <h2 class="greeting">As-salāmu ʿalaykum ${full_name},</h2>

            <p class="paragraph">Jazaakumullaahu Khayran for your interest in The FastTrack Madrasah. We have received your application and are excited about the possibility of welcoming you to our learning community.</p>

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

            <p class="paragraph">If you have any questions, please don't hesitate to contact us at <a href="mailto:admin@tftmadrasah.nz" style="color: #059669; text-decoration: none; font-weight: 600;">admin@tftmadrasah.nz</a>.</p>

            <p class="paragraph">May Allah bless your journey of seeking knowledge.</p>

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
      subject: 'Application Received - The FastTrack Madrasah',
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
