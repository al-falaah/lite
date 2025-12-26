// Edge Function: Send Payment Instructions Email
// Triggered when application is approved

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
  .highlight-box {
    background: #fef3c7;
    border: 2px solid #f59e0b;
    padding: 20px;
    margin: 24px 0;
    border-radius: 8px;
  }
  .highlight-box h3 {
    margin-top: 0;
    color: #92400e;
    font-size: 18px;
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

function generateEmailHTML(applicantData: any, appUrl: string): string {
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
              <img src="https://tftmadrasah.nz/favicon.svg" alt="The FastTrack Madrasah Logo" width="64" height="64" style="display: block; margin: 0 auto;" />
            </div>
            <div class="brand-name">The FastTrack Madrasah</div>
            <div class="brand-tagline">الفلاح • Authentic Islamic Education</div>
            <h1 class="header-title">Congratulations! 🎉</h1>
            <p class="header-subtitle">Your application has been approved</p>
          </div>

          <div class="content">
            <h2 class="greeting">As-salāmu ʿalaykum ${full_name},</h2>

            <p class="paragraph">We are delighted to inform you that your application to The FastTrack Madrasah has been <strong>approved</strong>!</p>

            <div class="info-box">
              <div class="info-box-title">Your Program</div>
              <p class="paragraph" style="margin: 0;"><strong>${programName}</strong></p>
              <p class="paragraph" style="margin-top: 8px; margin-bottom: 0;">You are now ready to complete your enrollment and begin your journey in authentic Islamic education.</p>
            </div>

            <div class="highlight-box">
              <h3>Next Step: Complete Payment</h3>
              <p style="margin-bottom: 0;">Click the button below to proceed with secure online payment via Stripe.</p>
            </div>

            <center>
              <a href="${appUrl}/payment?email=${encodeURIComponent(email)}&program=${program}" class="cta-button">
                ${isTajweed ? 'Pay $120 Now' : 'Choose Payment Plan & Pay Now'}
              </a>
            </center>

            <p class="paragraph" style="text-align: center; font-size: 14px; color: #6b7280;">
              Secure payment powered by <strong>Stripe</strong> • Instant enrollment
            </p>

            <p class="paragraph"><strong>Complete Your Enrollment:</strong></p>
            <ol style="margin: 16px 0; padding-left: 24px; color: #374151;">
              <li style="margin-bottom: 8px;">Click the button above to access the payment page</li>
              <li style="margin-bottom: 8px;">${isTajweed ? 'Complete your $120 payment' : 'Choose your preferred payment plan (monthly or annual)'}</li>
              <li style="margin-bottom: 8px;">Complete secure payment via Stripe</li>
              <li style="margin-bottom: 8px;">You'll receive a welcome email with your student details</li>
              <li style="margin-bottom: 8px;">Your personalized classes will be scheduled</li>
            </ol>

            <p class="paragraph">If you have any questions about payment, please don't hesitate to contact us at <a href="mailto:admin@tftmadrasah.nz" style="color: #059669; text-decoration: none;">admin@tftmadrasah.nz</a>.</p>

            <p class="paragraph">We look forward to having you in our academy!</p>

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
    const { applicantData, appUrl } = await req.json();

    if (!applicantData || !applicantData.email || !applicantData.full_name) {
      return new Response(
        JSON.stringify({ error: 'Missing required applicant data' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const baseUrl = appUrl || Deno.env.get('APP_URL') || 'https://tftmadrasah.nz';
    const emailHTML = generateEmailHTML(applicantData, baseUrl);

    const result = await sendEmail({
      to: applicantData.email,
      subject: 'Application Approved - Payment Instructions | The FastTrack Madrasah',
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
