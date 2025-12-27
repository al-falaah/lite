// Edge Function: Send Message Email (Teacher <-> Student Communication)
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { sendEmail } from '../_shared/email.ts';
import { EMAIL_STYLES, getHeaderHTML, getFooterHTML } from '../_shared/email-template.ts';

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
          ${getHeaderHTML('New Message')}

          <div class="content">
            <h2 class="greeting">As-salāmu ʿalaykum ${recipientName},</h2>

            <p class="paragraph">
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

            <p class="paragraph">
              You can reply to this message by emailing <a href="mailto:${senderEmail}" style="color: #059669; text-decoration: none; font-weight: 600;">${senderEmail}</a>
            </p>

            <p class="paragraph" style="font-size: 14px; color: #6b7280; margin-top: 32px;">
              <strong>Note:</strong> This message was sent through the The FastTrack Madrasah portal. Please maintain professional and respectful communication at all times.
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
      subject: `Message from ${messageData.senderName} - The FastTrack Madrasah`,
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
