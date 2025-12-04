// Edge Function: Send Invite Email
// Triggered when admin approves application and sends invite

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
  .warning-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
`;

function generateEmailHTML(applicantData: any, signupUrl: string): string {
  const { full_name, program_type } = applicantData;

  const programName = program_type === 'foundational'
    ? '1-Year Foundational Certificate'
    : '3-Year Essentials Program';

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
          <h1>Congratulations!</h1>
          <p>Your Application Has Been Approved</p>
        </div>

        <div class="content">
          <h2>Assalaamu 'alaykum ${full_name},</h2>

          <p>We are delighted to inform you that your application to Al-Falaah Academy has been <strong>approved</strong>!</p>

          <div class="info-box">
            <p><strong>Program:</strong> ${programName}</p>
            <p>You are now ready to complete your enrollment and begin your journey in Islamic education.</p>
          </div>

          <p><strong>Next Steps:</strong></p>
          <ol>
            <li>Click the button below to create your account</li>
            <li>Set up your password</li>
            <li>Complete your enrollment</li>
            <li>Access your student dashboard</li>
          </ol>

          <center>
            <a href="${signupUrl}" class="button">Complete Enrollment →</a>
          </center>

          <div class="warning-box">
            <p><strong>Important:</strong> This invitation link will expire in 7 days. Please complete your enrollment as soon as possible.</p>
          </div>

          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #059669;">${signupUrl}</p>

          <p>If you have any questions or need assistance, please contact us at <a href="mailto:admin@alfalaah-academy.nz">admin@alfalaah-academy.nz</a>.</p>

          <p>We look forward to having you join our learning community!</p>

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
    const { applicantData, inviteToken, baseUrl } = await req.json();

    if (!applicantData || !applicantData.email || !inviteToken) {
      return new Response(
        JSON.stringify({ error: 'Missing required data' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const appUrl = baseUrl || Deno.env.get('APP_URL') || 'http://localhost:5173';
    const signupUrl = `${appUrl}/signup?token=${inviteToken}`;

    const emailHTML = generateEmailHTML(applicantData, signupUrl);

    const result = await sendEmail({
      to: applicantData.email,
      subject: 'Your Application Has Been Approved - Al-Falaah Academy',
      html: emailHTML,
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to send email');
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Invite email sent', signupUrl }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Error in send-invite-email:', error);
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
