import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendEmail } from '../_shared/email.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { studentIds, subject, message, isHtml = false } = await req.json();

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Student IDs are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!subject || !message) {
      return new Response(
        JSON.stringify({ error: 'Subject and message are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch student emails
    const { data: students, error } = await supabase
      .from('students')
      .select('email, full_name')
      .in('id', studentIds);

    if (error) {
      console.error('Error fetching students:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch student emails' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!students || students.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No students found with provided IDs' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare email HTML with modern template
    const getEmailHtml = (studentName: string) => {
      if (isHtml) {
        return message;
      }

      // Modern email template matching the branding
      return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
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
  </style>
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
        <h1 class="header-title">${subject}</h1>
      </div>

      <div class="content">
        <h2 class="greeting">As-salāmu ʿalaykum ${studentName},</h2>

        <div style="color: #374151; line-height: 1.6; white-space: pre-wrap;">${message}</div>

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
    };

    // Send emails to all students
    const results = await Promise.all(
      students.map(async (student) => {
        const result = await sendEmail({
          to: student.email,
          subject: subject,
          html: getEmailHtml(student.full_name),
        });
        return {
          email: student.email,
          name: student.full_name,
          success: result.success,
          error: result.error,
        };
      })
    );

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    console.log(`Email sending completed: ${successCount} successful, ${failureCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        sent: successCount,
        failed: failureCount,
        results: results,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in send-student-email function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
