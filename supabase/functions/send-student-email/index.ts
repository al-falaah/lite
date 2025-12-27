import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendEmail } from '../_shared/email.ts';
import { EMAIL_STYLES, getHeaderHTML, getFooterHTML } from '../_shared/email-template.ts';

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

      // Modern email template using shared styles
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
      ${getHeaderHTML(subject)}

      <div class="content">
        <h2 class="greeting">As-salāmu ʿalaykum ${studentName},</h2>

        <div style="color: #4a5568; font-size: 16px; line-height: 1.8; white-space: pre-wrap;">${message}</div>

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
