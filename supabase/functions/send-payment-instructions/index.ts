// Edge Function: Send Payment Instructions Email
// Triggered when application is approved

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { sendEmail } from '../_shared/email.ts';
import { EMAIL_STYLES, getHeaderHTML, getFooterHTML } from '../_shared/email-template.ts';
import { getProgram } from '../_shared/programs.ts';

function generateEmailHTML(applicantData: any, appUrl: string): string {
  const { full_name, email, program } = applicantData;

  // Get program details from centralized config
  const programConfig = getProgram(program);
  const programName = programConfig ? `${programConfig.name} (${programConfig.shortName})` : program;
  const isOneTimePayment = programConfig?.pricing.type === 'one-time';

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
          ${getHeaderHTML('Application Approved', 'Your application has been approved')}

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
                ${isOneTimePayment ? `Pay $${programConfig?.pricing.oneTime || 0} Now` : 'Choose Payment Plan & Pay Now'}
              </a>
            </center>

            <p class="paragraph" style="text-align: center; font-size: 14px; color: #6b7280;">
              Secure payment powered by <strong>Stripe</strong> • Instant enrollment
            </p>

            <p class="paragraph"><strong>Complete Your Enrollment:</strong></p>
            <ol style="margin: 16px 0; padding-left: 28px; color: #4a5568;">
              <li style="margin-bottom: 12px; line-height: 1.7; padding-left: 8px;">Click the button above to access the payment page</li>
              <li style="margin-bottom: 12px; line-height: 1.7; padding-left: 8px;">${isOneTimePayment ? `Complete your $${programConfig?.pricing.oneTime || 0} payment` : 'Choose your preferred payment plan (monthly or annual)'}</li>
              <li style="margin-bottom: 12px; line-height: 1.7; padding-left: 8px;">Complete secure payment via Stripe</li>
              <li style="margin-bottom: 12px; line-height: 1.7; padding-left: 8px;">You'll receive a welcome email with your student details</li>
              <li style="margin-bottom: 12px; line-height: 1.7; padding-left: 8px;">Your personalized classes will be scheduled</li>
            </ol>

            <p class="paragraph">If you have any questions about payment, please don't hesitate to contact us at <a href="mailto:admin@tftmadrasah.nz" style="color: #059669; text-decoration: none; font-weight: 600;">admin@tftmadrasah.nz</a>.</p>

            <p class="paragraph">We look forward to having you in our academy!</p>

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
