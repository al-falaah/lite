// Edge Function: Send Message Email (Teacher <-> Student Communication)
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
  .content {
    padding: 40px;
  }
  .from-box {
    background: #f0fdf4;
    border-left: 4px solid #059669;
    padding: 16px;
    margin: 24px 0;
    border-radius: 6px;
  }
  .from-title {
    font-size: 14px;
    font-weight: 700;
    color: #047857;
    margin-bottom: 8px;
  }
  .from-info {
    font-size: 14px;
    color: #065f46;
  }
  .message-box {
    background: #ffffff;
    border: 1px solid #e5e7eb;
    padding: 20px;
    margin: 24px 0;
    border-radius: 6px;
  }
  .message-title {
    font-size: 16px;
    font-weight: 700;
    color: #111827;
    margin-bottom: 16px;
  }
  .message-content {
    font-size: 15px;
    color: #374151;
    line-height: 1.6;
    white-space: pre-wrap;
  }
  .reply-button {
    display: inline-block;
    background: #059669;
    color: white;
    padding: 14px 32px;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 600;
    font-size: 15px;
    margin: 24px 0;
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

function generateEmailHTML(messageData: any, recipientType: string): string {
  const { senderName, senderEmail, recipientName, recipientEmail, message, program } = messageData;

  const programName = program === 'tajweed' ? 'Tajweed Program' : 'Essential Arabic & Islamic Studies Program';
  const senderRole = recipientType === 'teacher' ? 'Student' : 'Teacher';

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
            <h1 class="header-title">New Message</h1>
          </div>

          <div class="content">
            <p style="font-size: 18px; font-weight: 600; color: #111827; margin-bottom: 16px;">
              As-salāmu ʿalaykum ${recipientName},
            </p>

            <p style="font-size: 15px; color: #374151; margin-bottom: 24px;">
              You have received a new message from your ${senderRole.toLowerCase()}.
            </p>

            <div class="from-box">
              <div class="from-title">From</div>
              <div class="from-info">
                <strong>${senderName}</strong><br>
                ${senderRole}<br>
                ${programName}
              </div>
            </div>

            <div class="message-box">
              <div class="message-title">Message</div>
              <div class="message-content">${message}</div>
            </div>

            <p style="font-size: 15px; color: #374151; margin-bottom: 16px;">
              You can reply to this message by emailing <a href="mailto:${senderEmail}" style="color: #059669; text-decoration: none; font-weight: 600;">${senderEmail}</a>
            </p>

            <p style="font-size: 14px; color: #6b7280; margin-top: 32px;">
              <strong>Note:</strong> This message was sent through the Al-Falaah Academy portal. Please maintain professional and respectful communication at all times.
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
    const { messageData, recipientType } = await req.json();

    if (!messageData || !messageData.recipientEmail || !messageData.senderName || !messageData.message) {
      return new Response(
        JSON.stringify({ error: 'Missing required message data' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!recipientType || !['teacher', 'student'].includes(recipientType)) {
      return new Response(
        JSON.stringify({ error: 'Invalid recipient type' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const emailHTML = generateEmailHTML(messageData, recipientType);

    const result = await sendEmail({
      to: messageData.recipientEmail,
      subject: `Message from ${messageData.senderName} - Al-Falaah Academy`,
      html: emailHTML,
      replyTo: messageData.senderEmail,
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to send email');
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Message sent successfully' }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Error in send-message-email:', error);
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
